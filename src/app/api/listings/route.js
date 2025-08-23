import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import FoodListing from "@/models/FoodListing";
import {
  sendNotificationToUser,
  sendNotificationToRole,
} from "@/lib/notificationService";
import {
  createMongoNotification,
  sendCompleteNotification,
  sendCompleteNotificationToRole,
  NOTIFICATION_TYPES,
} from "@/lib/mongoNotificationService";
import {
  sendSSENotification,
  sendSSENotificationToRole,
} from "@/lib/sendSSENotification";
import ngoNotificationService from "@/services/ngoNotificationService";

// GET - Retrieve listings with pagination and filtering
export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const providerId = searchParams.get("providerId");

    const query = {};
    if (providerId) {
      query.providerId = providerId;
    }

    const listings = await FoodListing.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await FoodListing.countDocuments(query);

    // Transform listings - quantity is now permanently reduced, so available = current quantity
    const transformed = listings.map((doc) => {
      const plain = doc.toObject();
      const available = Math.max(0, plain.quantity || 0);

      return {
        _id: plain._id,
        title: plain.title,
        description: plain.description,
        category: plain.category,
        foodType: plain.foodType,
        quantity: plain.quantity,
        unit: plain.unit,
        freshnessStatus: plain.freshnessStatus,
        freshnessHours: plain.freshnessHours,
        availabilityWindow: plain.availabilityWindow,
        location: plain.location,
        expiryTime: plain.expiryTime,
        isActive: plain.isActive,
        providerId: plain.providerId,
        providerName: plain.providerName,
        imageUrl: plain.imageUrl,
        bookings: plain.bookings,
        totalBookedQuantity: plain.totalBookedQuantity,
        listingStatus: plain.listingStatus,
        contactInfo: plain.contactInfo,
        createdAt: plain.createdAt,
        updatedAt: plain.updatedAt,
        available,
      };
    });

    return NextResponse.json({
      success: true,
      data: transformed,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total: total,
      },
    });
  } catch (error) {
    console.error("GET /api/listings error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch listings" },
      { status: 500 }
    );
  }
}

// POST - Create new listing with SSE + FCM + MongoDB notifications
export async function POST(request) {
  try {
    await connectDB();

    const body = await request.json();

    console.log("📝 POST /api/listings - Received body:");
    console.log("📋 Full request body:", JSON.stringify(body, null, 2));
    console.log("🖼️ imageUrl in request:", body.imageUrl);

    console.log("🔍 POST /api/listings - Received body:");
    console.log("📋 Full request body:", JSON.stringify(body, null, 2));
    console.log("🖼️ imageUrl in request:", body.imageUrl);

    // Validate required fields
    const {
      title,
      quantity,
      freshnessStatus,
      availabilityWindow,
      location,
      expiryTime,
      providerId,
      providerName,
      foodType,
    } = body;

    console.log("✅ Required fields check:");
    console.log("- title:", !!title);
    console.log("- quantity:", !!quantity);
    console.log("- freshnessStatus:", !!freshnessStatus);
    console.log("- availabilityWindow:", !!availabilityWindow);
    console.log("- location:", !!location);
    console.log("- expiryTime:", !!expiryTime);
    console.log("- providerId:", !!providerId);
    console.log("- foodType:", !!foodType);

    if (
      !title ||
      !quantity ||
      !freshnessStatus ||
      !availabilityWindow ||
      !location ||
      !expiryTime ||
      !providerId ||
      !foodType
    ) {
      console.log("❌ Missing required fields");
      console.log("Missing fields:", {
        title: !title,
        quantity: !quantity,
        freshnessStatus: !freshnessStatus,
        availabilityWindow: !availabilityWindow,
        location: !location,
        expiryTime: !expiryTime,
        providerId: !providerId,
        foodType: !foodType,
      });
      return NextResponse.json(
        {
          success: false,
          error:
            "Missing required fields. Food type (Vegetarian/Non-Vegetarian) is required.",
        },
        { status: 400 }
      );
    }

    // Validate dates
    const startTime = new Date(availabilityWindow.startTime);
    const endTime = new Date(availabilityWindow.endTime);
    const expiry = new Date(expiryTime);

    if (startTime >= endTime) {
      console.log("❌ Invalid time range");
      return NextResponse.json(
        {
          success: false,
          error: "End time must be after start time",
        },
        { status: 400 }
      );
    }

    if (expiry <= new Date()) {
      console.log("❌ Invalid expiry time");
      return NextResponse.json(
        {
          success: false,
          error: "Expiry time must be in the future",
        },
        { status: 400 }
      );
    }

    // Create listing data
    const parsedQuantity = parseInt(quantity, 10);
    const isHighQuantity = parsedQuantity > 50;
    const now = new Date();
    const ngoOnlyUntil = isHighQuantity ? new Date(now.getTime() + 30 * 60 * 1000) : null; // 30 minutes from now

    const listingData = {
      title,
      description: body.description || "",
      category: body.category || "",
      foodType: body.foodType, // Add food type field
      quantity: parsedQuantity,
      unit: body.unit || "",
      freshnessStatus,
      freshnessHours: body.freshnessHours || 24,
      availabilityWindow: {
        startTime,
        endTime,
      },
      location,
      expiryTime: expiry,
      providerId,
      providerName,
      imageUrl: body.imageUrl || "",
      providerName: providerName || "Provider", // Fallback if providerName is empty
      imageUrl: body.imageUrl || "", // ✅ Always include imageUrl, even if empty
      bookedBy: body.bookedBy || [],
      remainingQuantity: body.remainingQuantity || parsedQuantity,
      isActive: body.isActive !== undefined ? body.isActive : true,
      // NGO Priority fields
      isNGOPriority: isHighQuantity,
      ngoOnlyUntil: ngoOnlyUntil,
    };

    console.log("📦 Final listing data to save:");
    console.log("🖼️ imageUrl being saved:", listingData.imageUrl);
    console.log("📦 Final listing data to save:");
    console.log("🖼️ imageUrl being saved:", listingData.imageUrl);
    console.log("📋 Full listing data:", JSON.stringify(listingData, null, 2));

    const newListing = new FoodListing(listingData);
    const savedListing = await newListing.save();

    console.log("✅ Listing saved successfully:");
    console.log("🆔 Saved listing ID:", savedListing._id);
    console.log("🖼️ Saved imageUrl:", savedListing.imageUrl);

    // 🚨 Check for bulk listing and notify NGOs if quantity >= 50
    let ngoNotificationResult = null;
    try {
      if (savedListing.quantity >= 50) {
        console.log(`🚨 Bulk listing detected (${savedListing.quantity} items). Notifying NGOs...`);

        ngoNotificationResult = await ngoNotificationService.notifyNGOsOfBulkListing(
          savedListing.toObject(),
          {
            name: providerName,
            email: "", // We don't have provider email here, but NGO service will handle it
            id: providerId
          }
        );

        console.log("📧 NGO notification result:", ngoNotificationResult);
      } else {
        console.log(`📦 Regular listing (${savedListing.quantity} items). No NGO notification needed.`);
      }
    } catch (ngoError) {
      console.error("❌ Failed to notify NGOs:", ngoError);
      // Don't fail the whole request if NGO notification fails
    }

    // 📢 Send notifications to recipients
    try {
      console.log("📢 Sending notifications to all recipients");

      const notificationData = {
        listingId: savedListing._id.toString(),
        providerId: savedListing.providerId,
        location: savedListing.location,
        category: savedListing.category || "food",
        action: "new_listing",
      };

      // 📱 Send FCM to recipients by role
      const roleNotificationResult = await sendNotificationToRole(
        "RECIPIENT",
        "New Food Available! 🍽️",
        `${title} is available in ${location}. Grab it before it's gone!`,
        notificationData
      );
      console.log(
        "📨 Recipients FCM notification result:",
        roleNotificationResult
      );

      console.log(
        "📨 Recipients FCM notification result:",
        roleNotificationResult
      );

      // 📡 Send SSE to all connected recipients
      const sseResult = await sendSSENotificationToRole("recipient", {
        title: "New Food Available! 🍽️",
        message: `${title} is available in ${location}. Grab it before it's gone!`,
        type: "success",
        data: notificationData,
      });
      console.log("📡 Recipients SSE notification result:", sseResult);

      // For MongoDB notifications to recipients, you'd need to implement
      // a way to get all recipient user IDs. For now, we'll focus on
      // individual notifications (provider confirmation and booking notifications)
    } catch (notificationError) {
      console.error(
        "❌ Recipients notification sending failed:",
        notificationError
      );
    }

    // 📢 Send confirmation to provider
    try {
      console.log("📢 Sending listing confirmation to provider:", providerId);

      // 📡 Send SSE to provider (stores in DB + real-time notification)
      const providerSSEResult = await sendSSENotification(providerId, {
        title: "Listing Created Successfully! ✅",
        message: `Your food listing "${title}" has been posted and recipients have been notified.`,
        type: "listing_created_confirmation",
        data: {
          listingId: savedListing._id.toString(),
          action: "listing_created_confirmation",
          listingTitle: title,
          location: location,
        },
      });
      console.log("📡 Provider SSE result:", providerSSEResult);

      // // 📱 FCM notification (commented out - using SSE for real-time)
      // const providerNotificationResult = await sendCompleteNotification(
      //   providerId,
      //   "Listing Created Successfully! ✅",
      //   `Your food listing "${title}" has been posted and recipients have been notified.`,
      //   {
      //     listingId: savedListing._id.toString(),
      //     action: "listing_created_confirmation",
      //   },
      //   {
      //     type: NOTIFICATION_TYPES.LISTING_CREATED_CONFIRMATION,
      //     listingId: savedListing._id.toString(),
      //     listingTitle: title,
      //     location: location,
      //   }
      // );
    } catch (notificationError) {
      console.error(
        "❌ Failed to send provider confirmation:",
        notificationError
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: savedListing,
        notifications: {
          sent: true,
          recipientsNotified: true,
          providerConfirmed: true,
          sseNotifications: true,
          ngoNotified: ngoNotificationResult ? ngoNotificationResult.emailsSent > 0 : false,
          ngoNotificationDetails: ngoNotificationResult,
        },
      },
      { status: 201 }
    );


  } catch (error) {
    console.error("❌ POST /api/listings error:", error);

    if (error.name === "ValidationError") {
      console.log("❌ Mongoose validation error:", error.message);
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 400 }
      );
    }

    console.error("❌ POST /api/listings error:", error);

    if (error.name === "ValidationError") {
      console.log("❌ Mongoose validation error:", error.message);
      console.log("❌ Validation errors:", error.errors);
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create listing",
      },
      { status: 500 }
    );
  }
}

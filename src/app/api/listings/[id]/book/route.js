import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/db";
import FoodListing from "@/models/FoodListing";
import Booking from "@/models/Booking";
import UserProfile from "@/models/UserProfile";
import mongoose from "mongoose";
import { QRCodeService } from "@/lib/qrCodeService";
import { sendSSENotification } from "@/lib/sendSSENotification";


export async function POST(request, { params }) {
  const { id } = await params;
  const { userId } = await auth(request);
  const { requestedQuantity, recipientName, requestMessage } =
    await request.json();

  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return new NextResponse("Invalid Food Listing ID", { status: 400 });
  }

  await connectDB();
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Check user booking permissions first
    const userProfile = await UserProfile.findOne({ userId }).session(session);

    if (!userProfile) {
      throw new Error("User profile not found");
    }

    // Check if user is allowed to book
    if (userProfile.userStatus === "REJECTED") {
      throw new Error(
        "BOOKING_SUSPENDED: Due to inappropriate behavior, you have been temporarily suspended from booking food. Please maintain good behavior and wait some days."
      );
    }

    if (userProfile.userStatus === "BLOCKED") {
      throw new Error(
        "BOOKING_BLOCKED: Your account has been blocked. Please contact support for assistance."
      );
    }

    const foodListing = await FoodListing.findById(id).session(session);

    if (!foodListing) {
      throw new Error("Food listing not found");
    }

    // Validation checks
    if (foodListing.expiryTime <= new Date()) {
      throw new Error("This food listing has expired.");
    }

    if (foodListing.availableQuantity < requestedQuantity) {
      throw new Error("Not enough quantity available to fulfill this request.");
    }

    if (
      foodListing.listingStatus === "fully_booked" ||
      foodListing.listingStatus === "expired" ||
      !foodListing.isActive
    ) {
      throw new Error("Food listing is no longer available.");
    }

    if (
      foodListing.listingStatus === "fully_booked" ||
      foodListing.listingStatus === "expired" ||
      !foodListing.isActive
    ) {
      throw new Error("Food listing is no longer available.");
    }

    // Create booking
    const collectionCode = QRCodeService.generateCollectionCode();
    const qrCodeExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const booking = new Booking({
      listingId: id,
      providerId: foodListing.providerId,
      providerName: foodListing.providerName,
      recipientId: userId,
      recipientName: recipientName,
      requestedQuantity: requestedQuantity,
      approvedQuantity: requestedQuantity,
      qrCodeExpiry,
      collectionCode,
      requestMessage: requestMessage,
      status: "approved",
      approvedAt: new Date(),
    });

    const timestamp = new Date().toISOString();
    const finalQRData = QRCodeService.generateQRData(
      booking._id.toString(),
      userId,
      id,
      timestamp
    );
    const qrCodeImage = await QRCodeService.generateQRCode(finalQRData);


    booking.qrCode = finalQRData;
    await booking.save({ session });

    const embeddedBookingRequest = {
      recipientId: userId,
      recipientName: recipientName,
      requestedQuantity: requestedQuantity,
      approvedQuantity: requestedQuantity,
      status: "approved",
      status: "approved",
      requestMessage: requestMessage,
      bookingRefId: booking._id,
      approvedAt: new Date(),
    };


    foodListing.bookings.push(embeddedBookingRequest);

    // PERMANENTLY REDUCE THE QUANTITY
    foodListing.quantity = Math.max(0, foodListing.quantity - requestedQuantity);
    console.log(`📦 Quantity reduced: ${foodListing.quantity + requestedQuantity} → ${foodListing.quantity}`);

    // If quantity becomes 0, mark as fully booked and inactive
    if (foodListing.quantity <= 0) {
      foodListing.listingStatus = "fully_booked";
      foodListing.isActive = false;
      console.log("🚫 Food listing is now fully booked and inactive");
    }

    await foodListing.save({ session });

    const recipientUser = await UserProfile.findOne({ userId: userId }).session(session);
    if (recipientUser) {
      await recipientUser.save({ session });
    } else {
      console.warn(
        `User profile with userId ${userId} not found. Continuing without adding booking to profile.`
      );
    }

    await session.commitTransaction();

    // 📡 Send SSE notifications
    const recipientSSEResult = sendSSENotification(userId, {
      title: "Booking Confirmed! ✅",
      message: `Your booking for "${foodListing.title}" has been confirmed. Show your QR code when collecting.`,
      type: "success",
      data: {
        bookingId: booking._id.toString(),
        listingId: id,
        action: "booking_confirmed",
        collectionCode: collectionCode,
      },
    });

    const providerSSEResult = sendSSENotification(foodListing.providerId, {
      title: "New Booking Received! 📋",
      message: `${recipientName} has booked "${foodListing.title}" (${requestedQuantity} ${foodListing.unit || "items"})`,
      type: "success",
      data: {
        bookingId: booking._id.toString(),
        listingId: id,
        recipientId: userId,
        action: "new_booking",
      },
    });

    console.log('📡 Recipient SSE result:', recipientSSEResult);
    console.log('📡 Provider SSE result:', providerSSEResult);

    // 📱 Send FCM + Firestore notifications
    try {
    // 🔔 Send booking confirmation notification to recipient (FCM + Firestore)
    try {
      console.log("📢 Sending booking confirmation to recipient:", userId);

      const recipientNotificationResult = await sendCompleteNotification(
        userId,
        "Booking Confirmed! ✅",
        "Booking Confirmed! ✅",
        `Your booking for "${foodListing.title}" has been confirmed. Show your QR code when collecting.`,
        {
          bookingId: booking._id.toString(),
          listingId: id,
          action: "booking_confirmed",
          collectionCode: collectionCode,
          action: "booking_confirmed",
          collectionCode: collectionCode,
        },
        {
          type: NOTIFICATION_TYPES.BOOKING_CONFIRMED,
          bookingId: booking._id.toString(),
          listingId: id,
          listingTitle: foodListing.title,
          providerName: foodListing.providerName,
          quantity: requestedQuantity,
          unit: foodListing.unit || "items",
          collectionCode: collectionCode,
          unit: foodListing.unit || "items",
          collectionCode: collectionCode,
        }
      );
      console.log('📨 Recipient FCM+Firestore result:', recipientNotificationResult);


      console.log(
        "📨 Recipient notification result:",
        recipientNotificationResult
      );
    } catch (notificationError) {
      console.error(
        "❌ Failed to send booking confirmation notification:",
        notificationError
      );
    }

    // 🔔 Send booking notification to provider (FCM + Firestore)
    try {
      console.log(
        "📢 Sending new booking notification to provider:",
        foodListing.providerId
      );

      const providerNotificationResult = await sendCompleteNotification(
        foodListing.providerId,
        "New Booking Received! 📋",
        `${recipientName} has booked "${foodListing.title}" (${requestedQuantity} ${foodListing.unit || "items"})`,
        "New Booking Received! 📋",
        `${recipientName} has booked "${
          foodListing.title
        }" (${requestedQuantity} ${foodListing.unit || "items"})`,
        {
          bookingId: booking._id.toString(),
          listingId: id,
          recipientId: userId,
          action: "new_booking",
          action: "new_booking",
        },
        {
          type: NOTIFICATION_TYPES.NEW_BOOKING,
          bookingId: booking._id.toString(),
          listingId: id,
          listingTitle: foodListing.title,
          recipientId: userId,
          recipientName: recipientName,
          quantity: requestedQuantity,
          unit: foodListing.unit || "items",
          requestMessage: requestMessage,
          unit: foodListing.unit || "items",
          requestMessage: requestMessage,
        }
      );
      console.log('📨 Provider FCM+Firestore result:', providerNotificationResult);
      

      console.log(
        "📨 Provider notification result:",
        providerNotificationResult
      );
    } catch (notificationError) {
      console.error("❌ Failed to send FCM+Firestore notifications:", notificationError);
      console.error(
        "❌ Failed to send provider notification:",
        notificationError
      );
    }

    const bookingResponse = {
      ...booking.toObject(),
      qrCodeImage,
      collectionInstructions: {
        message: "Show this QR code to the provider when collecting your food",
        backupCode: collectionCode,
        expiresAt: qrCodeExpiry,
        steps: [
          "Arrive at the pickup location on time",
          "Show this QR code to the provider",
          "If QR doesn't work, provide the 6-digit backup code",
          "Collect your food and enjoy!",
        ],
      },
      notifications: {
        sseNotifications: {
          recipient: recipientSSEResult,
          provider: providerSSEResult
        }
      }
    };

    return NextResponse.json(bookingResponse, { status: 201 });
    
  } catch (error) {
    await session.abortTransaction();
    console.error("❌ Booking transaction error:", error);
    return new NextResponse(
      error.message || "Booking failed due to an unexpected error.",
      {
        status:
          error.message.includes("Not enough quantity") ||
          error.message.includes("expired")
            ? 400
            : 500,
      }
    );
    console.error("Booking transaction error:", error);
    return new NextResponse(
      error.message || "Booking failed due to an unexpected error.",
      {
        status:
          error.message.includes("Not enough quantity") ||
          error.message.includes("expired")
            ? 400
            : 500,
      }
    );
  } finally {
    session.endSession();
  }
} catch (error) {
    await session.abortTransaction();
    console.error("❌ Booking transaction error:", error);
    return new NextResponse(
      error.message || "Booking failed due to an unexpected error.",
      {
        status:
          error.message.includes("Not enough quantity") ||
          error.message.includes("expired")
            ? 400
            : 500,
      }
    );
  } finally {
    session.endSession();
  }
}

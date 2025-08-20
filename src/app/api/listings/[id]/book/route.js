// app/api/listings/[id]/book/route.js (Updated with Firestore notifications)
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/db";
import FoodListing from "@/models/FoodListing";
import Booking from "@/models/Booking";
import UserProfile from "@/models/UserProfile";
import mongoose from "mongoose";
import { QRCodeService } from "@/lib/qrCodeService";
import {
  sendCompleteNotification,
  NOTIFICATION_TYPES,
} from "@/lib/firestoreNotificationService";

export async function POST(request, { params }) {
  const { id } = await params; // This is the listing ID
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

    // --- AUTOMATED CHECKS ---
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

    // --- ALL CHECKS PASSED ---
    const collectionCode = QRCodeService.generateCollectionCode();
    const qrCodeExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const booking = new Booking({
      listingId: id,
      providerId: foodListing.providerId,
      providerName: foodListing.providerName,
      recipientId: userId,
      recipientName: recipientName,
      requestedQuantity: requestedQuantity,
      approvedQuantity: requestedQuantity, // Auto-approve the requested quantity
      qrCodeExpiry,
      collectionCode,
      requestMessage: requestMessage,
      status: "approved", // AUTOMATICALLY CONFIRMED
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
      requestMessage: requestMessage,
      bookingRefId: booking._id,
      approvedAt: new Date(),
    };

    foodListing.bookings.push(embeddedBookingRequest);
    await foodListing.save({ session });

    // --- THE FIX: Use { userId: userId } instead of { clerkId: userId } ---
    const recipientUser = await UserProfile.findOne({ userId: userId }).session(
      session
    );
    if (recipientUser) {
      await recipientUser.save({ session });
    } else {
      console.warn(
        `User profile with userId ${userId} not found. Continuing without adding booking to profile.`
      );
    }

    await session.commitTransaction();

    // 🔔 Send booking confirmation notification to recipient (FCM + Firestore)
    try {
      console.log("📢 Sending booking confirmation to recipient:", userId);

      const recipientNotificationResult = await sendCompleteNotification(
        userId,
        "Booking Confirmed! ✅",
        `Your booking for "${foodListing.title}" has been confirmed. Show your QR code when collecting.`,
        {
          bookingId: booking._id.toString(),
          listingId: id,
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
        }
      );

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
        `${recipientName} has booked "${
          foodListing.title
        }" (${requestedQuantity} ${foodListing.unit || "items"})`,
        {
          bookingId: booking._id.toString(),
          listingId: id,
          recipientId: userId,
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
        }
      );

      console.log(
        "📨 Provider notification result:",
        providerNotificationResult
      );
    } catch (notificationError) {
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
    };

    return NextResponse.json(bookingResponse, { status: 201 });
  } catch (error) {
    await session.abortTransaction();
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
}

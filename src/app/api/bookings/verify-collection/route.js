// app/api/bookings/verify-collection/route.js (Updated with SSE notifications)
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/db";
import Booking from "@/models/Booking";
import FoodListing from "@/models/FoodListing";
import UserProfile from "@/models/UserProfile";
import { QRCodeService } from "@/lib/qrCodeService";
import {
  sendCompleteNotification,
  NOTIFICATION_TYPES,
} from "@/lib/mongoNotificationService";
import { sendSSENotification } from "@/lib/sendSSENotification";
import mongoose from "mongoose";

export async function POST(request) {
  const { userId: providerClerkId } = await auth();

  if (!providerClerkId) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  await connectDB();
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const body = await request.json();
    const { qrData, collectionCode, listingId } = body;

    if (!listingId) {
      throw new Error("Listing ID is required for verification.");
    }

    const listing = await FoodListing.findById(listingId).session(session);
    if (!listing) {
      throw new Error("Food listing not found");
    }

    if (listing.providerId !== providerClerkId) {
      throw new Error("Not authorized to verify collections for this listing");
    }

    let booking = null;

    if (qrData) {
      const qrVerification = QRCodeService.verifyQRData(qrData);
      if (!qrVerification.isValid) {
        throw new Error("Invalid QR code format");
      }

      const {
        bookingId,
        recipientId,
        listingId: qrListingId,
      } = qrVerification.data;

      if (qrListingId !== listingId) {
        throw new Error("QR code does not match this listing");
      }

      booking = await Booking.findById(bookingId).session(session);
      if (!booking) {
        throw new Error("Booking not found from QR code");
      }

      if (booking.recipientId !== recipientId) {
        throw new Error("QR code does not belong to the booking recipient");
      }
    } else if (collectionCode) {
      booking = await Booking.findOne({
        listingId: listingId,
        collectionCode: collectionCode,
      }).session(session);

      if (!booking) {
        throw new Error("Invalid collection code for this listing");
      }
    } else {
      throw new Error("Either QR data or collection code is required");
    }

    if (booking.status === "collected") {
      throw new Error("This booking has already been collected.");
    }

    if (booking.status !== "approved") {
      throw new Error(
        `Cannot collect a booking with status: ${booking.status}`
      );
    }

    if (booking.qrCodeExpiry && new Date(booking.qrCodeExpiry) < new Date()) {
      booking.status = "expired";
      await booking.save({ session });
      throw new Error("This booking has expired.");
    }

    const collectionTime = new Date();
    const previousStatus = booking.status;

    // Update booking status to collected
    booking.status = "collected";
    booking.collectedAt = collectionTime;
    booking.collectionVerifiedBy = providerClerkId;

    // Update embedded booking in listing
    const embeddedBooking = listing.bookings.find(
      (b) =>
        b.bookingRefId && b.bookingRefId.toString() === booking._id.toString()
    );

    if (embeddedBooking) {
      embeddedBooking.status = "collected";
      embeddedBooking.collectedAt = collectionTime;
    }

    // Save both booking and listing
    await booking.save({ session });
    await listing.save({ session });

    // Update user stats
    await UserProfile.findOneAndUpdate(
      { userId: providerClerkId },
      {
        $inc: {
          "stats.totalItemsShared": booking.approvedQuantity,
          "stats.totalBookingsCompleted": 1,
        },
        $set: { "stats.lastActivity": collectionTime },
      },
      { session, new: true }
    );

    await UserProfile.findOneAndUpdate(
      { userId: booking.recipientId },
      {
        $inc: {
          "stats.totalItemsClaimed": booking.approvedQuantity,
          "stats.totalBookingsCompleted": 1,
        },
        $set: { "stats.lastActivity": collectionTime },
      },
      { session, new: true }
    );

    // Commit the transaction first to ensure data is saved
    await session.commitTransaction();

    const recipient = await UserProfile.findOne({
      userId: booking.recipientId,
    }).lean();

    // --- Start: Notifications Update ---
    // Using SSE-only approach for real-time notifications (stores in DB + sends SSE)

    // 📡 Send SSE notification to recipient (stores in DB + real-time update)
    try {
      await sendSSENotification(booking.recipientId, {
        title: "Food Collected Successfully! 🎉",
        message: `You've successfully collected "${listing.title}". Enjoy your meal!`,
        type: 'collection_confirmed',
        data: {
          bookingId: booking._id.toString(),
          listingId: listing._id.toString(),
          action: "collection_confirmed",
          collectedAt: collectionTime.toISOString(),
          autoCloseQR: true, // For the frontend to auto-close the modal
          listingTitle: listing.title,
          providerName: listing.providerName,
          quantity: booking.approvedQuantity,
          unit: listing.unit || "items",
        }
      });
      console.log("✅ Recipient SSE notification sent");
    } catch (notificationError) {
      console.error(
        "❌ Failed to send recipient SSE notification:",
        notificationError
      );
    }

    // 📡 Send SSE notification to provider (stores in DB + real-time update)
    try {
      await sendSSENotification(providerClerkId, {
        title: "Food Collected Successfully! ✅",
        message: `${recipient?.fullName || "A recipient"} has collected "${listing.title}". Thanks for sharing food!`,
        type: 'collection_completed_confirmation',
        data: {
          bookingId: booking._id.toString(),
          listingId: listing._id.toString(),
          recipientId: booking.recipientId,
          action: "collection_completed_confirmation",
          collectedAt: collectionTime.toISOString(),
          listingTitle: listing.title,
          recipientName: recipient?.fullName || "A recipient",
          quantity: booking.approvedQuantity,
          unit: listing.unit || "items",
        }
      });
      console.log("✅ Provider SSE notification sent");
    } catch (notificationError) {
      console.error(
        "❌ Failed to send provider SSE notification:",
        notificationError
      );
    }

    // 🔔 FCM notifications (commented out for now - focusing on SSE real-time)
    // try {
    //   await sendCompleteNotification(...);
    // } catch (error) {
    //   console.error("FCM notification error:", error);
    // }

    // --- End: Notifications Update ---

    return NextResponse.json({
      success: true,
      message: "Food collection verified successfully!",
      data: {
        booking: {
          _id: booking._id,
          status: booking.status,
          previousStatus,
          collectedAt: booking.collectedAt,
          collectionVerifiedBy: booking.collectionVerifiedBy,
          recipientId: booking.recipientId,
          recipientName: recipient ? recipient.fullName : "Unknown",
        },
        listing: {
          _id: listing._id,
          title: listing.title,
        },
      },
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("❌ Collection verification error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to verify collection",
        error: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 400 }
    );
  } finally {
    session.endSession();
  }
}
// File: app/api/bookings/verify-collection/route.js
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/dbConnect";
import Booking from "@/models/Booking";
import Listing from "@/models/Listing";
import UserProfile from "@/models/UserProfile";
import { sendCompleteNotification } from "@/lib/notifications";

// POST /api/bookings/verify-collection
export async function POST(req) {
  try {
    await dbConnect();
    const { bookingId, qrCode, providerClerkId } = await req.json();

    if (!bookingId || !qrCode || !providerClerkId) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Start transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 1. Fetch booking
      const booking = await Booking.findById(bookingId).session(session);
      if (!booking) {
        throw new Error("Booking not found");
      }

      // 2. Fetch listing
      const listing = await Listing.findById(booking.listingId).session(session);
      if (!listing) {
        throw new Error("Listing not found");
      }

      // 3. Verify provider owns this listing
      if (listing.providerId.toString() !== providerClerkId.toString()) {
        throw new Error("Not authorized to verify collections for this listing");
      }

      // 4. Expiry check
      if (booking.expiresAt && new Date() > booking.expiresAt) {
        booking.status = "expired";
        await booking.save({ session });

        await session.commitTransaction();
        session.endSession();

        return NextResponse.json(
          { success: false, message: "Booking has expired" },
          { status: 400 }
        );
      }

      // 5. QR/Collection code verification
      if (booking.qrCode !== qrCode && booking.collectionCode !== qrCode) {
        throw new Error("Invalid QR or collection code");
      }

      // 6. Mark as collected
      const collectionTime = new Date();
      booking.status = "collected";
      booking.collectedAt = collectionTime;
      booking.collectionVerifiedBy = providerClerkId;
      await booking.save({ session });

      // 7. Update embedded booking in listing
      const embeddedBooking = listing.bookings.find(
        (b) =>
          b.bookingRefId &&
          b.bookingRefId.toString() === booking._id.toString()
      );

      if (embeddedBooking) {
        embeddedBooking.status = "collected";
        embeddedBooking.collectedAt = collectionTime;
        embeddedBooking.collectionVerifiedBy = providerClerkId;
      }
      await listing.save({ session });

      // ✅ Commit DB changes before notifications
      await session.commitTransaction();
      session.endSession();

      // 8. Fetch users (outside transaction)
      const recipient = await UserProfile.findOne({
        userId: booking.recipientId,
      }).lean();

      const provider = await UserProfile.findOne({
        userId: listing.providerId,
      }).lean();

      // 9. Send notifications (non-blocking)
      try {
        if (recipient?.deviceToken) {
          await sendCompleteNotification(
            recipient.deviceToken,
            "Booking Collected",
            `Your booking for "${listing.title}" has been successfully collected.`,
            {
              type: "booking_collected",
              bookingId: booking._id.toString(),
              listingId: listing._id.toString(),
            }
          );
        }

        if (provider?.deviceToken) {
          await sendCompleteNotification(
            provider.deviceToken,
            "Collection Verified",
            `You have successfully verified collection for "${listing.title}".`,
            {
              type: "collection_verified",
              bookingId: booking._id.toString(),
              listingId: listing._id.toString(),
            }
          );
        }
      } catch (notifyErr) {
        console.error("Notification error:", notifyErr);
      }

      // 10. Success response
      return NextResponse.json(
        {
          success: true,
          message: "Booking collection verified successfully",
          booking,
        },
        { status: 200 }
      );
    } catch (error) {
      // Rollback transaction
      await session.abortTransaction();
      session.endSession();
      console.error("Collection verification failed:", error);

      return NextResponse.json(
        {
          success: false,
          message: error.message || "Failed to verify collection",
        },
        { status: error.message?.includes("not found") ? 404 : 400 }
      );
    }
  } catch (error) {
    console.error("Route handler error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

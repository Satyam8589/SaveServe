// app/api/listings/[id]/book/route.js
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/db";
import FoodListing from "@/models/FoodListing";
import Booking from "@/models/Booking";
import UserProfile from "@/models/UserProfile";
import mongoose from "mongoose";
import { QRCodeService } from "@/lib/qrCodeService";

export async function POST(request, { params }) {
  const { id } = await params; // This is the listing ID
  const { userId } = await auth(request);
  const { requestedQuantity, recipientName, requestMessage } = await request.json();

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
    
    if (foodListing.listingStatus === 'fully_booked' || foodListing.listingStatus === 'expired' || !foodListing.isActive) {
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
    const finalQRData = QRCodeService.generateQRData(booking._id.toString(), userId, id, timestamp);
    const qrCodeImage = await QRCodeService.generateQRCode(finalQRData);
    
    booking.qrCode = finalQRData;
    // booking.qrCodeImage = qrCodeImage; // Consider if you need to store this large string in the DB

    await booking.save({ session });

    const embeddedBookingRequest = {
      recipientId: userId,
      recipientName: recipientName,
      requestedQuantity: requestedQuantity,
      approvedQuantity: requestedQuantity,
      status: 'approved',
      requestMessage: requestMessage,
      bookingRefId: booking._id,
      approvedAt: new Date(),
    };
    
    foodListing.bookings.push(embeddedBookingRequest);
    await foodListing.save({ session });

    const recipientUser = await UserProfile.findOne({ clerkId: userId }).session(session);
    if (recipientUser) {
      recipientUser.bookings.push(booking._id);
      await recipientUser.save({ session });
    } else {
      // If the user profile doesn't exist, we might not want to fail the whole transaction.
      // Depending on requirements, you could create one or just log a warning.
      console.warn(`User profile with clerkId ${userId} not found. Continuing without adding booking to profile.`);
    }

    await session.commitTransaction();

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
          "Collect your food and enjoy!"
        ]
      }
    };

    return NextResponse.json(bookingResponse, { status: 201 });

  } catch (error) {
    await session.abortTransaction();
    console.error("Booking transaction error:", error);
    return new NextResponse(error.message || "Booking failed due to an unexpected error.", {
      status: error.message.includes("Not enough quantity") || error.message.includes("expired") ? 400 : 500,
    });
  } finally {
    session.endSession();
  }
}
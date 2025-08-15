// app/api/listings/[id]/book/route.js
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/db";
import FoodListing from "@/models/FoodListing";
import Booking from "@/models/Booking";
import User from "@/models/User";
import mongoose from "mongoose";
import { QRCodeService } from "@/lib/qrCodeService";

export async function POST(request, { params }) {
  const { id } = params; // This is the listing ID
  const { userId } = auth();

  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  await connectDB();

  try {
    // Validate if the ID is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return new NextResponse("Invalid Food Listing ID", { status: 400 });
    }

    // Find the food listing
    const foodListing = await FoodListing.findById(id);

    if (!foodListing) {
      return new NextResponse("Food listing not found", { status: 404 });
    }

    // Check if the listing is still available
    if (foodListing.status !== "available") {
      return new NextResponse("Food listing is not available", { status: 400 });
    }

    // Generate QR code data and collection code
    const timestamp = new Date().toISOString();
    const qrData = QRCodeService.generateQRData(null, userId, id, timestamp); // bookingId will be added after creation
    const collectionCode = QRCodeService.generateCollectionCode();
    const qrCodeExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

    // Create a new booking
    const booking = await Booking.create({
      foodListing: foodListing._id,
      recipient: userId, // Clerk user ID
      status: "pending",
      collectionCode,
      qrCodeExpiry,
    });

    // Update QR data with actual booking ID
    const finalQRData = QRCodeService.generateQRData(booking._id.toString(), userId, id, timestamp);
    const qrCodeImage = await QRCodeService.generateQRCode(finalQRData);
    
    // Update booking with QR code
    booking.qrCode = finalQRData;
    booking.qrCodeImage = qrCodeImage; // Store base64 image for easy retrieval
    await booking.save();

    // Update food listing status
    foodListing.status = "booked";
    foodListing.currentBooking = booking._id;
    await foodListing.save();

    // Add booking to recipient's bookings
    const recipientUser = await User.findOne({ clerkId: userId });
    if (recipientUser) {
      recipientUser.bookings.push(booking._id);
      await recipientUser.save();
    } else {
      console.warn(`User with clerkId ${userId} not found in DB.`);
    }

    // Return booking with QR code data
    const bookingResponse = {
      ...booking.toObject(),
      qrCodeImage, // Include QR code image in response
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
    console.error("Booking error:", error);
    return new NextResponse(`Booking failed: ${error.message}`, {
      status: 500,
    });
  }
}
// File: app/api/bookings/user/[userId]/route.js
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/db";
import Booking from "@/models/Booking";
import FoodListing from "@/models/FoodListing";
import UserProfile from "@/models/UserProfile";

export async function GET(request, { params }) {
  const { userId } = await params;
  const { userId: authUserId } = await auth(request);

  if (!authUserId) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  // Users can only view their own bookings
  if (authUserId !== userId) {
    return NextResponse.json(
      { success: false, message: "Not authorized to view these bookings" },
      { status: 403 }
    );
  }

  await connectDB();

  try {
    // Get URL search params for filtering
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const limit = parseInt(url.searchParams.get("limit")) || 50;
    const page = parseInt(url.searchParams.get("page")) || 1;
    const skip = (page - 1) * limit;

    // Build query
    const query = { recipientId: userId };
    if (status) {
      query.status = status;
    }

    console.log("🔍 Fetching user bookings:", { userId, query, limit, skip });

    // Fetch bookings with populated food listing data
    const bookings = await Booking.find(query)
      .populate({
        path: "listingId",
        select: "title description location providerId images",
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count for pagination
    const totalCount = await Booking.countDocuments(query);

    // Transform the data to match frontend expectations
    const transformedBookings = await Promise.all(
      bookings.map(async (booking) => ({
        ...booking,
        foodListing: booking.listingId, // Alias for consistency
        // Ensure QR code image is available for approved bookings
        qrCodeImage:
          booking.status === "approved" && booking.qrCode
            ? booking.qrCodeImage || (await generateQRCodeImage(booking.qrCode))
            : null,
      }))
    );

    console.log("✅ Successfully fetched bookings:", {
      count: transformedBookings.length,
      totalCount,
      page,
    });

    return NextResponse.json({
      success: true,
      data: transformedBookings,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("❌ Get user bookings error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch bookings",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Internal server error",
      },
      { status: 500 }
    );
  }
}

// Helper function to generate QR code image if missing
async function generateQRCodeImage(qrData) {
  try {
    const { QRCodeService } = await import("@/lib/qrCodeService");
    return await QRCodeService.generateQRCode(qrData);
  } catch (error) {
    console.error("Failed to generate QR code image:", error);
    return null;
  }
}

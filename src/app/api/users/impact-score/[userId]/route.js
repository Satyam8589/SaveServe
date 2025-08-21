import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Booking from "@/models/Booking";

export async function GET(request, { params }) {
  try {
    await connectDB();

    const { userId } = await params;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "User ID is required" },
        { status: 400 }
      );
    }

    // Get all bookings for the user (using recipientId field)
    const bookings = await Booking.find({ recipientId: userId });

    // Calculate statistics
    const totalBookings = bookings.length;
    const totalApproved = bookings.filter(
      (booking) => booking.status === "approved"
    ).length;
    const totalCollected = bookings.filter(
      (booking) => booking.status === "collected"
    ).length;
    const totalCancelled = bookings.filter(
      (booking) => booking.status === "cancelled"
    ).length;
    const totalRejected = bookings.filter(
      (booking) => booking.status === "rejected"
    ).length;
    const totalExpired = bookings.filter(
      (booking) => booking.status === "expired"
    ).length;

    // Calculate Impact Score as percentage
    // Formula: (Collected bookings / Total Bookings) * 100
    // Collected means the recipient successfully picked up the food
    let impactScore = 0;

    if (totalBookings > 0) {
      impactScore = Math.round((totalCollected / totalBookings) * 100);
    }

    // Ensure score is between 0 and 100
    impactScore = Math.max(0, Math.min(100, impactScore));

    const responseData = {
      success: true,
      data: {
        impactScore,
        statistics: {
          totalBookings,
          totalApproved,
          totalCollected,
          totalCancelled,
          totalRejected,
          totalExpired,
          positiveActions: totalCollected,
        },
      },
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Error calculating impact score:", error);
    return NextResponse.json(
      { success: false, error: "Failed to calculate impact score" },
      { status: 500 }
    );
  }
}

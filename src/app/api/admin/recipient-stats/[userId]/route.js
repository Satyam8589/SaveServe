import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/db";
import UserProfile from "@/models/UserProfile";
import Booking from "@/models/Booking";
import FoodListing from "@/models/FoodListing";

export async function GET(request, { params }) {
  try {
    const user = await currentUser();
    const { userId } = await params;

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user has admin role
    const userRole = user.publicMetadata?.mainRole;
    if (userRole !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      );
    }

    await connectDB();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "User ID is required" },
        { status: 400 }
      );
    }

    // Get recipient profile
    const recipient = await UserProfile.findOne({ userId });

    if (!recipient) {
      return NextResponse.json(
        { success: false, error: "Recipient not found" },
        { status: 404 }
      );
    }

    // Get booking statistics
    const bookings = await Booking.find({ recipientId: userId })
      .populate("listingId", "title")
      .sort({ createdAt: -1 });

    // Calculate statistics
    const stats = {
      total: bookings.length,
      pending: bookings.filter((b) => b.status === "pending").length,
      approved: bookings.filter((b) => b.status === "approved").length,
      collected: bookings.filter((b) => b.status === "collected").length,
      cancelled: bookings.filter((b) => b.status === "cancelled").length,
      rejected: bookings.filter((b) => b.status === "rejected").length,
      recentBookings: bookings.slice(0, 10).map((booking) => ({
        id: booking._id,
        listingTitle: booking.listingId?.title || "Unknown Listing",
        status: booking.status,
        requestedQuantity: booking.requestedQuantity,
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt,
        requestMessage: booking.requestMessage,
      })),
    };

    // Calculate Impact Score
    const totalClaimed = bookings.filter((b) => b.status === "CLAIMED").length;
    const totalCompleted = bookings.filter(
      (b) => b.status === "COMPLETED"
    ).length;
    const positiveActions = totalClaimed + totalCompleted + stats.collected; // collected is similar to completed
    let impactScore = 0;

    if (stats.total > 0) {
      impactScore = Math.round((positiveActions / stats.total) * 100);
    }

    // Ensure score is between 0 and 100
    impactScore = Math.max(0, Math.min(100, impactScore));

    // Calculate additional metrics
    const collectionRate =
      stats.total > 0 ? ((stats.collected / stats.total) * 100).toFixed(1) : 0;
    const cancellationRate =
      stats.total > 0
        ? (((stats.cancelled + stats.rejected) / stats.total) * 100).toFixed(1)
        : 0;

    // Get recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentActivity = await Booking.find({
      recipientId: userId,
      createdAt: { $gte: thirtyDaysAgo },
    }).countDocuments();

    return NextResponse.json({
      success: true,
      stats: {
        ...stats,
        impactScore,
        positiveActions,
        collectionRate: parseFloat(collectionRate),
        cancellationRate: parseFloat(cancellationRate),
        recentActivity,
        averageBookingsPerMonth:
          stats.total > 0
            ? (
                stats.total /
                Math.max(
                  1,
                  Math.ceil(
                    (new Date() - new Date(recipient.createdAt)) /
                      (1000 * 60 * 60 * 24 * 30)
                  )
                )
              ).toFixed(1)
            : 0,
      },
      recipient: {
        userId: recipient.userId,
        fullName: recipient.fullName,
        email: recipient.email,
        role: recipient.role,
        subrole: recipient.subrole,
        userStatus: recipient.userStatus,
        createdAt: recipient.createdAt,
        updatedAt: recipient.updatedAt,
        phoneNumber: recipient.phoneNumber,
        campusLocation: recipient.campusLocation,
        lastLoginAt: recipient.lastLoginAt,
      },
    });
  } catch (error) {
    console.error("Error fetching recipient stats:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// src/app/api/provider-feedback/route.js
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Booking from "@/models/Booking"; // Adjust path as necessary

export async function GET(request) {
  try {
    const { userId } = await auth(request);

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    const feedback = await Booking.aggregate([
      {
        $match: {
          providerId: userId,
          rating: { $exists: true, $ne: null }, // Only consider bookings with a rating
        },
      },
      {
        $group: {
          _id: "$providerId",
          averageRating: { $avg: "$rating" },
          totalRatings: { $sum: 1 },
          feedbackComments: {
            $push: {
              rating: "$rating",
              comment: "$feedback",
              recipientName: "$recipientName",
              bookedAt: "$createdAt",
            },
          },
        },
      },
      {
        $project: {
          _id: 0, // Exclude _id from the final output
          providerId: "$_id",
          averageRating: { $round: ["$averageRating", 1] }, // Round to 1 decimal place
          totalRatings: 1,
          feedbackComments: 1,
        },
      },
    ]);

    if (feedback.length === 0) {
      return NextResponse.json(
        { success: true, message: "No feedback found for this provider.", data: null },
        { status: 200 }
      );
    }

    return NextResponse.json({ success: true, data: feedback[0] });
  } catch (error) {
    console.error("Error fetching provider feedback:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/db";
import UserProfile from "@/models/UserProfile";

export async function GET(request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    // Get user profile
    const userProfile = await UserProfile.findOne({ userId });

    if (!userProfile) {
      return NextResponse.json(
        { success: false, error: "User profile not found" },
        { status: 404 }
      );
    }

    // Check if user is allowed to book
    const canBook =
      userProfile.userStatus === "ACTIVE" ||
      userProfile.userStatus === "APPROVED";

    let message = "";
    let suspensionInfo = null;

    if (!canBook) {
      if (userProfile.userStatus === "REJECTED") {
        message =
          "Due to inappropriate behavior, you have been temporarily suspended from booking food. Please maintain good behavior and wait some days.";
        suspensionInfo = {
          reason: userProfile.statusReason || "Inappropriate behavior",
          suspendedAt: userProfile.statusChangedAt,
          suspendedBy: userProfile.statusChangedBy,
        };
      } else if (userProfile.userStatus === "BLOCKED") {
        message =
          "Your account has been blocked. Please contact support for assistance.";
        suspensionInfo = {
          reason: userProfile.statusReason || "Account blocked",
          suspendedAt: userProfile.statusChangedAt,
          suspendedBy: userProfile.statusChangedBy,
        };
      }
    }

    return NextResponse.json({
      success: true,
      canBook,
      userStatus: userProfile.userStatus,
      message,
      suspensionInfo,
    });
  } catch (error) {
    console.error("Error checking booking permission:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// app/api/admin/reject-user/route.js
import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/db";
import UserProfile from "../../../../models/UserProfile";

// POST request handler - Reject a user
export async function POST(request) {
  try {
    console.log("❌ POST /api/admin/reject-user - Starting request");

    // Check if user is authenticated and is admin
    const user = await currentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized - No user found" },
        { status: 401 }
      );
    }

    // Check if user has admin role
    const userRole = user.publicMetadata?.mainRole;
    if (userRole !== "ADMIN") {
      return NextResponse.json(
        { success: false, message: "Unauthorized - Admin access required" },
        { status: 403 }
      );
    }

    await connectDB();

    const body = await request.json();
    const { userId, adminId, reason } = body;

    console.log("📝 Rejecting user:", {
      userId,
      adminId,
      reasonLength: reason?.length,
    });

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "User ID is required." },
        { status: 400 }
      );
    }

    if (!reason || reason.trim().length === 0) {
      return NextResponse.json(
        { success: false, message: "Rejection reason is required." },
        { status: 400 }
      );
    }

    // Find the user profile
    const profile = await UserProfile.findOne({ userId });
    if (!profile) {
      return NextResponse.json(
        { success: false, message: "User profile not found." },
        { status: 404 }
      );
    }

    // Check if user is in pending status
    if (profile.approvalStatus !== "PENDING") {
      return NextResponse.json(
        {
          success: false,
          message: `User is not in pending status. Current status: ${profile.approvalStatus}`,
        },
        { status: 400 }
      );
    }

    // Reject the user using the instance method
    await profile.reject(adminId || user.id, reason.trim());

    // Update Clerk metadata to reflect rejection status
    try {
      const { clerkClient } = await import("@clerk/nextjs/server");
      const client = await clerkClient();

      // Get current metadata and merge with approval status
      const currentUser = await client.users.getUser(profile.userId);
      const currentMetadata = currentUser.publicMetadata || {};

      await client.users.updateUserMetadata(profile.userId, {
        publicMetadata: {
          ...currentMetadata,
          approvalStatus: "REJECTED",
        },
      });

      console.log(
        "✅ Clerk metadata updated for rejected user:",
        profile.userId
      );

      // Small delay to ensure metadata propagation
      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (clerkError) {
      console.warn("⚠️ Failed to update Clerk metadata:", clerkError);
      // Don't fail the rejection if Clerk update fails
    }

    console.log("❌ User rejected successfully:", {
      userId: profile.userId,
      fullName: profile.fullName,
      rejectedBy: profile.approvedBy,
      reason: profile.rejectionReason,
    });

    // Send notification to user about rejection
    try {
      // Import notification service dynamically to avoid import issues
      const { sendNotificationToUser } = await import(
        "../../../../lib/notificationService"
      );

      await sendNotificationToUser(
        profile.userId,
        "📝 Account Application Update",
        "Your account application needs attention. Please check your profile for feedback.",
        {
          type: "ACCOUNT_REJECTED",
          approvalStatus: "REJECTED",
          rejectionReason: profile.rejectionReason,
        }
      );
    } catch (notificationError) {
      console.warn(
        "⚠️ Failed to send rejection notification:",
        notificationError
      );
      // Don't fail the rejection if notification fails
    }

    return NextResponse.json({
      success: true,
      message: "User rejected successfully.",
      user: {
        userId: profile.userId,
        fullName: profile.fullName,
        email: profile.email,
        approvalStatus: profile.approvalStatus,
        rejectionReason: profile.rejectionReason,
        approvedBy: profile.approvedBy, // This will be the admin who rejected
      },
    });
  } catch (error) {
    console.error("💥 POST /api/admin/reject-user error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error while rejecting user.",
      },
      { status: 500 }
    );
  }
}

// Helper function to send rejection notification
async function sendRejectionNotification(profile) {
  // TODO: Implement notification logic
  // This could include:
  // - Email notification
  // - Push notification
  // - SMS notification
  // - In-app notification

  console.log("📧 Sending rejection notification to:", profile.email);

  // Example: Email notification (implement with your email service)
  // await sendEmail({
  //   to: profile.email,
  //   subject: 'Account Application Update - Smart Food Redistribution',
  //   template: 'user-rejected',
  //   data: {
  //     fullName: profile.fullName,
  //     rejectionReason: profile.rejectionReason,
  //     profileUrl: '/profile',
  //     supportEmail: 'support@smartfoodredistribution.com'
  //   }
  // });

  // Example: Push notification (implement with Firebase)
  // if (profile.fcmToken) {
  //   await sendPushNotification({
  //     token: profile.fcmToken,
  //     title: 'Account Application Update',
  //     body: 'Your account application needs attention. Please check your email for details.',
  //     data: {
  //       type: 'ACCOUNT_REJECTED',
  //       userId: profile.userId,
  //       reason: profile.rejectionReason
  //     }
  //   });
  // }
}

// PUT request handler - Update rejection reason
export async function PUT(request) {
  try {
    console.log("📝 PUT /api/admin/reject-user - Starting request");

    // Check if user is authenticated and is admin
    const user = await currentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized - No user found" },
        { status: 401 }
      );
    }

    // Check if user has admin role
    const userRole = user.publicMetadata?.mainRole;
    if (userRole !== "ADMIN") {
      return NextResponse.json(
        { success: false, message: "Unauthorized - Admin access required" },
        { status: 403 }
      );
    }

    await connectDB();

    const body = await request.json();
    const { userId, reason } = body;

    console.log("📝 Updating rejection reason for user:", {
      userId,
      reasonLength: reason?.length,
    });

    if (!userId || !reason || reason.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "User ID and rejection reason are required.",
        },
        { status: 400 }
      );
    }

    // Find the user profile
    const profile = await UserProfile.findOne({ userId });
    if (!profile) {
      return NextResponse.json(
        { success: false, message: "User profile not found." },
        { status: 404 }
      );
    }

    // Check if user is in rejected status
    if (profile.approvalStatus !== "REJECTED") {
      return NextResponse.json(
        {
          success: false,
          message: `User is not in rejected status. Current status: ${profile.approvalStatus}`,
        },
        { status: 400 }
      );
    }

    // Update rejection reason
    profile.rejectionReason = reason.trim();
    await profile.save();

    console.log("✅ Rejection reason updated successfully:", {
      userId: profile.userId,
      newReason: profile.rejectionReason,
    });

    return NextResponse.json({
      success: true,
      message: "Rejection reason updated successfully.",
      user: {
        userId: profile.userId,
        fullName: profile.fullName,
        email: profile.email,
        approvalStatus: profile.approvalStatus,
        rejectionReason: profile.rejectionReason,
      },
    });
  } catch (error) {
    console.error("💥 PUT /api/admin/reject-user error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error while updating rejection reason.",
      },
      { status: 500 }
    );
  }
}

// app/api/admin/approve-user/route.js
import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/db";
import UserProfile from "../../../../models/UserProfile";

// POST request handler - Approve a user
export async function POST(request) {
  try {
    console.log("✅ POST /api/admin/approve-user - Starting request");

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
    const { userId, adminId } = body;

    console.log("📝 Approving user:", { userId, adminId });

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "User ID is required." },
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

    // Approve the user using the instance method
    await profile.approve(adminId || user.id);

    // Update Clerk metadata to reflect approval status
    try {
      const { clerkClient } = await import("@clerk/nextjs/server");
      const client = await clerkClient();

      // Get current metadata and merge with approval status
      const currentUser = await client.users.getUser(profile.userId);
      const currentMetadata = currentUser.publicMetadata || {};

      await client.users.updateUserMetadata(profile.userId, {
        publicMetadata: {
          ...currentMetadata,
          approvalStatus: "APPROVED",
        },
      });

      console.log(
        "✅ Clerk metadata updated for approved user:",
        profile.userId
      );

      // Small delay to ensure metadata propagation
      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (clerkError) {
      console.warn("⚠️ Failed to update Clerk metadata:", clerkError);
      // Don't fail the approval if Clerk update fails
    }

    console.log("✅ User approved successfully:", {
      userId: profile.userId,
      fullName: profile.fullName,
      approvedBy: profile.approvedBy,
      approvedAt: profile.approvedAt,
    });

    // Send notification to user about approval
    try {
      // Import notification service dynamically to avoid import issues
      const { sendNotificationToUser } = await import(
        "../../../../lib/notificationService"
      );

      await sendNotificationToUser(
        profile.userId,
        "🎉 Account Approved!",
        "Your account has been approved. You can now access your dashboard.",
        {
          type: "ACCOUNT_APPROVED",
          approvalStatus: "APPROVED",
        }
      );
    } catch (notificationError) {
      console.warn(
        "⚠️ Failed to send approval notification:",
        notificationError
      );
      // Don't fail the approval if notification fails
    }

    return NextResponse.json({
      success: true,
      message: "User approved successfully.",
      user: {
        userId: profile.userId,
        fullName: profile.fullName,
        email: profile.email,
        approvalStatus: profile.approvalStatus,
        approvedAt: profile.approvedAt,
        approvedBy: profile.approvedBy,
      },
    });
  } catch (error) {
    console.error("💥 POST /api/admin/approve-user error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error while approving user.",
      },
      { status: 500 }
    );
  }
}

// Helper function to send approval notification
async function sendApprovalNotification(profile) {
  // TODO: Implement notification logic
  // This could include:
  // - Email notification
  // - Push notification
  // - SMS notification
  // - In-app notification

  console.log("📧 Sending approval notification to:", profile.email);

  // Example: Email notification (implement with your email service)
  // await sendEmail({
  //   to: profile.email,
  //   subject: 'Account Approved - Smart Food Redistribution',
  //   template: 'user-approved',
  //   data: {
  //     fullName: profile.fullName,
  //     dashboardUrl: getDashboardUrl(profile.role)
  //   }
  // });

  // Example: Push notification (implement with Firebase)
  // if (profile.fcmToken) {
  //   await sendPushNotification({
  //     token: profile.fcmToken,
  //     title: 'Account Approved!',
  //     body: 'Your account has been approved. You can now access your dashboard.',
  //     data: {
  //       type: 'ACCOUNT_APPROVED',
  //       userId: profile.userId
  //     }
  //   });
  // }
}

// Helper function to get dashboard URL based on role
function getDashboardUrl(role) {
  switch (role) {
    case "PROVIDER":
      return "/providerDashboard";
    case "RECIPIENT":
      return "/recipientDashboard";
    default:
      return "/dashboard";
  }
}

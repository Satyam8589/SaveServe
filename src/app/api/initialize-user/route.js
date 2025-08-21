// app/api/initialize-user/route.js
// Initialize new users with correct metadata
import { NextResponse } from "next/server";
import { currentUser, clerkClient } from "@clerk/nextjs/server";

export async function POST(req) {
  try {
    console.log("🔄 Initializing new user...");
    
    const user = await currentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not authenticated" },
        { status: 401 }
      );
    }

    console.log("👤 User ID:", user.id);
    console.log("📋 Current metadata:", user.publicMetadata);

    // Check if user is already initialized
    const hasOnboarded = user.publicMetadata?.hasOnboarded;
    const hasCompleteProfile = user.publicMetadata?.hasCompleteProfile;

    if (hasOnboarded !== undefined || hasCompleteProfile !== undefined) {
      console.log("✅ User already initialized");
      return NextResponse.json({
        success: true,
        message: "User already initialized",
        metadata: user.publicMetadata
      });
    }

    // Initialize new user with correct starting metadata
    const client = await clerkClient();
    
    const initialMetadata = {
      hasOnboarded: "false",
      hasCompleteProfile: "false",
      // Don't set mainRole or subRole yet - they'll be set during onboarding
    };

    console.log("🔧 Setting initial metadata:", initialMetadata);

    const updatedUser = await client.users.updateUserMetadata(user.id, {
      publicMetadata: initialMetadata,
    });

    console.log("✅ User initialized successfully");

    return NextResponse.json({
      success: true,
      message: "User initialized successfully",
      metadata: updatedUser.publicMetadata
    });

  } catch (error) {
    console.error("❌ Error initializing user:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

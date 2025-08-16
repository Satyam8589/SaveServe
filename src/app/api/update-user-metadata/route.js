// app/api/update-user-metadata/route.js
import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { userId } = await auth();
    console.log("userId:", userId);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { mainRole, subRole, hasOnboarded, hasCompleteProfile } = body;

    // Prepare metadata update with safe assignment
    const safeMetadata = {};
    if (mainRole !== undefined) safeMetadata.mainRole = String(mainRole);
    if (subRole !== undefined) safeMetadata.subRole = String(subRole);
    if (hasOnboarded !== undefined) safeMetadata.hasOnboarded = String(hasOnboarded);
    if (hasCompleteProfile !== undefined) safeMetadata.hasCompleteProfile = String(hasCompleteProfile);

    console.log("Updating metadata with:", safeMetadata);

    // Initialize the clerkClient instance
    const client = await clerkClient();

    // Use the updateUserMetadata method with await
    const updatedUser = await client.users.updateUserMetadata(userId, {
      publicMetadata: safeMetadata,
    });

    console.log("User metadata updated successfully:", updatedUser.publicMetadata);

    // Add a small delay to ensure propagation
    await new Promise(resolve => setTimeout(resolve, 100));

    return NextResponse.json({ 
      success: true, 
      message: "User metadata updated successfully",
      metadata: updatedUser.publicMetadata,
      userId: userId
    }, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (err) {
    console.error("Clerk metadata update error:", err);
    console.error("Error details:", {
      name: err.name,
      message: err.message,
      stack: err.stack,
      clerkTraceId: err.clerkTraceId
    });
    
    // Handle different types of errors
    let errorMessage = "Failed to update user metadata";
    let errorDetails = null;
    let statusCode = 500;

    if (err.errors && Array.isArray(err.errors)) {
      // Clerk validation errors
      errorDetails = err.errors;
      errorMessage = err.errors.map(e => e.message).join(", ");
    } else if (err.status) {
      statusCode = err.status;
      errorMessage = err.message || errorMessage;
    } else if (err.message) {
      errorMessage = err.message;
    }

    return NextResponse.json({ 
      error: errorMessage,
      details: errorDetails,
      success: false,
      clerkTraceId: err.clerkTraceId
    }, { status: statusCode });
  }
}
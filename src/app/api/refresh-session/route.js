import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get fresh user data from Clerk
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    
    console.log("Refreshed user session for:", userId);
    console.log("Current metadata:", user.publicMetadata);

    return NextResponse.json({
      success: true,
      message: "Session refreshed successfully",
      metadata: user.publicMetadata
    });
  } catch (error) {
    console.error("Error refreshing session:", error);
    return NextResponse.json(
      { success: false, message: "Failed to refresh session" },
      { status: 500 }
    );
  }
}

import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req) {
  const { userId } = await auth(req); // Ensure to pass the request object
  console.log("userId:", userId);

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { mainRole, subRole, hasOnboarded } = await req.json();

  const safeMetadata = {};
  if (mainRole !== undefined) safeMetadata.mainRole = mainRole;
  if (subRole !== undefined) safeMetadata.subRole = subRole;
  if (hasOnboarded !== undefined) safeMetadata.hasOnboarded = hasOnboarded;

  try {
    // Initialize the clerkClient instance
    const client = await clerkClient();

    // Use the updateUserMetadata method
    const updatedUser = await client.users.updateUserMetadata(userId, {
      publicMetadata: safeMetadata,
    });

    return NextResponse.json({ success: true, updatedUser }, { status: 200 });
  } catch (err) {
    console.error("Clerk error:", err);
    return NextResponse.json({ error: err.errors ?? err.message }, { status: 500 });
  }
}

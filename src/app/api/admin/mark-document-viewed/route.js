import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import UserProfile from "../../../../models/UserProfile";

// POST request handler - Mark document as viewed by admin
export async function POST(request) {
  try {
    console.log("📋 POST /api/admin/mark-document-viewed - Starting request");

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
    const { userId, documentIndex } = body;

    console.log("📝 Marking document as viewed:", { userId, documentIndex, adminId: user.id });

    if (!userId || documentIndex === undefined) {
      return NextResponse.json(
        { success: false, message: "User ID and document index are required." },
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

    // Check if document exists
    if (!profile.verificationDocuments || !profile.verificationDocuments[documentIndex]) {
      return NextResponse.json(
        { success: false, message: "Document not found." },
        { status: 404 }
      );
    }

    // Mark document as viewed
    profile.verificationDocuments[documentIndex].viewedByAdmin = true;
    profile.verificationDocuments[documentIndex].viewedAt = new Date();
    profile.verificationDocuments[documentIndex].viewedBy = user.id;

    await profile.save();

    console.log("✅ Document marked as viewed successfully:", {
      userId: profile.userId,
      documentIndex,
      documentName: profile.verificationDocuments[documentIndex].name,
      viewedBy: user.id,
    });

    return NextResponse.json({
      success: true,
      message: "Document marked as viewed successfully.",
      document: {
        name: profile.verificationDocuments[documentIndex].name,
        viewedByAdmin: true,
        viewedAt: profile.verificationDocuments[documentIndex].viewedAt,
        viewedBy: profile.verificationDocuments[documentIndex].viewedBy,
      },
    });
  } catch (error) {
    console.error("💥 POST /api/admin/mark-document-viewed error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error while marking document as viewed.",
      },
      { status: 500 }
    );
  }
}

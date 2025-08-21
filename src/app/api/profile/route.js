// app/api/profile/route.js
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import UserProfile from "../../../models/UserProfile";

// GET request handler - Fetch user profile
export async function GET(request) {
  try {
    console.log("🔍 GET /api/profile - Starting request");
    await connectDB();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    console.log("📝 Received userId:", userId);

    if (!userId) {
      console.log("❌ No userId provided");
      return NextResponse.json(
        { success: false, message: "User ID is required." },
        { status: 400 }
      );
    }

    console.log("🔎 Fetching profile for userId:", userId);

    const profile = await UserProfile.findOne({ userId }).lean();

    if (!profile) {
      console.log("❌ Profile not found for userId:", userId);
      return NextResponse.json(
        { success: false, message: "Profile not found." },
        { status: 404 }
      );
    }

    console.log("✅ Found profile:", {
      id: profile._id,
      userId: profile.userId,
      fullName: profile.fullName,
      email: profile.email,
      isComplete: profile.isProfileComplete,
      approvalStatus: profile.approvalStatus,
    });

      // Add providerName to the response, mapped from fullName
      return NextResponse.json({
        success: true,
        message: "Profile fetched successfully.",
        profile: {
          ...profile,
          providerName: profile.fullName,
        },
      });
  } catch (error) {
    console.error("💥 GET /api/profile error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error while fetching profile.",
      },
      { status: 500 }
    );
  }
}

// POST request handler - Create or update user profile
export async function POST(request) {
  try {
    console.log("📝 POST /api/profile - Starting request");
    await connectDB();

    const body = await request.json();
    console.log("📦 Received profile data:", {
      userId: body.userId,
      fullName: body.fullName,
      email: body.email,
      role: body.role,
      subrole: body.subrole,
      phoneNumber: body.phoneNumber ? "***masked***" : undefined,
      campusLocation: body.campusLocation,
      organizationName: body.organizationName,
      descriptionLength: body.description ? body.description.length : 0,
    });

    // Validate required fields
    const requiredFields = [
      "userId",
      "fullName",
      "email",
      "role",
      "subrole",
      "phoneNumber",
      "campusLocation",
    ];
    const missingFields = requiredFields.filter((field) => {
      const value = body[field];
      return !value || (typeof value === "string" && value.trim() === "");
    });

    if (missingFields.length > 0) {
      console.log("❌ Missing required fields:", missingFields);
      return NextResponse.json(
        {
          success: false,
          message: `Missing required fields: ${missingFields.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Special validation for NGO subrole
    if (
      body.subrole === "NGO" &&
      (!body.organizationName || body.organizationName.trim() === "")
    ) {
      console.log("❌ NGO requires organizationName");
      return NextResponse.json(
        {
          success: false,
          message: "Organization name is required for NGO subrole.",
        },
        { status: 400 }
      );
    }

    // Validate enum values
    const validRoles = ["PROVIDER", "RECIPIENT"];
    const validSubroles = [
      "CANTEEN",
      "HOSTEL",
      "EVENTORGANIZER",
      "STUDENT",
      "STAFF",
      "NGO",
    ];

    if (!validRoles.includes(body.role)) {
      console.log("❌ Invalid role:", body.role);
      return NextResponse.json(
        {
          success: false,
          message: `Invalid role. Must be one of: ${validRoles.join(", ")}`,
        },
        { status: 400 }
      );
    }

    if (!validSubroles.includes(body.subrole)) {
      console.log("❌ Invalid subrole:", body.subrole);
      return NextResponse.json(
        {
          success: false,
          message: `Invalid subrole. Must be one of: ${validSubroles.join(
            ", "
          )}`,
        },
        { status: 400 }
      );
    }

    // Additional validation
    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      console.log("❌ Invalid email format:", body.email);
      return NextResponse.json(
        {
          success: false,
          message: "Please enter a valid email address.",
        },
        { status: 400 }
      );
    }

    // Phone number validation
    const cleanPhone = body.phoneNumber.replace(/[\s\-\(\)]/g, "");
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    if (!phoneRegex.test(cleanPhone)) {
      console.log("❌ Invalid phone format:", body.phoneNumber);
      return NextResponse.json(
        {
          success: false,
          message: "Please enter a valid phone number.",
        },
        { status: 400 }
      );
    }

    // Description length validation
    if (body.description && body.description.length > 500) {
      console.log("❌ Description too long:", body.description.length);
      return NextResponse.json(
        {
          success: false,
          message: "Description cannot exceed 500 characters.",
        },
        { status: 400 }
      );
    }

    // Prepare the data for save/update
    const profileData = {
      userId: body.userId.trim(),
      fullName: body.fullName.trim(),
      email: body.email.trim().toLowerCase(),
      role: body.role.trim(),
      subrole: body.subrole.trim(),
      phoneNumber: body.phoneNumber.trim(),
      campusLocation: body.campusLocation.trim(),
      organizationName: body.organizationName
        ? body.organizationName.trim()
        : "",
      description: body.description ? body.description.trim() : "",
      verificationDocuments: body.verificationDocuments || [],
      isActive: body.isActive !== undefined ? body.isActive : true,
      lastLoginAt: new Date(),
    };

    console.log("🔄 Processed profile data for save:", {
      userId: profileData.userId,
      fullName: profileData.fullName,
      email: profileData.email,
      role: profileData.role,
      subrole: profileData.subrole,
      campusLocation: profileData.campusLocation,
      organizationName: profileData.organizationName,
      verificationDocuments: profileData.verificationDocuments?.length || 0,
      isActive: profileData.isActive,
    });

    console.log(
      "📄 Verification documents being saved:",
      profileData.verificationDocuments
    );

    // Check if profile already exists
    const existingProfile = await UserProfile.findOne({
      userId: profileData.userId,
    });
    console.log("🔍 Existing profile found:", !!existingProfile);

    // Use findOneAndUpdate with upsert to either create or update
    const profile = await UserProfile.findOneAndUpdate(
      { userId: profileData.userId },
      profileData,
      {
        new: true, // Return the updated document
        upsert: true, // Create if doesn't exist
        runValidators: true, // Run schema validators
        setDefaultsOnInsert: true, // Set defaults for new documents
      }
    );

    console.log("💾 Profile operation completed:", {
      id: profile._id,
      userId: profile.userId,
      fullName: profile.fullName,
      email: profile.email,
      role: profile.role,
      subrole: profile.subrole,
      isComplete: profile.isProfileComplete,
      isActive: profile.isActive,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
      wasNew: !existingProfile,
    });

    // Update Clerk metadata to include approval status for new profiles
    if (!existingProfile) {
      try {
        const { clerkClient } = await import("@clerk/nextjs/server");
        const client = await clerkClient();

        await client.users.updateUserMetadata(userId, {
          publicMetadata: {
            approvalStatus: "PENDING",
            mainRole: profileData.role.toLowerCase(), // Add the main role
            onboarded: true,
          },
        });

        console.log(
          "✅ Clerk metadata updated with approval status for user:",
          userId
        );
      } catch (clerkError) {
        console.warn("⚠️ Failed to update Clerk metadata:", clerkError);
        // Don't fail the profile creation if Clerk update fails
      }
    }

    const responseMessage = existingProfile
      ? "Profile updated successfully!"
      : "Profile created successfully!";

    return NextResponse.json({
      success: true,
      message: responseMessage,
      data: profile,
      isNew: !existingProfile,
    });
  } catch (error) {
    console.error("💥 POST /api/profile error:", error);

    // Handle specific MongoDB validation errors
    if (error.name === "ValidationError") {
      const validationErrors = Object.values(error.errors).map(
        (err) => err.message
      );
      console.log("❌ Validation errors:", validationErrors);
      return NextResponse.json(
        {
          success: false,
          message: `Validation error: ${validationErrors.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Handle duplicate key errors (unique constraint violations)
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      console.log("❌ Duplicate key error for field:", field);
      return NextResponse.json(
        {
          success: false,
          message: `A profile with this ${field} already exists.`,
        },
        { status: 409 }
      );
    }

    // Handle cast errors (invalid ObjectId, etc.)
    if (error.name === "CastError") {
      console.log("❌ Cast error:", error.message);
      return NextResponse.json(
        {
          success: false,
          message: "Invalid data format provided.",
        },
        { status: 400 }
      );
    }

    // Generic error response
    return NextResponse.json(
      { success: false, message: "Failed to save profile. Please try again." },
      { status: 500 }
    );
  }
}

// PUT request handler - Update specific profile fields
export async function PUT(request) {
  try {
    console.log("🔄 PUT /api/profile - Starting request");
    await connectDB();

    const body = await request.json();
    const { userId, updates } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "User ID is required." },
        { status: 400 }
      );
    }

    if (!updates || Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, message: "Updates object is required." },
        { status: 400 }
      );
    }

    console.log(
      "🔄 Updating profile for userId:",
      userId,
      "with updates:",
      updates
    );

    const profile = await UserProfile.findOneAndUpdate(
      { userId },
      { ...updates, lastLoginAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!profile) {
      return NextResponse.json(
        { success: false, message: "Profile not found." },
        { status: 404 }
      );
    }

    console.log("✅ Profile updated successfully:", profile.userId);

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully!",
      data: profile,
    });
  } catch (error) {
    console.error("💥 PUT /api/profile error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update profile." },
      { status: 500 }
    );
  }
}

// DELETE request handler - Deactivate user profile
export async function DELETE(request) {
  try {
    console.log("🗑️ DELETE /api/profile - Starting request");
    await connectDB();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "User ID is required." },
        { status: 400 }
      );
    }

    console.log("🗑️ Deactivating profile for userId:", userId);

    // Don't actually delete, just deactivate
    const profile = await UserProfile.findOneAndUpdate(
      { userId },
      {
        isActive: false,
        lastLoginAt: new Date(),
      },
      { new: true }
    );

    if (!profile) {
      return NextResponse.json(
        { success: false, message: "Profile not found." },
        { status: 404 }
      );
    }

    console.log("✅ Profile deactivated successfully:", profile.userId);

    return NextResponse.json({
      success: true,
      message: "Profile deactivated successfully!",
      data: profile,
    });
  } catch (error) {
    console.error("💥 DELETE /api/profile error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to deactivate profile." },
      { status: 500 }
    );
  }
}

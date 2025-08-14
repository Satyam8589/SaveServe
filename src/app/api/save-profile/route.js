// app/api/save-profile/route.js
import { auth, currentUser, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Provider, Recipient, getUserModel } from "@/models/User";

export async function POST(request) {
  try {
    // Verify authentication
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized - No user ID found" },
        { status: 401 }
      );
    }

    // Get user details from Clerk
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const userEmail = user.emailAddresses?.[0]?.emailAddress;

    if (!userEmail) {
      return NextResponse.json(
        { error: "User email not found" },
        { status: 400 }
      );
    }

    // Parse request body
    const profileData = await request.json();

    // Validate required fields
    const validationResult = validateProfileData(profileData);
    if (!validationResult.isValid) {
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.errors },
        { status: 400 }
      );
    }

    // Connect to database
    await connectDB();

    // Transform form data to match your user model
    const userData = transformProfileData(userId, userEmail, profileData);

    // Get the appropriate model and save to database
    const UserModel = getUserModel(profileData.userType);

    // Check if user already exists
    const existingUser = await UserModel.findOne({ id: userId });

    let savedUser;
    if (existingUser) {
      // Update existing user
      savedUser = await UserModel.findOneAndUpdate(
        { id: userId },
        { ...userData, updatedAt: new Date() },
        { new: true, runValidators: true }
      );
    } else {
      // Create new user
      savedUser = await UserModel.create(userData);
    }

    // Update Clerk user metadata to mark profile as complete
    await clerkClient.users.updateUserMetadata(userId, {
      publicMetadata: {
        ...user.publicMetadata,
        profileCompleted: true,
        userType: profileData.userType,
        subType: profileData.subType,
      },
    });

    // Return success response (exclude sensitive data)
    return NextResponse.json({
      success: true,
      message: "Profile saved successfully",
      user: {
        id: savedUser.id,
        name: savedUser.name,
        userType: savedUser.userType,
        subType: savedUser.subType || null,
        createdAt: savedUser.createdAt,
      },
    });
  } catch (error) {
    console.error("Error saving profile:", error);

    // Handle duplicate key errors
    if (error.code === 11000) {
      return NextResponse.json(
        { error: "User profile already exists" },
        { status: 409 }
      );
    }

    // Handle validation errors
    if (error.name === "ValidationError") {
      const validationErrors = Object.values(error.errors).map(
        (err) => err.message
      );
      return NextResponse.json(
        { error: "Validation failed", details: validationErrors },
        { status: 400 }
      );
    }

    // Handle Clerk errors
    if (error.message?.includes('Clerk')) {
      return NextResponse.json(
        { error: "Authentication service error" },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error", details: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong' },
      { status: 500 }
    );
  }
}

// Get user profile
export async function GET(request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    // Try to find user in both collections
    let user = await Provider.findOne({ id: userId });
    let userType = "PROVIDER";

    if (!user) {
      user = await Recipient.findOne({ id: userId });
      userType = "RECIPIENT";
    }

    if (!user) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    // Return user data
    return NextResponse.json({
      success: true,
      user: {
        ...user.toObject(),
        userType,
      },
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Validation function
function validateProfileData(data) {
  const errors = [];

  // Check if userType is provided
  if (!data.userType) {
    errors.push("User type is required");
  }

  // Common field validations
  if (!data.firstName || !data.firstName.trim()) {
    errors.push("First name is required");
  }
  if (!data.lastName || !data.lastName.trim()) {
    errors.push("Last name is required");
  }
  if (!data.phoneNumber || !data.phoneNumber.trim()) {
    errors.push("Phone number is required");
  }
  if (data.phoneNumber && !/^\+?[\d\s\-\(\)]+$/.test(data.phoneNumber)) {
    errors.push("Invalid phone number format");
  }

  // Email validation if provided
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push("Invalid email format");
  }

  // Provider specific validations
  if (data.userType === "PROVIDER") {
    if (!data.organizationName || !data.organizationName.trim()) {
      errors.push("Organization name is required");
    }
    if (data.avgDailyCapacity && data.avgDailyCapacity < 0) {
      errors.push("Average daily capacity cannot be negative");
    }
  }

  // Recipient specific validations
  if (data.userType === "RECIPIENT") {
    if (!data.subType) {
      errors.push("Recipient sub-type is required");
    }

    if (data.subType === "STUDENT" || data.subType === "STAFF") {
      if (!data.campusId || !data.campusId.trim()) {
        errors.push("Campus ID is required");
      }
      if (!data.department || !data.department.trim()) {
        errors.push("Department is required");
      }
    }

    if (data.subType === "NGO") {
      if (!data.ngoName || !data.ngoName.trim()) {
        errors.push("NGO name is required");
      }
      if (!data.registrationNumber || !data.registrationNumber.trim()) {
        errors.push("Registration number is required");
      }
      if (data.maxPickupCapacity && data.maxPickupCapacity < 0) {
        errors.push("Maximum pickup capacity cannot be negative");
      }
    }
  }

  // Location validations
  if (data.latitude && (isNaN(data.latitude) || data.latitude < -90 || data.latitude > 90)) {
    errors.push("Latitude must be between -90 and 90");
  }
  if (data.longitude && (isNaN(data.longitude) || data.longitude < -180 || data.longitude > 180)) {
    errors.push("Longitude must be between -180 and 180");
  }

  // Notification radius validation
  if (data.notificationRadius && (data.notificationRadius < 100 || data.notificationRadius > 5000)) {
    errors.push("Notification radius must be between 100 and 5000 meters");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Transform form data to match database models
function transformProfileData(userId, email, data) {
  // Base user data common to all types
  const baseUserData = {
    id: userId,
    email: email,
    phone: data.phoneNumber?.trim(),
    name: `${data.firstName?.trim()} ${data.lastName?.trim()}`,
    profilePicture: data.profilePicture?.trim() || "",
    userType: data.userType,

    // Location data
    location: {
      address: data.address?.trim() || "",
      latitude: data.latitude ? parseFloat(data.latitude) : null,
      longitude: data.longitude ? parseFloat(data.longitude) : null,
    },

    // Notification settings
    notifications: {
      email: Boolean(data.emailNotifications),
      push: Boolean(data.pushNotifications),
      sms: Boolean(data.smsNotifications),
      radius: parseInt(data.notificationRadius) || 1000,
    },

    // Emergency contact
    emergencyContact: {
      name: data.emergencyContactName?.trim() || "",
      phone: data.emergencyContactPhone?.trim() || "",
    },

    isActive: true,
    isVerified: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Add type-specific fields
  if (data.userType === "PROVIDER") {
    return {
      ...baseUserData,
      organizationName: data.organizationName?.trim(),
      licenseNumber: data.licenseNumber?.trim() || "",
      avgDailyCapacity: data.avgDailyCapacity ? parseInt(data.avgDailyCapacity) : 0,
      dietaryInfo: data.dietaryRestrictions?.trim() || "",
      stats: {
        totalFoodListed: 0,
        totalFoodDistributed: 0,
        rating: 5.0,
        totalRatings: 0,
      },
    };
  } else {
    // RECIPIENT
    const recipientData = {
      ...baseUserData,
      subType: data.subType,
      dietaryRestrictions: data.dietaryRestrictions?.trim() || "",
      stats: {
        totalFoodReceived: 0,
        totalPickups: 0,
        rating: 5.0,
        totalRatings: 0,
      },
    };

    // Add subtype specific fields
    if (data.subType === "STUDENT" || data.subType === "STAFF") {
      recipientData.campusId = data.campusId?.trim();
      recipientData.department = data.department?.trim();
      recipientData.yearOfStudy = data.yearOfStudy?.trim() || "";
      recipientData.hostel = data.hostel?.trim() || "";
    } else if (data.subType === "NGO") {
      recipientData.ngoName = data.ngoName?.trim();
      recipientData.registrationNumber = data.registrationNumber?.trim();
      recipientData.maxPickupCapacity = data.maxPickupCapacity ? parseInt(data.maxPickupCapacity) : 0;
    }

    return recipientData;
  }
}
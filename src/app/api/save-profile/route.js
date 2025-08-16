// app/api/save-profile/route.js
import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Provider, Recipient, getUserModel } from "@/models/User";

export async function POST(request) {
  try {
    // Verify authentication
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized - No user ID found" },
        { status: 401 }
      );
    }

    // Get Clerk user object for email and existing metadata
    const clerkUser = await clerkClient.users.getUser(userId);
    if (!clerkUser) {
      return NextResponse.json({ error: "User not found in Clerk" }, { status: 404 });
    }

    const userEmail = clerkUser.emailAddresses?.[0]?.emailAddress;
    if (!userEmail) {
      return NextResponse.json({ error: "User email not found" }, { status: 400 });
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

    // Get the appropriate model and save to the database using 'upsert'
    const savedUser = await getUserModel(profileData.userType).findOneAndUpdate(
      { id: userId }, // Query by clerk user ID
      userData,       // Data to insert or update
      { 
        new: true,           // Return the modified document
        upsert: true,        // Create a new doc if no match is found
        runValidators: true, // Run schema validators on update
        setDefaultsOnInsert: true // Apply schema defaults on insert
      }
    );

    // ✅ --- CLERK METADATA UPDATE --- ✅
    // This block now correctly syncs with your middleware and header
    await clerkClient.users.updateUser(userId, {
      publicMetadata: {
        ...clerkUser.publicMetadata,    // Safely merge with existing metadata
        hasOnboarded: true,             // Good practice to set this flag
        hasCompleteProfile: true,       // **THE FIX**: Correct flag for your middleware
        mainRole: profileData.userType, // Syncs the role for your header component
      },
    });

    // Return success response
    return NextResponse.json({
      success: true,
      message: "Profile saved and synced successfully",
      user: {
        id: savedUser.id,
        name: savedUser.name,
        userType: savedUser.userType,
        subType: savedUser.subType || null,
        createdAt: savedUser.createdAt,
      },
    });

  } catch (error) {
    console.error("Error in POST /api/save-profile:", error);

    // Handle specific error types
    if (error.code === 11000) {
      return NextResponse.json({ error: "A profile with this identifier already exists" }, { status: 409 });
    }
    if (error.name === "ValidationError") {
      const validationErrors = Object.values(error.errors).map((err) => err.message);
      return NextResponse.json({ error: "Validation failed", details: validationErrors }, { status: 400 });
    }
    
    // Check for Clerk-related errors by looking at the error object structure
    if (error.errors && Array.isArray(error.errors)) {
      const clerkError = error.errors[0];
      return NextResponse.json({ error: "Authentication service error", details: clerkError.longMessage || clerkError.message }, { status: 503 });
    }

    // Generic fallback error
    return NextResponse.json(
      { error: "Internal server error", details: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}


// Get user profile
export async function GET(request) {
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    // Try to find user in both collections
    let user = await Provider.findOne({ id: userId }).lean(); // Use .lean() for faster, plain JS objects
    let userType = "PROVIDER";

    if (!user) {
      user = await Recipient.findOne({ id: userId }).lean();
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
        ...user,
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
  if (!data.userType) { errors.push("User type is required"); }
  if (!data.firstName?.trim()) { errors.push("First name is required"); }
  if (!data.lastName?.trim()) { errors.push("Last name is required"); }
  if (!data.phoneNumber?.trim()) { errors.push("Phone number is required"); }
  if (data.phoneNumber && !/^\+?[\d\s\-\(\)]+$/.test(data.phoneNumber)) { errors.push("Invalid phone number format"); }
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) { errors.push("Invalid email format"); }
  if (data.userType === "PROVIDER") {
    if (!data.organizationName?.trim()) { errors.push("Organization name is required"); }
    if (data.avgDailyCapacity && data.avgDailyCapacity < 0) { errors.push("Average daily capacity cannot be negative"); }
  }
  if (data.userType === "RECIPIENT") {
    if (!data.subType) { errors.push("Recipient sub-type is required"); }
    if (["STUDENT", "STAFF"].includes(data.subType)) {
      if (!data.campusId?.trim()) { errors.push("Campus ID is required"); }
      if (!data.department?.trim()) { errors.push("Department is required"); }
    }
    if (data.subType === "NGO") {
      if (!data.ngoName?.trim()) { errors.push("NGO name is required"); }
      if (!data.registrationNumber?.trim()) { errors.push("Registration number is required"); }
      if (data.maxPickupCapacity && data.maxPickupCapacity < 0) { errors.push("Maximum pickup capacity cannot be negative"); }
    }
  }
  if (data.latitude && (isNaN(data.latitude) || data.latitude < -90 || data.latitude > 90)) { errors.push("Latitude must be between -90 and 90"); }
  if (data.longitude && (isNaN(data.longitude) || data.longitude < -180 || data.longitude > 180)) { errors.push("Longitude must be between -180 and 180"); }
  if (data.notificationRadius && (data.notificationRadius < 100 || data.notificationRadius > 5000)) { errors.push("Notification radius must be between 100 and 5000 meters"); }
  return { isValid: errors.length === 0, errors };
}

// Transform form data to match database models
function transformProfileData(userId, email, data) {
  const baseUserData = {
    id: userId,
    email: email,
    phone: data.phoneNumber?.trim(),
    name: `${data.firstName?.trim()} ${data.lastName?.trim()}`,
    profilePicture: data.profilePicture?.trim() || "",
    userType: data.userType,
    location: {
      address: data.address?.trim() || "",
      latitude: data.latitude ? parseFloat(data.latitude) : null,
      longitude: data.longitude ? parseFloat(data.longitude) : null,
    },
    notifications: {
      email: Boolean(data.emailNotifications),
      push: Boolean(data.pushNotifications),
      sms: Boolean(data.smsNotifications),
      radius: parseInt(data.notificationRadius) || 1000,
    },
    emergencyContact: {
      name: data.emergencyContactName?.trim() || "",
      phone: data.emergencyContactPhone?.trim() || "",
    },
    isActive: true,
    isVerified: false,
    updatedAt: new Date(),
  };

  if (data.userType === "PROVIDER") {
    return {
      ...baseUserData,
      organizationName: data.organizationName?.trim(),
      licenseNumber: data.licenseNumber?.trim() || "",
      avgDailyCapacity: data.avgDailyCapacity ? parseInt(data.avgDailyCapacity) : 0,
      dietaryInfo: data.dietaryRestrictions?.trim() || "",
      stats: { totalFoodListed: 0, totalFoodDistributed: 0, rating: 5.0, totalRatings: 0 },
    };
  } else {
    const recipientData = {
      ...baseUserData,
      subType: data.subType,
      dietaryRestrictions: data.dietaryRestrictions?.trim() || "",
      stats: { totalFoodReceived: 0, totalPickups: 0, rating: 5.0, totalRatings: 0 },
    };
    if (["STUDENT", "STAFF"].includes(data.subType)) {
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
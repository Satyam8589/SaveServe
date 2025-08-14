"use server";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "../prisma";

export const checkUser = async () => {
  const user = await currentUser();

  if (!user) {
    return null;
  }

  try {
    // 1. Try to find existing user by Clerk ID
    const existingUser = await db.user.findUnique({
      where: {
        clerkId: user.id,
      },
    });

    if (existingUser) {
      return existingUser;
    }

    // 2. Get role information from Clerk public metadata
    const publicMetadata = user.publicMetadata || {};
    const mainRole = publicMetadata.mainRole || "STUDENT"; // fallback to STUDENT
    const subRole = publicMetadata.subRole || null;

    // 3. Create new user with defaults from your model
    const newUser = await db.user.create({
      data: {
        clerkId: user.id,
        email: user.emailAddresses[0]?.emailAddress || "",
        firstName: user.firstName || null,
        lastName: user.lastName || null,
        imageUrl: user.imageUrl || null,
        role: mainRole.toUpperCase(), // Ensure it matches your enum
        subRole: subRole,
        // Notification preferences (defaults already set in schema)
        emailNotifications: true,
        pushNotifications: true,
        smsNotifications: false,
        notificationRadius: 1000,
        // Gamification defaults
        totalPoints: 0,
        currentLevel: 1,
        totalFoodSaved: 0,
        totalCarbonSaved: 0,
        totalWaterSaved: 0,
        streakDays: 0,
        isActive: true,
        isVerified: false,
        lastLoginAt: new Date(),
      },
    });

    return newUser;
  } catch (error) {
    console.error("Error checking or creating user:", error);
    return null;
  }
};

export const saveUserProfile = async (profileData) => {
  const user = await currentUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  try {
    // Get role information from Clerk public metadata
    const publicMetadata = user.publicMetadata || {};
    const mainRole = publicMetadata.mainRole;
    const subRole = publicMetadata.subRole;

    // Prepare the update data
    const updateData = {
      // Update basic info from profile form (override Clerk data with form data)
      firstName: profileData.firstName?.trim() || user.firstName || null,
      lastName: profileData.lastName?.trim() || user.lastName || null,
      phoneNumber: profileData.phoneNumber?.trim() || null,
      
      // Location information
      hostel: profileData.hostel?.trim() || null,
      roomNumber: profileData.roomNumber?.trim() || null,
      department: profileData.department?.trim() || null,
      year: profileData.year || null,
      campusLocation: profileData.campusLocation?.trim() || null,
      
      // Coordinates
      latitude: profileData.latitude ? parseFloat(profileData.latitude) : null,
      longitude: profileData.longitude ? parseFloat(profileData.longitude) : null,
      
      // Food preferences
      dietaryRestrictions: profileData.dietaryRestrictions?.trim() || null,
      allergies: profileData.allergies?.trim() || null,
      foodPreferences: profileData.foodPreferences?.trim() || null,
      
      // Notification preferences
      emailNotifications: profileData.emailNotifications ?? true,
      pushNotifications: profileData.pushNotifications ?? true,
      smsNotifications: profileData.smsNotifications ?? false,
      notificationRadius: profileData.notificationRadius ? parseInt(profileData.notificationRadius) : 1000,
      
      // Update role information from Clerk metadata
      role: mainRole ? mainRole.toUpperCase() : "STUDENT",
      subRole: subRole || null,
      
      // Mark profile as completed
      hasOnboarded: true,
      
      // Update last login
      lastLoginAt: new Date(),
    };

    // Check if user exists, if not create them first
    let existingUser = await db.user.findUnique({
      where: {
        clerkId: user.id,
      },
    });

    if (!existingUser) {
      // Create user if they don't exist
      existingUser = await db.user.create({
        data: {
          clerkId: user.id,
          email: user.emailAddresses[0]?.emailAddress || "",
          firstName: user.firstName || null,
          lastName: user.lastName || null,
          imageUrl: user.imageUrl || null,
          role: "STUDENT",
          // Notification preferences defaults
          emailNotifications: true,
          pushNotifications: true,
          smsNotifications: false,
          notificationRadius: 1000,
          // Gamification defaults
          totalPoints: 0,
          currentLevel: 1,
          totalFoodSaved: 0,
          totalCarbonSaved: 0,
          totalWaterSaved: 0,
          streakDays: 0,
          isActive: true,
          isVerified: false,
          hasOnboarded: false,
          lastLoginAt: new Date(),
        },
      });
    }

    // Update the user with profile data
    const updatedUser = await db.user.update({
      where: {
        clerkId: user.id,
      },
      data: updateData,
    });

    return updatedUser;
  } catch (error) {
    console.error("Error saving user profile:", error);
    throw new Error("Failed to save user profile");
  }
};

export const getUserProfile = async () => {
  const user = await currentUser();

  if (!user) {
    return null;
  }

  try {
    const userProfile = await db.user.findUnique({
      where: {
        clerkId: user.id,
      },
    });

    return userProfile;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
};

export const syncUserFromClerkMetadata = async () => {
  const user = await currentUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  try {
    // Get role information from Clerk public metadata
    const publicMetadata = user.publicMetadata || {};
    const mainRole = publicMetadata.mainRole;
    const subRole = publicMetadata.subRole;
    const hasOnboarded = publicMetadata.hasOnboarded || false;

    // Check if user exists in database
    let existingUser = await db.user.findUnique({
      where: {
        clerkId: user.id,
      },
    });

    if (existingUser) {
      // Update existing user with metadata changes
      const updatedUser = await db.user.update({
        where: {
          clerkId: user.id,
        },
        data: {
          role: mainRole ? mainRole.toUpperCase() : existingUser.role,
          subRole: subRole || existingUser.subRole,
          hasOnboarded: hasOnboarded,
          lastLoginAt: new Date(),
        },
      });
      return updatedUser;
    } else {
      // Create new user if they don't exist
      const newUser = await db.user.create({
        data: {
          clerkId: user.id,
          email: user.emailAddresses[0]?.emailAddress || "",
          firstName: user.firstName || null,
          lastName: user.lastName || null,
          imageUrl: user.imageUrl || null,
          role: mainRole ? mainRole.toUpperCase() : "STUDENT",
          subRole: subRole || null,
          hasOnboarded: hasOnboarded,
          // Notification preferences defaults
          emailNotifications: true,
          pushNotifications: true,
          smsNotifications: false,
          notificationRadius: 1000,
          // Gamification defaults
          totalPoints: 0,
          currentLevel: 1,
          totalFoodSaved: 0,
          totalCarbonSaved: 0,
          totalWaterSaved: 0,
          streakDays: 0,
          isActive: true,
          isVerified: false,
          lastLoginAt: new Date(),
        },
      });
      return newUser;
    }
  } catch (error) {
    console.error("Error syncing user from Clerk metadata:", error);
    throw new Error("Failed to sync user data");
  }
};
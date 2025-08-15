"use server"
import { currentUser } from "@clerk/nextjs/server";
import { db } from "../lib/prisma";

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
      return { 
        user: existingUser, 
        isNewUser: false 
      };
    }

    // 2. Create new user with defaults from your model
    const newUser = await db.user.create({
      data: {
        clerkId: user.id,
        email: user.emailAddresses[0]?.emailAddress || "",
        firstName: user.firstName || null,
        lastName: user.lastName || null,
        imageUrl: user.imageUrl || null,
        role: "STUDENT", // default from your model
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
        // Add onboarding flag
        hasCompletedOnboarding: false,
      },
    });

    return { 
      user: newUser, 
      isNewUser: true 
    };
  } catch (error) {
    console.error("Error checking or creating user:", error);
    return null;
  }
};

export const completeOnboarding = async (userType, preferences) => {
  const user = await currentUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  try {
    console.log("Starting onboarding completion for user:", user.id);
    console.log("UserType:", userType);
    console.log("Preferences:", preferences);

    // Validate required parameters
    if (!userType) {
      throw new Error("User type is required");
    }

    if (!preferences) {
      throw new Error("Preferences are required");
    }

    // Validate preferences object structure
    const requiredPrefs = ['emailNotifications', 'pushNotifications', 'notificationRadius'];
    for (const pref of requiredPrefs) {
      if (preferences[pref] === undefined) {
        throw new Error(`Missing required preference: ${pref}`);
      }
    }

    // First, check if user exists in database
    const existingUser = await db.user.findUnique({
      where: {
        clerkId: user.id,
      },
    });

    if (!existingUser) {
      throw new Error("User not found in database. Please try signing in again.");
    }

    // Update user in database first
    console.log("Updating database...");
    const updatedUser = await db.user.update({
      where: {
        clerkId: user.id,
      },
      data: {
        hasCompletedOnboarding: true,
        // Update notification preferences with safe access
        emailNotifications: Boolean(preferences.emailNotifications),
        pushNotifications: Boolean(preferences.pushNotifications),
        notificationRadius: Number(preferences.notificationRadius) || 1000,
        // Update last login
        lastLoginAt: new Date(),
      },
    });

    console.log("Database updated successfully");

    // Then update Clerk user metadata (server-side) - make this optional
    console.log("Attempting to update Clerk metadata...");
    
    try {
      // Try different import approaches
      let clerkClient;
      
      try {
        // Method 1: Dynamic import
        const clerkModule = await import("@clerk/nextjs/server");
        clerkClient = clerkModule.clerkClient;
        console.log("ClerkClient imported via dynamic import:", !!clerkClient);
      } catch (importError) {
        console.log("Dynamic import failed:", importError.message);
        
        // Method 2: Try createClerkClient
        try {
          const { createClerkClient } = await import("@clerk/nextjs/server");
          clerkClient = createClerkClient({
            secretKey: process.env.CLERK_SECRET_KEY,
          });
          console.log("ClerkClient created via createClerkClient:", !!clerkClient);
        } catch (createError) {
          console.log("createClerkClient failed:", createError.message);
        }
      }
      
      if (clerkClient && clerkClient.users && clerkClient.users.updateUserMetadata) {
        await clerkClient.users.updateUserMetadata(user.id, {
          publicMetadata: {
            userType: userType
          }
        });
        console.log("Clerk metadata updated successfully");
      } else {
        console.log("ClerkClient or updateUserMetadata method not available");
        console.log("Available clerkClient methods:", clerkClient ? Object.keys(clerkClient) : 'clerkClient is null/undefined');
      }
    } catch (clerkError) {
      // Don't fail the entire onboarding if Clerk metadata update fails
      console.error("Failed to update Clerk metadata, but continuing:", clerkError);
    }

    return updatedUser;
  } catch (error) {
    // Log the full error details for debugging
    console.error("Full error details:", {
      name: error.name,
      message: error.message,
      stack: error.stack,
      cause: error.cause,
      userType,
      preferences,
      userId: user?.id,
      userObject: user
    });
    
    // Return more specific error messages
    if (error.message.includes("User not found")) {
      throw new Error("User not found in database. Please try signing in again.");
    }
    
    if (error.message.includes("Missing required preference") || error.message.includes("are required")) {
      throw new Error(`Invalid parameters: ${error.message}`);
    }
    
    if (error.message.includes("Prisma") || error.message.includes("database")) {
      throw new Error("Database error. Please try again.");
    }

    if (error.message.includes("Clerk")) {
      throw new Error("Failed to update user profile. Please try again.");
    }
    
    // For debugging - throw the original error message in development
    throw new Error(`Onboarding failed: ${error.message}`);
  }
};
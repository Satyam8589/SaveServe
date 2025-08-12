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
      },
    });

    return newUser;
  } catch (error) {
    console.error("Error checking or creating user:", error);
    return null;
  }
};

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import FoodListing from "@/models/FoodListing";
import UserProfile from "@/models/UserProfile";
import { createVisibilityQuery, isListingVisibleToUser } from "@/lib/visibilityUtils";
import { auth } from "@clerk/nextjs/server";

export async function GET(request) {
  try {
    await connectDB();

    // Get user authentication
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    // Get user profile
    const userProfile = await UserProfile.findOne({ userId }).lean();
    
    if (!userProfile) {
      return NextResponse.json(
        { success: false, message: "User profile not found" },
        { status: 404 }
      );
    }

    // Get all food listings (without filtering)
    const allListings = await FoodListing.find({
      isActive: true,
      expiryTime: { $gte: new Date() },
      quantity: { $gt: 0 }
    }).sort({ createdAt: -1 });

    // Test visibility for each listing
    const visibilityTest = allListings.map(listing => {
      const isVisible = isListingVisibleToUser(listing, userProfile.role, userProfile.subrole);
      const isCurrentlyNGOExclusive = listing.isNGOExclusive && 
        listing.ngoExclusiveUntil && 
        new Date() < new Date(listing.ngoExclusiveUntil);

      return {
        id: listing._id.toString(),
        title: listing.title,
        quantity: listing.quantity,
        isNGOExclusive: listing.isNGOExclusive,
        ngoExclusiveUntil: listing.ngoExclusiveUntil,
        isCurrentlyNGOExclusive,
        isVisibleToCurrentUser: isVisible,
        createdAt: listing.createdAt
      };
    });

    // Get visibility query
    const visibilityQuery = createVisibilityQuery(userProfile.role, userProfile.subrole);
    
    // Get filtered listings using the query
    const filteredListings = await FoodListing.find(visibilityQuery).sort({ createdAt: -1 });

    // Test with different user types
    const testUsers = [
      { role: 'RECIPIENT', subrole: 'NGO', name: 'Test NGO' },
      { role: 'RECIPIENT', subrole: 'STUDENT', name: 'Test Student' },
      { role: 'RECIPIENT', subrole: 'STAFF', name: 'Test Staff' }
    ];

    const userTypeTests = testUsers.map(testUser => {
      const testQuery = createVisibilityQuery(testUser.role, testUser.subrole);
      const visibleListings = allListings.filter(listing =>
        isListingVisibleToUser(listing, testUser.role, testUser.subrole)
      );

      return {
        userType: `${testUser.role}-${testUser.subrole}`,
        name: testUser.name,
        visibilityQuery: testQuery,
        visibleListingsCount: visibleListings.length,
        visibleListings: visibleListings.map(l => ({
          id: l._id.toString(),
          title: l.title,
          quantity: l.quantity,
          isNGOExclusive: l.isNGOExclusive,
          isCurrentlyNGOExclusive: l.isNGOExclusive && l.ngoExclusiveUntil && new Date() < new Date(l.ngoExclusiveUntil)
        }))
      };
    });

    return NextResponse.json({
      success: true,
      currentUser: {
        userId,
        role: userProfile.role,
        subrole: userProfile.subrole,
        fullName: userProfile.fullName
      },
      visibilityQuery,
      totalListings: allListings.length,
      filteredListings: filteredListings.length,
      visibilityTest,
      userTypeTests,
      currentTime: new Date().toISOString()
    });

  } catch (error) {
    console.error("Error testing visibility:", error);
    return NextResponse.json(
      { success: false, message: "Error testing visibility", error: error.message },
      { status: 500 }
    );
  }
}

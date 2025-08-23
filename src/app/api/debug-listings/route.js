import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import FoodListing from "@/models/FoodListing";

export async function GET(request) {
  try {
    await connectDB();

    // Get all active listings with NGO exclusive info
    const listings = await FoodListing.find({
      isActive: true,
      expiryTime: { $gte: new Date() },
      quantity: { $gt: 0 }
    }).sort({ createdAt: -1 });

    const now = new Date();
    
    const debugInfo = listings.map(listing => ({
      id: listing._id.toString(),
      title: listing.title,
      quantity: listing.quantity,
      isNGOExclusive: listing.isNGOExclusive,
      ngoExclusiveUntil: listing.ngoExclusiveUntil,
      isCurrentlyNGOExclusive: listing.isNGOExclusive && listing.ngoExclusiveUntil && now < new Date(listing.ngoExclusiveUntil),
      createdAt: listing.createdAt,
      timeUntilPublic: listing.ngoExclusiveUntil ? Math.max(0, new Date(listing.ngoExclusiveUntil) - now) : 0,
      shouldBeNGOExclusive: listing.quantity > 50,
      isCorrectlyConfigured: (listing.quantity > 50) === listing.isNGOExclusive
    }));

    // Check for configuration issues
    const issues = debugInfo.filter(item => !item.isCorrectlyConfigured);

    return NextResponse.json({
      success: true,
      currentTime: now.toISOString(),
      totalListings: listings.length,
      debugInfo,
      configurationIssues: issues,
      summary: {
        highQuantityListings: debugInfo.filter(l => l.quantity > 50).length,
        ngoExclusiveListings: debugInfo.filter(l => l.isNGOExclusive).length,
        currentlyNGOExclusive: debugInfo.filter(l => l.isCurrentlyNGOExclusive).length,
        configurationErrors: issues.length
      }
    });

  } catch (error) {
    console.error("Error debugging listings:", error);
    return NextResponse.json(
      { success: false, message: "Error debugging listings", error: error.message },
      { status: 500 }
    );
  }
}

import { connectDB } from "@/lib/db";
import FoodListing from "@/models/FoodListing";
import Booking from "@/models/Booking";

export async function GET(request) {
  try {
    await connectDB();

    const foodListings = await FoodListing.find({
      isActive: true,
      expiryTime: { $gte: new Date() },
      quantity: { $gt: 0 }, // Only get listings with quantity > 0
    }).sort({ createdAt: -1 });

    // Get all active listings IDs for efficient querying
    const listingIds = foodListings.map(listing => listing._id);

    // Fetch all bookings for these listings to calculate claims and ratings
    const bookings = await Booking.find({
      listingId: { $in: listingIds }
    });

    // Create a map for efficient lookup
    const bookingStats = {};
    const providerStats = {}; // Track provider ratings across all listings
    
    bookings.forEach(booking => {
      const listingId = booking.listingId.toString();
      if (!bookingStats[listingId]) {
        bookingStats[listingId] = {
          totalClaims: 0,
          completedClaims: 0,
          totalRating: 0,
          ratedBookings: 0,
          providerRatings: [],
          successRate: 0
        };
      }
      
      // Count total claims
      bookingStats[listingId].totalClaims++;
      
      // Count completed claims
      if (booking.status === 'collected') {
        bookingStats[listingId].completedClaims++;
      }
      
      // Calculate average rating
      if (booking.rating && booking.rating > 0) {
        bookingStats[listingId].totalRating += booking.rating;
        bookingStats[listingId].ratedBookings++;
      }

      // Track provider ratings
      if (booking.providerId) {
        if (!providerStats[booking.providerId]) {
          providerStats[booking.providerId] = {
            totalRating: 0,
            ratedBookings: 0
          };
        }
        if (booking.rating && booking.rating > 0) {
          providerStats[booking.providerId].totalRating += booking.rating;
          providerStats[booking.providerId].ratedBookings++;
        }
      }
    });

    // Compute available quantity per listing and filter out fully booked
    const transformedListings = foodListings
      .map((listing) => {
      const now = new Date();
      const timeLeft = Math.max(
        0,
        Math.floor((listing.expiryTime - now) / (1000 * 60))
      ); // minutes
      const hours = Math.floor(timeLeft / 60);
      const minutes = timeLeft % 60;

      let status = "available";
      if (timeLeft <= 60) status = "urgent";

      const timeLeftDisplay =
        hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

      // Since quantity is now permanently reduced when booked, available = current quantity
      const available = Math.max(0, listing.quantity || 0);

      // Get booking statistics for this listing
      const stats = bookingStats[listing._id.toString()] || {
        totalClaims: 0,
        completedClaims: 0,
        totalRating: 0,
        ratedBookings: 0,
        providerRatings: [],
        successRate: 0
      };

      // Calculate success rate
      const successRate = stats.totalClaims > 0 
        ? Math.round((stats.completedClaims / stats.totalClaims) * 100) 
        : 0;

      // Calculate average rating
      const averageRating = stats.ratedBookings > 0 
        ? (stats.totalRating / stats.ratedBookings) 
        : 0;

      // Calculate provider rating
      const providerRating = providerStats[listing.providerId]?.ratedBookings > 0
        ? parseFloat((providerStats[listing.providerId].totalRating / providerStats[listing.providerId].ratedBookings).toFixed(1))
        : null;

      return {
        id: listing._id.toString(),
        title: listing.title,
        description: listing.description,
        category: listing.category,
        foodType: listing.foodType, // Add food type
        quantity: `${available} ${listing.unit}`,
        location: listing.location,
        provider: listing.providerName,
        timeLeft: timeLeftDisplay,
        status: status,
        freshness: listing.freshnessStatus,
        freshnessHours: listing.freshnessHours,
        type: "Main Course",
        distance: "0.5 km",
        posted: getTimeAgo(listing.createdAt),
        rating: averageRating > 0 ? parseFloat(averageRating.toFixed(1)) : null,
        claims: stats.totalClaims,
        totalClaims: stats.totalClaims,
        completedClaims: stats.completedClaims,
        totalRatings: stats.ratedBookings,
        successRate: successRate,
        providerRating: providerRating,
        providerTotalRatings: providerStats[listing.providerId]?.ratedBookings || 0,
        imageUrl: listing.imageUrl,
        expiryTime: listing.expiryTime,
        availabilityWindow: listing.availabilityWindow,
        providerId: listing.providerId,
        availableNumeric: available,
      };
    })
    .filter((l) => (l.availableNumeric ?? 0) > 0);



    return new Response(
      JSON.stringify({
        success: true,
        data: transformedListings,
        count: transformedListings.length,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error fetching food listings:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Error fetching food listings",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

// Add POST method for real-time updates
export async function POST(request) {
  try {
    const { action, listingId } = await request.json();
    
    if (action === 'refresh') {
      // This endpoint can be called to trigger a refresh
      // In a real app, you might want to implement WebSocket or Server-Sent Events
      
      return new Response(
        JSON.stringify({
          success: true,
          message: "Refresh request received",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
    
    return new Response(
      JSON.stringify({
        success: false,
        message: "Invalid action",
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in POST food listings:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Error processing request",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

// Helper function
function getTimeAgo(date) {
  const now = new Date();
  const diffInMinutes = Math.floor((now - date) / (1000 * 60));
  if (diffInMinutes < 60) return `${diffInMinutes} mins ago`;
  if (diffInMinutes < 1440)
    return `${Math.floor(diffInMinutes / 60)} hour${
      Math.floor(diffInMinutes / 60) > 1 ? "s" : ""
    } ago`;
  return `${Math.floor(diffInMinutes / 1440)} day${
    Math.floor(diffInMinutes / 1440) > 1 ? "s" : ""
  } ago`;
}

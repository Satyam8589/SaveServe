import { connectDB } from '@/lib/db';
import FoodListing from '@/models/FoodListing';

export async function GET(request) {
  try {
    await connectDB();

    const foodListings = await FoodListing.find({
      isActive: true,
      expiryTime: { $gte: new Date() }
    }).sort({ createdAt: -1 });

    const transformedListings = foodListings.map(listing => {
      const now = new Date();
      const timeLeft = Math.max(0, Math.floor((listing.expiryTime - now) / (1000 * 60))); // minutes
      const hours = Math.floor(timeLeft / 60);
      const minutes = timeLeft % 60;

      let status = 'available';
      if (timeLeft <= 60) status = 'urgent';

      const timeLeftDisplay = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

      return {
        id: listing._id.toString(),
        title: listing.title,
        description: listing.description,
        quantity: listing.availableQuantity,
        location: listing.location,
        provider: listing.providerName,
        timeLeft: timeLeftDisplay,
        status: status,
        freshness: listing.freshnessStatus,
        freshnessHours: listing.freshnessHours, // Added this line
        type: "Main Course",
        distance: "0.5 km",
        posted: getTimeAgo(listing.createdAt),
        rating: 4.5,
        claims: 0,
        imageUrl: listing.imageUrl,
        expiryTime: listing.expiryTime,
        availabilityWindow: listing.availabilityWindow,
        providerId: listing.providerId
      };
    });

    return new Response(JSON.stringify({
      success: true,
      data: transformedListings,
      count: transformedListings.length
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error fetching food listings:', error);
    return new Response(JSON.stringify({
      success: false,
      message: 'Error fetching food listings'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Helper function
function getTimeAgo(date) {
  const now = new Date();
  const diffInMinutes = Math.floor((now - date) / (1000 * 60));
  if (diffInMinutes < 60) return `${diffInMinutes} mins ago`;
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes/60)} hour${Math.floor(diffInMinutes/60) > 1 ? 's' : ''} ago`;
  return `${Math.floor(diffInMinutes/1440)} day${Math.floor(diffInMinutes/1440) > 1 ? 's' : ''} ago`;
}
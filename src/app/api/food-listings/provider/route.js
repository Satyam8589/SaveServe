import { connectDB } from "@/lib/db";
import FoodListing from "@/models/FoodListing";

export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const location = searchParams.get("location");
    const category = searchParams.get("category");
    const providerId = searchParams.get("providerId");

    if (!providerId) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Provider ID is required",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Build filters
    const filters = {};
    if (location) filters.location = location;
    if (category) filters.category = category;

    // Get provider's own listings (all of them, regardless of visibility)
    const ownListings = await FoodListing.find({
      ...filters,
      providerId: providerId,
      isActive: true,
      expiryTime: { $gte: new Date() },
      listingStatus: { $in: ["active", "partially_booked"] },
    });

    // Get public listings from other providers (respecting visibility rules)
    const otherProvidersListings = await FoodListing.findVisibleToAll({
      ...filters,
      providerId: { $ne: providerId }, // Exclude own listings
    });

    // Combine listings (own listings first, then public listings from others)
    const allListings = [...ownListings, ...otherProvidersListings];

    // Sort by creation date (newest first)
    allListings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Transform listings for frontend consumption
    const transformedListings = allListings
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

        // Check if this is the provider's own listing
        const isOwnListing = listing.providerId === providerId;

        // Add visibility info for own listings
        let visibilityInfo = null;
        if (isOwnListing) {
          if (listing.visibilityRules.isHighQuantity) {
            if (!listing.visibilityRules.isVisibleToAll) {
              const timeUntilVisible = Math.max(
                0,
                listing.visibilityRules.recipientOnlyUntil - now
              );
              const minutesUntilVisible = Math.floor(
                timeUntilVisible / (1000 * 60)
              );
              visibilityInfo = {
                type: "own_recipient_only",
                timeUntilVisible: minutesUntilVisible,
                message: `Your listing is exclusive to recipients for ${minutesUntilVisible}m more`,
              };
            } else {
              visibilityInfo = {
                type: "own_visible_to_all",
                message: "Your listing is now visible to all users",
              };
            }
          } else {
            visibilityInfo = {
              type: "own_low_quantity",
              message: "Your listing is visible to all users",
            };
          }
        } else {
          // Other providers' listings are already filtered to be visible to all
          visibilityInfo = {
            type: "other_provider",
            message: "From another provider",
          };
        }

        return {
          id: listing._id.toString(),
          title: listing.title,
          description: listing.description,
          category: listing.category,
          foodType: listing.foodType,
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
          rating: 4.5,
          claims: 0,
          imageUrl: listing.imageUrl,
          expiryTime: listing.expiryTime,
          availabilityWindow: listing.availabilityWindow,
          providerId: listing.providerId,
          availableNumeric: available,
          visibilityInfo: visibilityInfo,
          isOwnListing: isOwnListing,
          isHighQuantity: listing.visibilityRules.isHighQuantity,
          createdAt: listing.createdAt,
        };
      })
      .filter((l) => (l.availableNumeric ?? 0) > 0);

    return new Response(
      JSON.stringify({
        success: true,
        data: transformedListings,
        count: transformedListings.length,
        visibilitySummary: {
          ownListings: transformedListings.filter((l) => l.isOwnListing).length,
          otherProviders: transformedListings.filter((l) => !l.isOwnListing)
            .length,
          ownHighQuantity: transformedListings.filter(
            (l) => l.isOwnListing && l.isHighQuantity
          ).length,
          ownLowQuantity: transformedListings.filter(
            (l) => l.isOwnListing && !l.isHighQuantity
          ).length,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error fetching provider food listings:", error);
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

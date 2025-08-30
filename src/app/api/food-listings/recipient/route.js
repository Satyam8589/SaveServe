import { connectDB } from "@/lib/db";
import FoodListing from "@/models/FoodListing";

export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const location = searchParams.get("location");
    const category = searchParams.get("category");
    const providerId = searchParams.get("providerId");

    // Build filters
    const filters = {};
    if (location) filters.location = location;
    if (category) filters.category = category;
    if (providerId) filters.providerId = providerId;

    // Get both recipient-only listings and listings visible to all
    const [recipientOnlyListings, visibleToAllListings] = await Promise.all([
      FoodListing.findRecipientOnly(filters),
      FoodListing.findVisibleToAll(filters),
    ]);

    // Combine and deduplicate listings (recipient-only listings take priority)
    const allListings = [...recipientOnlyListings];

    // Add visible-to-all listings that aren't already in recipient-only
    visibleToAllListings.forEach((listing) => {
      const exists = allListings.some(
        (existing) => existing._id.toString() === listing._id.toString()
      );
      if (!exists) {
        allListings.push(listing);
      }
    });

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

        // Calculate time until visibility changes for high quantity items
        let visibilityInfo = null;
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
              type: "recipient_only",
              timeUntilVisible: minutesUntilVisible,
              message: `Exclusive to recipients for ${minutesUntilVisible}m more`,
            };
          } else {
            visibilityInfo = {
              type: "visible_to_all",
              message: "Now visible to all users",
            };
          }
        } else {
          visibilityInfo = {
            type: "low_quantity",
            message: "Visible to all users",
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
          recipientOnly: transformedListings.filter(
            (l) => l.visibilityInfo.type === "recipient_only"
          ).length,
          visibleToAll: transformedListings.filter(
            (l) => l.visibilityInfo.type !== "recipient_only"
          ).length,
          highQuantity: transformedListings.filter((l) => l.isHighQuantity)
            .length,
          lowQuantity: transformedListings.filter((l) => !l.isHighQuantity)
            .length,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error fetching recipient food listings:", error);
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

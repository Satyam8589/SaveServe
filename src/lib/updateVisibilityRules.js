import { connectDB } from "@/lib/db";
import FoodListing from "@/models/FoodListing";

/**
 * Updates visibility rules for all food listings
 * This function should be called periodically (e.g., every minute) to ensure
 * high quantity items become visible to all users after 30 minutes
 */
export async function updateVisibilityRules() {
  try {
    await connectDB();

    const now = new Date();

    // Find all high quantity listings that are still in recipient-only period
    const highQuantityListings = await FoodListing.find({
      "visibilityRules.isHighQuantity": true,
      "visibilityRules.isVisibleToAll": false,
      "visibilityRules.recipientOnlyUntil": { $lte: now },
      isActive: true,
    });

    if (highQuantityListings.length === 0) {
      console.log("No visibility rules to update");
      return { updated: 0 };
    }

    // Update these listings to be visible to all
    const updatePromises = highQuantityListings.map((listing) =>
      FoodListing.findByIdAndUpdate(
        listing._id,
        {
          "visibilityRules.isVisibleToAll": true,
        },
        { new: true }
      )
    );

    const updatedListings = await Promise.all(updatePromises);

    console.log(
      `Updated visibility rules for ${updatedListings.length} listings`
    );

    return {
      updated: updatedListings.length,
      listings: updatedListings.map((l) => ({
        id: l._id,
        title: l.title,
        quantity: l.quantity,
        isVisibleToAll: l.visibilityRules.isVisibleToAll,
      })),
    };
  } catch (error) {
    console.error("Error updating visibility rules:", error);
    throw error;
  }
}

/**
 * Gets a summary of current visibility rules
 */
export async function getVisibilitySummary() {
  try {
    await connectDB();

    const now = new Date();

    const summary = await FoodListing.aggregate([
      {
        $match: {
          isActive: true,
          expiryTime: { $gte: now },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          highQuantity: {
            $sum: {
              $cond: [{ $eq: ["$visibilityRules.isHighQuantity", true] }, 1, 0],
            },
          },
          lowQuantity: {
            $sum: {
              $cond: [
                { $eq: ["$visibilityRules.isHighQuantity", false] },
                1,
                0,
              ],
            },
          },
          recipientOnly: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$visibilityRules.isHighQuantity", true] },
                    { $eq: ["$visibilityRules.isVisibleToAll", false] },
                    { $gte: ["$visibilityRules.recipientOnlyUntil", now] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          visibleToAll: {
            $sum: {
              $cond: [
                {
                  $or: [
                    { $eq: ["$visibilityRules.isHighQuantity", false] },
                    { $eq: ["$visibilityRules.isVisibleToAll", true] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ]);

    return (
      summary[0] || {
        total: 0,
        highQuantity: 0,
        lowQuantity: 0,
        recipientOnly: 0,
        visibleToAll: 0,
      }
    );
  } catch (error) {
    console.error("Error getting visibility summary:", error);
    throw error;
  }
}

/**
 * Manually update a specific listing's visibility rules
 */
export async function updateListingVisibility(listingId) {
  try {
    await connectDB();

    const listing = await FoodListing.findById(listingId);
    if (!listing) {
      throw new Error("Listing not found");
    }

    if (!listing.visibilityRules.isHighQuantity) {
      return { message: "Listing is not a high quantity item" };
    }

    const now = new Date();

    if (listing.visibilityRules.recipientOnlyUntil <= now) {
      listing.visibilityRules.isVisibleToAll = true;
      await listing.save();

      return {
        message: "Visibility updated successfully",
        isVisibleToAll: true,
      };
    } else {
      const timeLeft = Math.ceil(
        (listing.visibilityRules.recipientOnlyUntil - now) / (1000 * 60)
      );
      return {
        message: `Still in recipient-only period for ${timeLeft} more minutes`,
        isVisibleToAll: false,
        timeLeft,
      };
    }
  } catch (error) {
    console.error("Error updating listing visibility:", error);
    throw error;
  }
}

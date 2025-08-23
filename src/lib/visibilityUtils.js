/**
 * Utility functions for managing food listing visibility based on user roles and time-based rules
 */

/**
 * Determines if a food listing should be visible to a specific user
 * @param {Object} listing - The food listing object
 * @param {string} userRole - User's role (PROVIDER, RECIPIENT)
 * @param {string} userSubrole - User's subrole (NGO, STUDENT, STAFF, etc.)
 * @returns {boolean} - Whether the listing is visible to the user
 */
export function isListingVisibleToUser(listing, userRole, userSubrole) {
  // Basic validation
  if (!listing || !userRole) {
    return false;
  }

  // If listing is not active or expired, not visible to anyone
  if (!listing.isActive || (listing.expiryTime && new Date(listing.expiryTime) <= new Date())) {
    return false;
  }

  // If listing has no quantity left, not visible
  if (listing.quantity <= 0) {
    return false;
  }

  // Check NGO exclusive visibility rules
  if (listing.isNGOExclusive && listing.ngoExclusiveUntil) {
    const now = new Date();
    const exclusiveUntil = new Date(listing.ngoExclusiveUntil);
    
    // If we're still in the NGO exclusive period
    if (now < exclusiveUntil) {
      // Only visible to NGOs during exclusive period
      return userRole === 'RECIPIENT' && userSubrole === 'NGO';
    }
  }

  // After NGO exclusive period or for non-exclusive listings, visible to all recipients
  return userRole === 'RECIPIENT';
}

/**
 * Filters an array of food listings based on user visibility rules
 * @param {Array} listings - Array of food listing objects
 * @param {string} userRole - User's role (PROVIDER, RECIPIENT)
 * @param {string} userSubrole - User's subrole (NGO, STUDENT, STAFF, etc.)
 * @returns {Array} - Filtered array of visible listings
 */
export function filterVisibleListings(listings, userRole, userSubrole) {
  if (!Array.isArray(listings)) {
    return [];
  }

  return listings.filter(listing => 
    isListingVisibleToUser(listing, userRole, userSubrole)
  );
}

/**
 * Creates a MongoDB query filter for visible listings based on user role
 * @param {string} userRole - User's role (PROVIDER, RECIPIENT)
 * @param {string} userSubrole - User's subrole (NGO, STUDENT, STAFF, etc.)
 * @returns {Object} - MongoDB query object
 */
export function createVisibilityQuery(userRole, userSubrole) {
  const baseQuery = {
    isActive: true,
    expiryTime: { $gte: new Date() },
    quantity: { $gt: 0 }
  };

  // Only recipients can see listings
  if (userRole !== 'RECIPIENT') {
    // Return a query that matches nothing for non-recipients
    return { _id: { $exists: false } };
  }

  const now = new Date();

  // If user is NGO, they can see all listings (including NGO-exclusive ones)
  if (userSubrole === 'NGO') {
    return baseQuery;
  }

  // For non-NGO recipients, exclude listings that are currently NGO-exclusive
  return {
    ...baseQuery,
    $or: [
      // Non-NGO exclusive listings
      { isNGOExclusive: { $ne: true } },
      // NGO exclusive listings that have expired their exclusive period
      {
        isNGOExclusive: true,
        ngoExclusiveUntil: { $lte: now }
      }
    ]
  };
}

/**
 * Calculates the remaining time for NGO exclusive access
 * @param {Object} listing - The food listing object
 * @returns {number|null} - Remaining milliseconds for NGO exclusive access, or null if not applicable
 */
export function getNGOExclusiveTimeRemaining(listing) {
  if (!listing.isNGOExclusive || !listing.ngoExclusiveUntil) {
    return null;
  }

  const now = new Date();
  const exclusiveUntil = new Date(listing.ngoExclusiveUntil);
  const remaining = exclusiveUntil.getTime() - now.getTime();

  return remaining > 0 ? remaining : 0;
}

/**
 * Formats the remaining NGO exclusive time for display
 * @param {Object} listing - The food listing object
 * @returns {string|null} - Formatted time string or null if not applicable
 */
export function formatNGOExclusiveTimeRemaining(listing) {
  const remaining = getNGOExclusiveTimeRemaining(listing);
  
  if (remaining === null || remaining <= 0) {
    return null;
  }

  const minutes = Math.floor(remaining / (1000 * 60));
  const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  } else {
    return `${seconds}s`;
  }
}

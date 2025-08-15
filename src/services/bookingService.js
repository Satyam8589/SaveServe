const API_BASE_URL = '/api';

const bookingService = {
  bookListing: async (listingId, bookingData) => {
    const response = await fetch(`${API_BASE_URL}/listings/${listingId}/book`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bookingData),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  },

  getListingBookings: async (listingId, providerId) => {
    const response = await fetch(`${API_BASE_URL}/listings/${listingId}/bookings?providerId=${providerId}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  },
};

export default bookingService;
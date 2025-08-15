const API_BASE_URL = '/api';

const bookingService = {
  // Book a food listing
  bookListing: async (listingId, bookingData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/listings/${listingId}/book`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      return response.json();
    } catch (error) {
      console.error('Booking error:', error);
      throw error;
    }
  },

  // Get user's bookings/claims
  getUserBookings: async (userId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/bookings/user/${userId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return response.json();
    } catch (error) {
      console.error('Get user bookings error:', error);
      throw error;
    }
  },

  // Get bookings for a specific listing (for providers)
  getListingBookings: async (listingId, providerId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/listings/${listingId}/bookings?providerId=${providerId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return response.json();
    } catch (error) {
      console.error('Get listing bookings error:', error);
      throw error;
    }
  },

  // Update booking status (approve/reject)
  updateBookingStatus: async (bookingId, status, response = '') => {
    try {
      const res = await fetch(`${API_BASE_URL}/bookings/${bookingId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          status, 
          providerResponse: response 
        }),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || `HTTP error! status: ${res.status}`);
      }
      
      return res.json();
    } catch (error) {
      console.error('Update booking status error:', error);
      throw error;
    }
  },

  // Verify collection (QR code or manual code)
  verifyCollection: async (qrData, collectionCode, providerId, listingId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/bookings/verify-collection`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          qrData,
          collectionCode,
          providerId,
          listingId
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error('Verify collection error:', error);
      throw error;
    }
  },

  // Rate a completed booking
  rateBooking: async (bookingId, rating, feedback = '') => {
    try {
      const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}/rate`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rating, feedback }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error('Rate booking error:', error);
      throw error;
    }
  },

  // Cancel a booking
  cancelBooking: async (bookingId, reason = '') => {
    try {
      const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}/cancel`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error('Cancel booking error:', error);
      throw error;
    }
  }
};

export default bookingService;

// File: /services/listingService.js
const API_BASE_URL = '/api';

class ListingService {
  async getListings(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.location) queryParams.append('location', params.location);
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.page) queryParams.append('page', params.page.toString());

      const queryString = queryParams.toString();
      const url = `${API_BASE_URL}/listings${queryString ? `?${queryString}` : ''}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch listings');
      }

      return result;
    } catch (error) {
      console.error('Error fetching listings:', error);
      throw error;
    }
  }

  async createListing(listingData) {
    try {
      const response = await fetch(`${API_BASE_URL}/listings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(listingData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to create listing');
      }

      return result;
    } catch (error) {
      console.error('Error creating listing:', error);
      throw error;
    }
  }
}

const listingService = new ListingService();
export default listingService;

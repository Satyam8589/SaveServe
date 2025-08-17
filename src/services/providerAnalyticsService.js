// File: /services/providerAnalyticsService.js

const API_BASE_URL = '/api/analytics/provider';

/**
 * Service class for provider analytics API calls
 * Handles all communication with provider analytics endpoints
 */
class ProviderAnalyticsService {
  /**
   * Generic API call handler with error handling
   */
  async apiCall(endpoint, options = {}) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} - ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error calling ${endpoint}:`, error);
      throw error;
    }
  }

  /**
   * Fetch provider KPI metrics
   * Returns: totalFoodListed, totalFoodCollected, foodWasted, carbonSaved, waterSaved, wastePercentage
   */
  async getKPIs() {
    return this.apiCall('/kpis');
  }

  /**
   * Fetch weekly trend data for listed vs collected food
   * Returns: Array of { week, date, listed, collected }
   */
  async getTrend() {
    return this.apiCall('/trend');
  }

  /**
   * Fetch food category breakdown
   * Returns: Array of { category, quantity, listings, percentage }
   */
  async getCategoryBreakdown() {
    return this.apiCall('/by-category');
  }

  /**
   * Fetch listing efficiency data
   * Returns: Array of { title, category, listed, collected, wasted, efficiency, date }
   */
  async getEfficiencyData() {
    return this.apiCall('/efficiency');
  }

  /**
   * Fetch AI-generated recommendations for waste reduction
   * Returns: { summary, overallWasteRate, totalListings, recommendations }
   */
  async getRecommendations() {
    return this.apiCall('/recommendations');
  }

  /**
   * Batch fetch all analytics data
   * Useful for initial page load
   */
  async getAllAnalytics() {
    try {
      const [kpis, trend, categories, efficiency, recommendations] = await Promise.all([
        this.getKPIs(),
        this.getTrend(),
        this.getCategoryBreakdown(),
        this.getEfficiencyData(),
        this.getRecommendations(),
      ]);

      return {
        kpis,
        trend,
        categories,
        efficiency,
        recommendations,
      };
    } catch (error) {
      console.error('Error fetching all analytics data:', error);
      throw error;
    }
  }
}

// Export singleton instance
const providerAnalyticsService = new ProviderAnalyticsService();
export default providerAnalyticsService;
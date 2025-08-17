// File: /services/globalAnalyticsService.js

const BASE_URL = '/api/analytics/global';

class GlobalAnalyticsService {
  // Fetch KPI metrics (total food saved, meals served, CO2 saved, water saved)
  static async getKPIs() {
    const response = await fetch(`${BASE_URL}/kpis`);
    if (!response.ok) {
      throw new Error('Failed to fetch KPI data');
    }
    return response.json();
  }

  // Fetch food saved by category for pie chart
  static async getFoodByCategory() {
    const response = await fetch(`${BASE_URL}/food-by-category`);
    if (!response.ok) {
      throw new Error('Failed to fetch food by category data');
    }
    return response.json();
  }

  // Fetch food saved over time for line chart
  static async getFoodOverTime(timeframe = 'week') {
    const response = await fetch(`${BASE_URL}/food-over-time?timeframe=${timeframe}`);
    if (!response.ok) {
      throw new Error('Failed to fetch food over time data');
    }
    return response.json();
  }

  // Fetch top providers for bar chart
  static async getTopProviders(limit = 10) {
    const response = await fetch(`${BASE_URL}/top-providers?limit=${limit}`);
    if (!response.ok) {
      throw new Error('Failed to fetch top providers data');
    }
    return response.json();
  }

  // Fetch activity timeline data for heatmap
  static async getActivityTimeline() {
    const response = await fetch(`${BASE_URL}/activity-timeline`);
    if (!response.ok) {
      throw new Error('Failed to fetch activity timeline data');
    }
    return response.json();
  }

  // Fetch overall platform stats
  static async getPlatformStats() {
    const response = await fetch(`${BASE_URL}/platform-stats`);
    if (!response.ok) {
      throw new Error('Failed to fetch platform stats');
    }
    return response.json();
  }
}

export default GlobalAnalyticsService;
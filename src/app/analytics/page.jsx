// File: /app/(dashboard)/analytics/global/page.jsx
'use client';

import { useState } from 'react';
import { 
  Utensils, 
  Users, 
  Leaf, 
  Droplets, 
  TrendingUp, 
  Clock,
  RefreshCw,
  Calendar,
  Filter
} from 'lucide-react';

import KpiCard from './components/KpiCard';
import FoodByCategoryPie from './components/FoodByCategoryPie';
import FoodOverTimeLine from './components/FoodOverTimeLine';
import TopProvidersBar from './components/TopProvidersBar';
import ActivityHeatmap from './components/ActivityHeatmap';

import { useGlobalAnalyticsDashboard } from '@/hooks/useGlobalAnalytics';

export default function GlobalAnalyticsPage() {
  const [timeframe, setTimeframe] = useState('week');
  const [showCumulative, setShowCumulative] = useState(false);
  
  const {
    kpis,
    foodByCategory,
    foodOverTime,
    topProviders,
    activityTimeline,
    isLoading,
    error,
    refetchAll
  } = useGlobalAnalyticsDashboard(timeframe);

  const handleRefresh = () => {
    refetchAll();
  };

  const handleTimeframeChange = (newTimeframe) => {
    setTimeframe(newTimeframe);
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <h2 className="text-xl font-semibold text-red-800 mb-2">Error Loading Analytics</h2>
            <p className="text-red-600 mb-4">
              {error?.message || 'Failed to load analytics data'}
            </p>
            <button
              onClick={handleRefresh}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Global Analytics</h1>
              <p className="text-gray-600 mt-1">Platform-wide food redistribution impact</p>
            </div>
            
            <div className="mt-4 md:mt-0 flex items-center space-x-4">
              {/* Timeframe selector */}
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <select
                  value={timeframe}
                  onChange={(e) => handleTimeframeChange(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isLoading}
                >
                  <option value="week">Weekly</option>
                  <option value="month">Monthly</option>
                </select>
              </div>

              {/* Toggle cumulative view */}
              <label className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  checked={showCumulative}
                  onChange={(e) => setShowCumulative(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  disabled={isLoading}
                />
                <span>Cumulative</span>
              </label>

              {/* Refresh button */}
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {isLoading && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
              <span className="text-blue-800">Loading analytics data...</span>
            </div>
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <KpiCard
            title="Food Saved"
            value={kpis.data?.data?.totalFoodSaved?.value || 0}
            unit={kpis.data?.data?.totalFoodSaved?.unit || 'kg'}
            description={kpis.data?.data?.totalFoodSaved?.description}
            icon={Utensils}
            color="blue"
          />
          
          <KpiCard
            title="Meals Served"
            value={kpis.data?.data?.totalMealsServed?.value || 0}
            unit={kpis.data?.data?.totalMealsServed?.unit || 'meals'}
            description={kpis.data?.data?.totalMealsServed?.description}
            icon={Users}
            color="green"
          />
          
          <KpiCard
            title="CO₂ Saved"
            value={kpis.data?.data?.co2Saved?.value || 0}
            unit={kpis.data?.data?.co2Saved?.unit || 'kg CO₂'}
            description={kpis.data?.data?.co2Saved?.description}
            icon={Leaf}
            color="teal"
          />
          
          <KpiCard
            title="Water Saved"
            value={kpis.data?.data?.waterSaved?.value || 0}
            unit={kpis.data?.data?.waterSaved?.unit || 'liters'}
            description={kpis.data?.data?.waterSaved?.description}
            icon={Droplets}
            color="blue"
          />
        </div>

        {/* Secondary KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <KpiCard
            title="Total Listings"
            value={kpis.data?.data?.totalListings?.value || 0}
            unit={kpis.data?.data?.totalListings?.unit || 'listings'}
            description={kpis.data?.data?.totalListings?.description}
            icon={TrendingUp}
            color="orange"
          />
          
          <KpiCard
            title="Active Users"
            value={kpis.data?.data?.activeUsers?.value || 0}
            unit={kpis.data?.data?.activeUsers?.unit || 'users'}
            description={kpis.data?.data?.activeUsers?.description}
            icon={Users}
            color="purple"
          />
          
          <KpiCard
            title="Food Providers"
            value={kpis.data?.data?.providers?.value || 0}
            unit={kpis.data?.data?.providers?.unit || 'providers'}
            description={kpis.data?.data?.providers?.description}
            icon={Utensils}
            color="red"
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Food Over Time Chart */}
          <div className="lg:col-span-2">
            <FoodOverTimeLine
              data={foodOverTime.data?.data?.periods}
              title={`Food Saved Over Time (${timeframe}ly)`}
              timeframe={timeframe}
              showCumulative={showCumulative}
            />
          </div>

          {/* Food by Category Pie Chart */}
          <FoodByCategoryPie
            data={foodByCategory.data?.data?.categories}
            title="Food Distribution by Category"
          />

          {/* Top Providers Bar Chart */}
          <TopProvidersBar
            data={topProviders.data?.data?.providers}
            title="Top Food Providers"
          />
        </div>

        {/* Activity Heatmap */}
        <div className="mb-8">
          <ActivityHeatmap
            data={activityTimeline.data?.data?.heatmap}
            title="Platform Activity Patterns"
          />
        </div>

        {/* Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Food Over Time Trends */}
          {foodOverTime.data?.data?.trends && (
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="font-semibold mb-4">Trends</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Avg per {timeframe}:</span>
                  <span className="font-medium">
                    {foodOverTime.data.data.trends.averageWeightPerPeriod} kg
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Recent avg:</span>
                  <span className="font-medium">
                    {foodOverTime.data.data.trends.recentAverageWeight} kg
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Direction:</span>
                  <span className={`font-medium capitalize ${
                    foodOverTime.data.data.trends.trend === 'up' ? 'text-green-600' : 
                    foodOverTime.data.data.trends.trend === 'down' ? 'text-red-600' : 
                    'text-gray-600'
                  }`}>
                    {foodOverTime.data.data.trends.trend}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Category Summary */}
          {foodByCategory.data?.data?.totals && (
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="font-semibold mb-4">Category Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total weight:</span>
                  <span className="font-medium">
                    {foodByCategory.data.data.totals.totalWeight} kg
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total quantity:</span>
                  <span className="font-medium">
                    {foodByCategory.data.data.totals.totalQuantity}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Listings:</span>
                  <span className="font-medium">
                    {foodByCategory.data.data.totals.totalListings}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Provider Statistics */}
          {topProviders.data?.data?.stats && (
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="font-semibold mb-4">Provider Stats</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Active providers:</span>
                  <span className="font-medium">
                    {topProviders.data.data.stats.totalProviders}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Avg bookings:</span>
                  <span className="font-medium">
                    {topProviders.data.data.stats.avgBookingsPerProvider}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total bookings:</span>
                  <span className="font-medium">
                    {topProviders.data.data.stats.totalBookings}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Activity Summary */}
          {activityTimeline.data?.data?.metrics && (
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="font-semibold mb-4">Activity Metrics</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Collection rate:</span>
                  <span className="font-medium">
                    {activityTimeline.data.data.metrics.collectionRate}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total bookings:</span>
                  <span className="font-medium">
                    {activityTimeline.data.data.metrics.totalBookings}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Collections:</span>
                  <span className="font-medium">
                    {activityTimeline.data.data.metrics.totalCollections}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Peak Activity Times */}
        {activityTimeline.data?.data?.peakTimes && (
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold mb-4">Peak Activity Times</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {activityTimeline.data.data.peakTimes.map((peak, index) => (
                <div key={index} className="bg-blue-50 p-3 rounded-lg">
                  <div className="font-medium text-blue-900">
                    {peak.day} {peak.hourLabel}
                  </div>
                  <div className="text-sm text-blue-700">
                    {peak.totalActivity} activities
                  </div>
                  <div className="text-xs text-blue-600 mt-1">
                    B:{peak.breakdown.bookings} L:{peak.breakdown.listings} C:{peak.breakdown.collections}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 mt-8">
          <p>
            Data refreshed: {new Date().toLocaleString()} | 
            Showing data for the last {timeframe === 'week' ? '12 weeks' : '12 months'}
          </p>
        </div>
      </div>
    </div>
  );
}
// File: /hooks/useGlobalAnalytics.js
'use client';

import { useQuery } from '@tanstack/react-query';
import GlobalAnalyticsService from '@/services/globalAnalyticsService';

// Hook for KPI data
export const useGlobalKPIs = () => {
  return useQuery({
    queryKey: ['global-analytics', 'kpis'],
    queryFn: GlobalAnalyticsService.getKPIs,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
    retry: 2,
    refetchOnWindowFocus: false,
  });
};

// Hook for food by category data
export const useFoodByCategory = () => {
  return useQuery({
    queryKey: ['global-analytics', 'food-by-category'],
    queryFn: GlobalAnalyticsService.getFoodByCategory,
    staleTime: 10 * 60 * 1000, // 10 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
    retry: 2,
    refetchOnWindowFocus: false,
  });
};

// Hook for food over time data
export const useFoodOverTime = (timeframe = 'week') => {
  return useQuery({
    queryKey: ['global-analytics', 'food-over-time', timeframe],
    queryFn: () => GlobalAnalyticsService.getFoodOverTime(timeframe),
    staleTime: 15 * 60 * 1000, // 15 minutes
    cacheTime: 45 * 60 * 1000, // 45 minutes
    retry: 2,
    refetchOnWindowFocus: false,
  });
};

// Hook for top providers data
export const useTopProviders = (limit = 10) => {
  return useQuery({
    queryKey: ['global-analytics', 'top-providers', limit],
    queryFn: () => GlobalAnalyticsService.getTopProviders(limit),
    staleTime: 15 * 60 * 1000, // 15 minutes
    cacheTime: 45 * 60 * 1000, // 45 minutes
    retry: 2,
    refetchOnWindowFocus: false,
  });
};

// Hook for activity timeline data
export const useActivityTimeline = () => {
  return useQuery({
    queryKey: ['global-analytics', 'activity-timeline'],
    queryFn: GlobalAnalyticsService.getActivityTimeline,
    staleTime: 20 * 60 * 1000, // 20 minutes
    cacheTime: 60 * 60 * 1000, // 1 hour
    retry: 2,
    refetchOnWindowFocus: false,
  });
};

// Hook for platform stats
export const usePlatformStats = () => {
  return useQuery({
    queryKey: ['global-analytics', 'platform-stats'],
    queryFn: GlobalAnalyticsService.getPlatformStats,
    staleTime: 30 * 60 * 1000, // 30 minutes
    cacheTime: 60 * 60 * 1000, // 1 hour
    retry: 2,
    refetchOnWindowFocus: false,
  });
};

// Combined hook for dashboard that fetches all data
export const useGlobalAnalyticsDashboard = (timeframe = 'week') => {
  const kpis = useGlobalKPIs();
  const foodByCategory = useFoodByCategory();
  const foodOverTime = useFoodOverTime(timeframe);
  const topProviders = useTopProviders(10);
  const activityTimeline = useActivityTimeline();

  return {
    kpis,
    foodByCategory,
    foodOverTime,
    topProviders,
    activityTimeline,
    // Combined loading state
    isLoading: kpis.isLoading || foodByCategory.isLoading || foodOverTime.isLoading || topProviders.isLoading || activityTimeline.isLoading,
    // Combined error state
    error: kpis.error || foodByCategory.error || foodOverTime.error || topProviders.error || activityTimeline.error,
    // Refetch all data
    refetchAll: () => {
      kpis.refetch();
      foodByCategory.refetch();
      foodOverTime.refetch();
      topProviders.refetch();
      activityTimeline.refetch();
    }
  };
};
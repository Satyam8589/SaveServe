// hooks/useNotifications.js
// MongoDB-based notification hook (updated from Firestore)
'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useUser } from '@clerk/nextjs';

const NOTIFICATIONS_QUERY_KEY = 'mongo-notifications';

/**
 * Custom hook for managing user notifications with MongoDB
 */
export function useNotifications(options = {}) {
  const {
    limit = 50,
    enableRealtime = false, // Disabled real-time for MongoDB
    filterUnread = false,
    refetchInterval = 30000, // Refetch every 30 seconds instead of real-time
  } = options;

  // Get user ID from Clerk
  const { user: clerkUser, isLoaded: isClerkLoaded } = useUser();
  const userId = clerkUser?.id;

  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(true);

  // Query key for this user's notifications
  const queryKey = [NOTIFICATIONS_QUERY_KEY, userId, { limit, filterUnread }];

  // Check if we're ready to make API queries
  const isReady = isClerkLoaded && !!userId;

  // Fetch notifications from MongoDB via API
  const fetchNotifications = async () => {
    if (!userId) {
      throw new Error('User ID is required');
    }

    console.log('🔍 Fetching notifications from MongoDB for user:', userId);

    const params = new URLSearchParams({
      limit: limit.toString(),
      filterUnread: filterUnread.toString(),
    });

    const response = await fetch(`/api/notifications?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch notifications: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch notifications');
    }

    console.log(`✅ Successfully fetched ${data.notifications.length} notifications`);
    
    return data;
  };

  // React Query for notifications
  const {
    data: notificationsData,
    isLoading: isQueryLoading,
    error,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: fetchNotifications,
    enabled: isReady,
    refetchInterval: enableRealtime ? refetchInterval : false,
    staleTime: 30000, // Consider data fresh for 30 seconds
    gcTime: 300000, // Keep in cache for 5 minutes
  });

  // Extract data from query result
  const notifications = notificationsData?.notifications || [];
  const unreadCount = notificationsData?.unreadCount || 0;
  const hasUnread = unreadCount > 0;

  // Mark notification as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId) => {
      const response = await fetch(`/api/notifications/${notificationId}/mark-read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to mark notification as read');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch notifications
      queryClient.invalidateQueries({ queryKey: [NOTIFICATIONS_QUERY_KEY, userId] });
    },
  });

  // Mark all notifications as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to mark all notifications as read');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch notifications
      queryClient.invalidateQueries({ queryKey: [NOTIFICATIONS_QUERY_KEY, userId] });
    },
  });

  // Action functions
  const markAsRead = (notificationId) => {
    markAsReadMutation.mutate(notificationId);
  };

  const markAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  // Combine loading states
  const isLoading = !isClerkLoaded || isQueryLoading;

  return {
    // Data
    notifications,
    unreadCount,
    hasUnread,
    
    // Loading states
    isLoading,
    isConnected,
    isReady,
    
    // User info
    userId,
    
    // Error handling
    error,
    
    // Actions
    markAsRead,
    markAllAsRead,
    refetch,
    
    // Mutation states
    isMarkingAsRead: markAsReadMutation.isPending,
    isMarkingAllAsRead: markAllAsReadMutation.isPending,
    
    // Mutation errors
    markAsReadError: markAsReadMutation.error,
    markAllAsReadError: markAllAsReadMutation.error,
  };
}

/**
 * Hook for unread notifications count only (lighter weight)
 */
export function useUnreadNotificationsCount() {
  const { user: clerkUser, isLoaded: isClerkLoaded } = useUser();
  const userId = clerkUser?.id;
  const queryKey = [NOTIFICATIONS_QUERY_KEY, userId, 'unread-count'];
  
  const isReady = isClerkLoaded && !!userId;

  const fetchUnreadCount = async () => {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const response = await fetch(`/api/notifications?filterUnread=true&limit=1`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch unread count: ${response.statusText}`);
    }

    const data = await response.json();
    return data.unreadCount || 0;
  };

  const {
    data: unreadCount = 0,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: fetchUnreadCount,
    enabled: isReady,
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 15000, // Consider data fresh for 15 seconds
  });

  return {
    unreadCount,
    isLoading,
    error,
    refetch,
    isReady,
  };
}

// Export the main hook as default for backward compatibility
export default useMongoNotifications;

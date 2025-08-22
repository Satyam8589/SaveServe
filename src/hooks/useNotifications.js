// hooks/useNotifications.js
// MongoDB-based notification hook with SSE integration
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useUser } from '@clerk/nextjs';
import { useAuth } from '@clerk/nextjs';

const NOTIFICATIONS_QUERY_KEY = 'mongo-notifications';

/**
 * Custom hook for managing user notifications with MongoDB
 */
export function useNotifications(options = {}) {
  const {
    limit = 50,
    enableRealtime = false, // Now enables SSE real-time notifications
    filterUnread = false,
    refetchInterval = 30000, // Fallback polling interval
  } = options;

  // Get user ID from Clerk
  const { user: clerkUser, isLoaded: isClerkLoaded } = useUser();
  const { getToken } = useAuth();
  const userId = clerkUser?.id;

  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(true);

  // SSE connection state
  const [isSSEConnected, setIsSSEConnected] = useState(false);
  const [sseError, setSSEError] = useState(null);
  const eventSourceRef = useRef(null);

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

  // SSE Connection Logic
  const connectSSE = useCallback(async () => {
    if (!enableRealtime || !getToken || eventSourceRef.current || !isReady) return;

    try {
      console.log('🔗 Connecting to SSE for real-time notifications...');

      // Get auth token using Clerk useAuth
      const token = await getToken();
      if (!token) throw new Error('Failed to get Clerk token');

      // Create EventSource with auth header (via URL param for browser compatibility)
      const eventSource = new EventSource(
        `/api/notification/stream?token=${encodeURIComponent(token)}`
      );

      eventSource.onopen = () => {
        console.log('✅ SSE Connected for real-time notifications');
        setIsSSEConnected(true);
        setSSEError(null);
      };

      eventSource.onmessage = (event) => {
        console.log('📩 Real-time notification received:', event.data);
        try {
          const notification = JSON.parse(event.data);

          // Invalidate and refetch notifications to get the latest data
          queryClient.invalidateQueries({ queryKey: [NOTIFICATIONS_QUERY_KEY, userId] });

          // Show browser notification if supported and page is hidden
          if (document.hidden && 'Notification' in window && Notification.permission === 'granted') {
            new Notification(notification.title, {
              body: notification.message,
              icon: '/favicon.ico'
            });
          }
        } catch (error) {
          console.error('Error parsing SSE notification:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('❌ SSE Error:', error);
        setIsSSEConnected(false);
        setSSEError('Connection lost');

        // Auto-reconnect after delay
        setTimeout(() => {
          if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
            connectSSE();
          }
        }, 5000);
      };

      eventSourceRef.current = eventSource;

    } catch (error) {
      console.error('❌ Failed to connect SSE:', error);
      setSSEError(error.message);
    }
  }, [enableRealtime, getToken, isReady, userId, queryClient]);

  // Disconnect SSE
  const disconnectSSE = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      setIsSSEConnected(false);
    }
  }, []);

  // Connect/disconnect SSE when conditions change
  useEffect(() => {
    if (enableRealtime && isReady) {
      connectSSE();
    } else {
      disconnectSSE();
    }

    return disconnectSSE;
  }, [enableRealtime, isReady, connectSSE, disconnectSSE]);

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

    // SSE connection states
    isSSEConnected,
    sseError,

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

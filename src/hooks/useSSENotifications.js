import { useAuth } from '@clerk/nextjs';
// hooks/useSSENotifications.js
import { useState, useEffect, useCallback, useRef } from 'react';
import { useUser } from '@clerk/nextjs';

const useSSENotifications = () => {
  // Helper to create a test notification
  const createTestNotification = async () => {
    if (!user?.id) return;
    try {
      const token = getToken ? await getToken() : null;
      await fetch('/api/notification/store', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          userId: user.id,
          title: 'Test Notification',
          message: 'This is a test notification.',
          type: 'reminder'
        })
      });
    } catch (err) {
      console.error('Failed to create test notification:', err);
    }
  };
  // Fetch notifications from API on mount
  const { getToken } = useAuth();
  const { user } = useUser();
  const userId = user?.id;
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = getToken ? await getToken() : null;
        if (!userId) return; // Wait for user to be loaded
        const res = await fetch(`/api/notification/store?userId=${userId}`, {
          method: 'GET',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const result = await res.json();
          if (Array.isArray(result.notifications)) {
            setNotifications(result.notifications);
          }
        }
      } catch (err) {
        console.error('Failed to fetch notifications:', err);
      }
    };
    fetchNotifications();
  }, [getToken, userId]);
  const [notifications, setNotifications] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const eventSourceRef = useRef(null);

  // Calculate unread count
  useEffect(() => {
    const unread = notifications.filter(n => !n.read).length;
    setUnreadCount(unread);
  }, [notifications]);

  // Connect to SSE stream
  const connect = useCallback(async () => {
    if (!userId || eventSourceRef.current) return;

    try {
      console.log('🔗 Connecting to SSE stream for user:', userId);
      console.log('🔍 Current SSE connections map size:', global.sseConnections?.size || 0);

      // Create EventSource - Clerk auth will work via cookies
      const eventSource = new EventSource('/api/notification/stream');
      console.log('📡 EventSource created, waiting for connection...');

      eventSource.onopen = () => {
        console.log('✅ SSE Connected for user:', userId);
        console.log('📊 Connection state updated');
        setIsConnected(true);
        setConnectionError(null);
      };

      eventSource.onmessage = (event) => {
        console.log('🔥 SSE MESSAGE RECEIVED - Raw event data:', event.data);
        try {
          const notification = JSON.parse(event.data);
          console.log('📩 Parsed notification:', notification);
          console.log('🔍 Notification structure check:', {
            hasTitle: !!notification.title,
            titleValue: notification.title,
            hasMessage: !!notification.message,
            messageValue: notification.message,
            hasType: !!notification.type,
            typeValue: notification.type,
            hasData: !!notification.data,
            dataValue: notification.data
          });
          console.log('🔍 User check:', {
            hasUser: !!user,
            userIdFromHook: userId,
            userObject: user
          });

          // SSE notification is already stored in DB by the backend
          // Just add it to the local state for real-time display
          console.log('📩 SSE notification received (already stored in DB):', {
            id: notification.id,
            title: notification.title,
            message: notification.message,
            type: notification.type,
            userId: notification.userId
          });
          setNotifications(prev => {
            // Avoid duplicates
            const exists = prev.some(n => n.id === notification.id);
            if (exists) {
              console.log('🔄 Duplicate notification ignored:', notification.id);
              return prev;
            }
            console.log('✅ Adding new notification to state:', notification.id);
            console.log('📊 Previous notifications count:', prev.length);
            const newNotifications = [notification, ...prev];
            console.log('📊 New notifications count:', newNotifications.length);
            return newNotifications;
          });

          // Show browser notification if supported
          if (document.hidden && 'Notification' in window && Notification.permission === 'granted') {
            new Notification(notification.title, {
              body: notification.message,
              icon: '/favicon.ico'
            });
          }
        } catch (error) {
          console.error('Error parsing notification:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('❌ SSE Error:', error);
        setIsConnected(false);
        setConnectionError('Connection lost');
        
        // Auto-reconnect after delay
        setTimeout(() => {
          if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
            connect();
          }
        }, 5000);
      };

      eventSourceRef.current = eventSource;

    } catch (error) {
      console.error('❌ Failed to connect SSE:', error);
      setConnectionError(error.message);
    }
  }, [userId]);

  // Disconnect
  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      setIsConnected(false);
    }
  }, []);

  // Connect when user is available
  useEffect(() => {
    if (userId) {
      connect();
    }
    return disconnect;
  }, [connect, disconnect, userId]);

  // Notification actions
  const markAsRead = useCallback(async (notificationId) => {
    try {
      // Update UI immediately (optimistic update)
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );

      // Call API to update database
      const token = getToken ? await getToken() : null;
      const response = await fetch('/api/notification/mark-read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ notificationId })
      });

      if (!response.ok) {
        // Revert optimistic update on error
        setNotifications(prev =>
          prev.map(n => n.id === notificationId ? { ...n, read: false } : n)
        );
        console.error('Failed to mark notification as read:', response.statusText);
      } else {
        console.log('✅ Notification marked as read in database');
      }
    } catch (error) {
      // Revert optimistic update on error
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: false } : n)
      );
      console.error('Error marking notification as read:', error);
    }
  }, [getToken]);

  const markAllAsRead = useCallback(async () => {
    try {
      // Store previous state for potential rollback
      const previousNotifications = notifications;

      // Update UI immediately (optimistic update)
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));

      // Call API to update database
      const token = getToken ? await getToken() : null;
      const response = await fetch('/api/notification/mark-all-read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });

      if (!response.ok) {
        // Revert optimistic update on error
        setNotifications(previousNotifications);
        console.error('Failed to mark all notifications as read:', response.statusText);
      } else {
        const result = await response.json();
        console.log(`✅ ${result.count} notifications marked as read in database`);
      }
    } catch (error) {
      // Revert optimistic update on error
      setNotifications(notifications);
      console.error('Error marking all notifications as read:', error);
    }
  }, [getToken, notifications]);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return Notification.permission === 'granted';
  }, []);

  return {
  notifications,
  unreadCount,
  isConnected,
  connectionError,
  markAsRead,
  markAllAsRead,
  clearAllNotifications,
  reconnect: connect,
  requestNotificationPermission,
  createTestNotification
  };
};

export default useSSENotifications;
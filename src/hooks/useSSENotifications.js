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
    if (!getToken || eventSourceRef.current) return;

    try {
      // Get auth token using Clerk useAuth
      const token = await getToken();
      if (!token) throw new Error('Failed to get Clerk token');

      // Create EventSource with auth header (via URL param for browser compatibility)
      const eventSource = new EventSource(
        `/api/notification/stream?token=${encodeURIComponent(token)}`
      );

      eventSource.onopen = () => {
        console.log('✅ SSE Connected');
        setIsConnected(true);
        setConnectionError(null);
      };

      eventSource.onmessage = (event) => {
        try {
          const notification = JSON.parse(event.data);
          console.log('📩 New notification:', notification);
          // No need to skip any initial message since server no longer sends one
          // Store notification in DB via POST API
          if (user?.id && notification.title && notification.message && notification.type) {
            (async () => {
              try {
                const token = getToken ? await getToken() : null;
                const res = await fetch('/api/notification/store', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                  },
                  body: JSON.stringify({
                    userId: user.id,
                    title: notification.title,
                    message: notification.message,
                    type: notification.type,
                    data: notification.data || {}
                  })
                });
                if (!res.ok) {
                  const errorText = await res.text().catch(() => '');
                  console.error('❌ Failed to store notification:', res.status, errorText);
                } else {
                  console.log('✅ Notification stored in DB');
                }
              } catch (e) {
                console.error('❌ Error while storing notification:', e);
              }
            })();
          }
          setNotifications(prev => {
            // Avoid duplicates
            const exists = prev.some(n => n.id === notification.id);
            if (exists) return prev;
            return [notification, ...prev];
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
  }, [getToken]);

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
    connect();
    return disconnect;
  }, [connect, disconnect]);

  // Notification actions
  const markAsRead = useCallback((notificationId) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

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
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

          // Store notification in DB via POST API and update the notification with DB ID
          console.log('🔍 Checking conditions for DB storage:', {
            hasUserId: !!userId,
            userIdValue: userId,
            hasTitle: !!notification.title,
            hasMessage: !!notification.message,
            hasType: !!notification.type,
            conditionResult: !!(userId && notification.title && notification.message && notification.type)
          });

          if (userId && notification.title && notification.message && notification.type) {
            console.log('✅ ALL CONDITIONS MET - Starting database storage...');

            (async () => {
              console.log('🚀 ASYNC FUNCTION STARTED - Inside database storage function');
              try {
                console.log('🔑 Getting authentication token...');
                const token = getToken ? await getToken() : null;
                console.log('🔑 Token obtained:', !!token);

                const requestBody = {
                  userId: userId,
                  title: notification.title,
                  message: notification.message,
                  type: notification.type,
                  data: notification.data || {}
                };
                console.log('📤 Request body prepared:', requestBody);

                console.log('🌐 Making fetch request to /api/notification/store...');
                const res = await fetch('/api/notification/store', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                  },
                  body: JSON.stringify(requestBody)
                });
                console.log('📥 Fetch response received:', res.status, res.ok);

                if (!res.ok) {
                  const errorText = await res.text().catch(() => '');
                  console.error('❌ Failed to store notification:', res.status, errorText);
                } else {
                  const result = await res.json();

                  if (result.success && result.notification) {
                    // Update the notification in state with the database ID
                    setNotifications(prev =>
                      prev.map(n =>
                        n.id === notification.id
                          ? { ...n, id: result.notification.id }
                          : n
                      )
                    );
                    console.log('✅ Notification stored in DB with ID:', result.notification.id);
                  } else {
                    console.error('❌ Store notification failed:', result);
                  }
                }
              } catch (e) {
                console.error('❌ Error while storing notification:', e);
              }
            })();
          } else {
            console.log('❌ Cannot store notification - missing required data:', {
              hasUserId: !!userId,
              hasTitle: !!notification.title,
              hasMessage: !!notification.message,
              hasType: !!notification.type,
              userIdValue: userId,
              titleValue: notification.title,
              messageValue: notification.message,
              typeValue: notification.type
            });
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
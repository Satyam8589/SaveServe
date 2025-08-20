import { useAuth } from '@clerk/nextjs';
// hooks/useSSENotifications.js
import { useState, useEffect, useCallback, useRef } from 'react';
import { useUser } from '@clerk/nextjs';

const useSSENotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const { getToken } = useAuth();
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
    requestNotificationPermission
  };
};

export default useSSENotifications;
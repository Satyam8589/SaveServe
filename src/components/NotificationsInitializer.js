// components/NotificationsInitializer.js
'use client';

import { useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { requestFCMToken, onMessageListener } from '@/lib/firebaseClient';
import { useSaveFCMToken } from '@/hooks/useSaveFCMToken';

const NotificationsInitializer = ({ userRole = 'recipient', userArea = '' }) => {
  const { user, isLoaded } = useUser();
  const saveFCMTokenMutation = useSaveFCMToken();

  useEffect(() => {
    // Only initialize if user is loaded and we have a user
    if (!isLoaded || !user) return;

    const initializeNotifications = async () => {
      try {
        console.log('Initializing FCM notifications...');
        
        // Request FCM token
        const token = await requestFCMToken();
        
        if (token) {
          // Save token to backend
          saveFCMTokenMutation.mutate({
            token,
            userId: user.id,
            role: userRole,
            area: userArea,
          });
        }
      } catch (error) {
        console.error('Error initializing notifications:', error);
      }
    };

    initializeNotifications();
  }, [isLoaded, user, userRole, userArea, saveFCMTokenMutation]);

  useEffect(() => {
    // Set up foreground message listener
    const unsubscribe = onMessageListener((payload) => {
      console.log('Received foreground message:', payload);
      
      // For now, show a simple alert
      // You can replace this with a toast notification or custom UI later
      const title = payload.notification?.title || 'New Notification';
      const body = payload.notification?.body || 'You have a new notification';
      
      alert(`${title}\n${body}`);
      
      // You could also dispatch a custom event or update app state here
      // window.dispatchEvent(new CustomEvent('fcm-notification', { detail: payload }));
    });

    // Cleanup listener on unmount
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  // This component doesn't render anything visible
  return null;
};

export default NotificationsInitializer;
// components/NotificationsInitializer.js
'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { requestFCMToken, onMessageListener } from '@/lib/firebaseClient';
import { useSaveFCMToken } from '@/hooks/useSaveFCMToken';

const NotificationsInitializer = ({ userRole = 'recipient', userArea = '' }) => {
  const { user, isLoaded } = useUser();
  const saveFCMTokenMutation = useSaveFCMToken(() => setFcmTokenSaved(true));
  const [locationArea, setLocationArea] = useState('');
  const [fcmTokenSaved, setFcmTokenSaved] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState('initializing');

  useEffect(() => {
    // Get user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = `Lat: ${position.coords.latitude}, Lon: ${position.coords.longitude}`;
          setLocationArea(location);
          console.log('Location obtained:', location);
        },
        (error) => {
          console.error('Geolocation error:', error);
          setLocationArea(userArea || 'Unknown Location');
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 } // 5 minute cache
      );
    } else {
      console.log('Geolocation is not supported by this browser.');
      setLocationArea(userArea || 'Geolocation Not Supported');
    }
  }, [userArea]);

  useEffect(() => {
    // Only initialize if user is loaded, we have a user, and token hasn't been saved yet
    if (!isLoaded || !user || fcmTokenSaved) return;

    const initializeNotifications = async () => {
      try {
        console.log('Initializing FCM notifications...');
        setNotificationStatus('requesting_permission');
        
        // Check if service worker is supported
        if (!('serviceWorker' in navigator)) {
          console.warn('Service Worker not supported');
          setNotificationStatus('not_supported');
          return;
        }

        // Register service worker first
        try {
          const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
          console.log('Service Worker registered successfully:', registration);
        } catch (swError) {
          console.error('Service Worker registration failed:', swError);
          setNotificationStatus('sw_registration_failed');
          return;
        }

        // Request FCM token
        const token = await requestFCMToken();
        
        if (token) {
          setNotificationStatus('token_received');
          console.log('FCM token received, saving to backend...');
          
          // Save token to backend
          saveFCMTokenMutation.mutate({
            token,
            userId: user.id,
            role: userRole,
            area: locationArea || userArea,
          });
          
          setNotificationStatus('completed');
        } else {
          setNotificationStatus('token_failed');
          console.warn('Failed to get FCM token');
        }
      } catch (error) {
        console.error('Error initializing notifications:', error);
        setNotificationStatus('error');
      }
    };

    // Only initialize notifications once locationArea is determined
    if (locationArea !== '' && !fcmTokenSaved) {
      initializeNotifications();
    }
  }, [isLoaded, user, userRole, userArea, saveFCMTokenMutation, locationArea, fcmTokenSaved]);

  useEffect(() => {
    // Set up foreground message listener
    const unsubscribe = onMessageListener((payload) => {
      console.log('Received foreground message:', payload);
      
      // Create a more user-friendly notification
      const title = payload.notification?.title || 'New Notification';
      const body = payload.notification?.body || 'You have a new notification';
      
      // You can replace this with a toast notification library like react-hot-toast
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, {
          body: body,
          icon: '/icons/food-icon-192x192.png',
          tag: 'foreground-notification'
        });
      } else {
        // Fallback to alert if notifications aren't available
        alert(`${title}\n${body}`);
      }
      
      // You could also dispatch a custom event or update app state here
      window.dispatchEvent(new CustomEvent('fcm-notification', { detail: payload }));
    });

    // Cleanup listener on unmount
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  // Optional: Log status for debugging
  useEffect(() => {
    console.log('Notification status:', notificationStatus);
  }, [notificationStatus]);

  // This component doesn't render anything visible
  return null;
};

export default NotificationsInitializer;
// components/NotificationsInitializer.js
'use client';

import { useEffect, useState, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import { requestFCMToken, onMessageListener } from '@/lib/firebaseClient';
import { useSaveFCMToken } from '@/hooks/useSaveFCMToken';

const NotificationsInitializer = ({ userRole: propUserRole = 'recipient', userArea: propUserArea = '' }) => {
  const { user, isLoaded } = useUser();
  const saveFCMTokenMutation = useSaveFCMToken(() => setFcmTokenSaved(true));
  const [locationArea, setLocationArea] = useState('');
  const [fcmTokenSaved, setFcmTokenSaved] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState('initializing');
  const [locationPermissionDenied, setLocationPermissionDenied] = useState(false);
  
  // Use ref to track if initialization has been attempted
  const initializationAttempted = useRef(false);

  // Get user role from Clerk metadata or fallback to prop, convert to uppercase
  const userRole = (user?.publicMetadata?.mainrole || propUserRole).toUpperCase();

  useEffect(() => {
    // Get user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = `Lat: ${position.coords.latitude}, Lon: ${position.coords.longitude}`;
          setLocationArea(location);
          setLocationPermissionDenied(false);
          console.log('Location obtained:', location);
        },
        (error) => {
          console.error('Geolocation error:', error);
          setLocationPermissionDenied(true);
          
          // If user denied permission, set area to empty string
          if (error.code === error.PERMISSION_DENIED) {
            console.log('Location permission denied by user');
            setLocationArea(''); // Keep area blank when permission denied
          } else {
            // For other errors (timeout, unavailable), also use empty string
            setLocationArea('');
          }
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 } // 5 minute cache
      );
    } else {
      console.log('Geolocation is not supported by this browser.');
      setLocationArea('');
    }
  }, []);

  useEffect(() => {
    // Only initialize if:
    // - User is loaded and exists
    // - Token hasn't been saved yet
    // - We haven't attempted initialization
    // - Location check is complete (either we have location or permission was denied)
    const locationCheckComplete = locationArea !== '' || locationPermissionDenied;
    
    if (!isLoaded || !user || fcmTokenSaved || initializationAttempted.current || !locationCheckComplete) {
      return;
    }

    const initializeNotifications = async () => {
      try {
        console.log('Initializing FCM notifications...');
        console.log('Location area:', locationArea || 'No location (permission denied)');
        
        setNotificationStatus('requesting_permission');
        
        // Mark that we've attempted initialization
        initializationAttempted.current = true;
        
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
          
          // Save token to backend with just token and area
          saveFCMTokenMutation.mutate({
            token,
            userId: user.id,
            area: locationArea, // Will be empty string if permission denied
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

    initializeNotifications();
  }, [isLoaded, user, locationArea, locationPermissionDenied, fcmTokenSaved]);

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
    console.log('Location permission denied:', locationPermissionDenied);
  }, [notificationStatus, locationPermissionDenied]);

  // This component doesn't render anything visible
  return null;
};

export default NotificationsInitializer;
// hooks/useFCMToken.js
// Hook for managing FCM tokens and push notification permissions
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { 
  requestNotificationPermission, 
  getCurrentToken, 
  isNotificationAvailable 
} from '@/lib/firebaseClient';

/**
 * Custom hook for managing FCM tokens and notification permissions
 */
export function useFCMToken() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const [fcmToken, setFcmToken] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [permission, setPermission] = useState('default');
  const [isSupported, setIsSupported] = useState(false);

  // Check if notifications are supported
  useEffect(() => {
    const checkSupport = async () => {
      const supported = await isNotificationAvailable();
      setIsSupported(supported);
      
      if (typeof window !== 'undefined' && 'Notification' in window) {
        setPermission(Notification.permission);
      }
    };

    checkSupport();
  }, []);

  // Save FCM token to server
  const saveFCMToken = useCallback(async (token) => {
    if (!user?.id || !token) {
      console.log('❌ Cannot save FCM token: missing user or token');
      return false;
    }

    try {
      console.log('💾 Saving FCM token to server...');
      
      const response = await fetch('/api/user/fcm-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          fcmToken: token,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to save FCM token: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ FCM token saved successfully:', result);
      return true;
    } catch (error) {
      console.error('❌ Error saving FCM token:', error);
      setError(error.message);
      return false;
    }
  }, [user?.id]);

  // Request permission and get token
  const requestPermission = useCallback(async () => {
    if (!isUserLoaded || !user) {
      console.log('❌ User not loaded, cannot request permission');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('🔔 Requesting notification permission...');
      
      const token = await requestNotificationPermission();
      
      if (token) {
        setFcmToken(token);
        setPermission('granted');
        
        // Save token to server
        const saved = await saveFCMToken(token);
        if (!saved) {
          console.warn('⚠️ Token generated but not saved to server');
        }
        
        console.log('✅ FCM token obtained and saved');
        return token;
      } else {
        setPermission(Notification.permission);
        console.warn('⚠️ Failed to get FCM token');
        return null;
      }
    } catch (error) {
      console.error('❌ Error requesting permission:', error);
      setError(error.message);
      setPermission('denied');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isUserLoaded, user, saveFCMToken]);

  // Get existing token
  const getExistingToken = useCallback(async () => {
    if (!isUserLoaded || !user) {
      return null;
    }

    try {
      console.log('🔍 Checking for existing FCM token...');
      
      const token = await getCurrentToken();
      
      if (token) {
        setFcmToken(token);
        console.log('✅ Existing FCM token found');
        
        // Ensure token is saved to server
        await saveFCMToken(token);
        return token;
      } else {
        console.log('ℹ️ No existing FCM token found');
        return null;
      }
    } catch (error) {
      console.error('❌ Error getting existing token:', error);
      setError(error.message);
      return null;
    }
  }, [isUserLoaded, user, saveFCMToken]);

  // Initialize FCM token on component mount
  useEffect(() => {
    if (!isUserLoaded || !user) {
      return;
    }

    const initializeFCM = async () => {
      // Check if notifications are available
      const available = await isNotificationAvailable();
      setIsSupported(available);

      if (available) {
        // Try to get existing token first
        const existingToken = await getExistingToken();
        
        if (!existingToken) {
          console.log('ℹ️ No existing token, user will need to grant permission');
        }
      } else {
        console.log('ℹ️ Notifications not available or permission not granted');
      }
    };

    initializeFCM();
  }, [isUserLoaded, user, getExistingToken]);

  // Refresh token
  const refreshToken = useCallback(async () => {
    console.log('🔄 Refreshing FCM token...');
    return await getExistingToken();
  }, [getExistingToken]);

  // Clear token
  const clearToken = useCallback(() => {
    setFcmToken(null);
    setError(null);
    console.log('🗑️ FCM token cleared');
  }, []);

  return {
    // Token state
    fcmToken,
    isLoading,
    error,
    permission,
    isSupported,
    
    // Token info
    hasToken: !!fcmToken,
    canRequestPermission: permission === 'default' && isSupported,
    isPermissionGranted: permission === 'granted',
    isPermissionDenied: permission === 'denied',
    
    // Actions
    requestPermission,
    refreshToken,
    clearToken,
    getExistingToken,
    
    // Utilities
    isReady: isUserLoaded && !!user,
  };
}

/**
 * Lightweight hook for just checking if FCM is available
 */
export function useFCMAvailability() {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState('default');

  useEffect(() => {
    const checkAvailability = async () => {
      const supported = await isNotificationAvailable();
      setIsSupported(supported);
      
      if (typeof window !== 'undefined' && 'Notification' in window) {
        setPermission(Notification.permission);
      }
    };

    checkAvailability();
  }, []);

  return {
    isSupported,
    permission,
    isAvailable: isSupported && permission === 'granted',
    canRequest: isSupported && permission === 'default',
  };
}

export default useFCMToken;

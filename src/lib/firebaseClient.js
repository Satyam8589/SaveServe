// lib/firebaseClient.js
// Firebase client configuration for push notifications
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// VAPID key for push notifications
const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

// Initialize Firebase
let app;
let messaging;

// Initialize Firebase app
try {
  app = initializeApp(firebaseConfig);
  console.log('✅ Firebase app initialized');
} catch (error) {
  console.error('❌ Firebase app initialization failed:', error);
}

// Initialize Firebase Messaging (only in browser environment)
const initializeMessaging = async () => {
  if (typeof window === 'undefined') {
    console.log('🔄 Server-side environment, skipping messaging initialization');
    return null;
  }

  try {
    // Check if messaging is supported
    const supported = await isSupported();
    if (!supported) {
      console.warn('⚠️ Firebase Messaging is not supported in this browser');
      return null;
    }

    messaging = getMessaging(app);
    console.log('✅ Firebase Messaging initialized');
    return messaging;
  } catch (error) {
    console.error('❌ Firebase Messaging initialization failed:', error);
    return null;
  }
};

/**
 * Request notification permission and get FCM token
 * @returns {Promise<string|null>} FCM token or null if failed
 */
export const requestNotificationPermission = async () => {
  try {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      console.log('🔄 Server-side environment, cannot request permission');
      return null;
    }

    // Check if notifications are supported
    if (!('Notification' in window)) {
      console.warn('⚠️ This browser does not support notifications');
      return null;
    }

    // Initialize messaging if not already done
    if (!messaging) {
      messaging = await initializeMessaging();
      if (!messaging) {
        console.error('❌ Failed to initialize messaging');
        return null;
      }
    }

    // Request permission
    const permission = await Notification.requestPermission();
    console.log('🔔 Notification permission:', permission);

    if (permission !== 'granted') {
      console.warn('⚠️ Notification permission denied');
      return null;
    }

    // Get FCM token
    const token = await getToken(messaging, { vapidKey });
    
    if (token) {
      console.log('✅ FCM token generated:', token.substring(0, 20) + '...');
      return token;
    } else {
      console.warn('⚠️ No FCM token available');
      return null;
    }
  } catch (error) {
    console.error('❌ Error requesting notification permission:', error);
    return null;
  }
};

/**
 * Listen for foreground messages
 * @param {Function} callback - Callback function to handle messages
 * @returns {Function} Unsubscribe function
 */
export const onMessageListener = (callback) => {
  if (!messaging) {
    console.warn('⚠️ Messaging not initialized, cannot listen for messages');
    return () => {};
  }

  try {
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('📱 Foreground message received:', payload);
      callback(payload);
    });

    console.log('✅ Foreground message listener set up');
    return unsubscribe;
  } catch (error) {
    console.error('❌ Error setting up message listener:', error);
    return () => {};
  }
};

/**
 * Get current FCM token
 * @returns {Promise<string|null>} Current FCM token
 */
export const getCurrentToken = async () => {
  try {
    if (!messaging) {
      messaging = await initializeMessaging();
      if (!messaging) {
        return null;
      }
    }

    const token = await getToken(messaging, { vapidKey });
    return token;
  } catch (error) {
    console.error('❌ Error getting current token:', error);
    return null;
  }
};

/**
 * Check if notifications are supported and permission is granted
 * @returns {Promise<boolean>} True if notifications are available
 */
export const isNotificationAvailable = async () => {
  try {
    if (typeof window === 'undefined') {
      return false;
    }

    if (!('Notification' in window)) {
      return false;
    }

    const supported = await isSupported();
    if (!supported) {
      return false;
    }

    return Notification.permission === 'granted';
  } catch (error) {
    console.error('❌ Error checking notification availability:', error);
    return false;
  }
};

// Export Firebase app and messaging for other modules
export { app, messaging };

// Initialize messaging when module loads (client-side only)
if (typeof window !== 'undefined') {
  initializeMessaging();
}

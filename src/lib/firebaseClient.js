// lib/firebaseClient.js
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Cloud Messaging and get a reference to the service
let messaging = null;

if (typeof window !== 'undefined') {
  messaging = getMessaging(app);
}

/**
 * Check if the browser supports push notifications and FCM
 */
const isBrowserSupported = () => {
  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
};

/**
 * Wait for service worker to be ready
 */
const waitForServiceWorker = async (timeoutMs = 10000) => {
  if (!('serviceWorker' in navigator)) {
    throw new Error('Service Worker not supported');
  }

  const startTime = Date.now();
  
  while (Date.now() - startTime < timeoutMs) {
    const registration = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');
    
    if (registration && registration.active) {
      console.log('Service Worker is ready:', registration.scope);
      return registration;
    }
    
    // Wait 100ms before checking again
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  throw new Error('Service Worker registration timeout');
};

/**
 * Request FCM token from browser with mobile-specific handling
 * @returns {Promise<string|null>} FCM token or null if failed
 */
export const requestFCMToken = async () => {
  if (!messaging) {
    console.warn('Firebase messaging not available (likely running on server)');
    return null;
  }

  try {
    // Check browser compatibility first
    if (!isBrowserSupported()) {
      console.error('Browser does not support push notifications or service workers');
      return null;
    }

    // Check if VAPID key is configured
    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    if (!vapidKey) {
      console.error('VAPID key is not configured. Please add NEXT_PUBLIC_FIREBASE_VAPID_KEY to your environment variables.');
      return null;
    }

    console.log('Checking service worker registration...');
    
    // Wait for service worker to be ready (especially important on mobile)
    try {
      await waitForServiceWorker(10000); // 10 second timeout
    } catch (swError) {
      console.error('Service Worker registration failed or timed out:', swError);
      return null;
    }

    // Request notification permission
    console.log('Requesting notification permission...');
    const permission = await Notification.requestPermission();
    
    if (permission !== 'granted') {
      console.warn('Notification permission denied or dismissed:', permission);
      return null;
    }

    console.log('Notification permission granted, requesting FCM token...');
    
    // Get FCM token with timeout handling for mobile networks
    const tokenPromise = getToken(messaging, {
      vapidKey: vapidKey,
    });
    
    // Add timeout for mobile networks (they can be slow)
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('FCM token request timeout (mobile network may be slow)')), 15000);
    });
    
    const token = await Promise.race([tokenPromise, timeoutPromise]);
    
    if (token) {
      console.log('FCM Token received successfully:', token.substring(0, 50) + '...');
      return token;
    } else {
      console.warn('No registration token available. This may be due to browser settings or network issues.');
      return null;
    }
    
  } catch (error) {
    console.error('Error occurred while retrieving FCM token:');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    
    // Mobile-specific error handling
    if (error.message.includes('messaging/failed-service-worker-registration')) {
      console.error('Service Worker registration failed. Check if firebase-messaging-sw.js is accessible.');
    } else if (error.message.includes('messaging/token-subscribe-failed')) {
      console.error('Token subscription failed. This may be due to network issues or browser settings.');
    } else if (error.message.includes('messaging/permission-blocked')) {
      console.error('Notification permission is blocked. Please enable notifications in browser settings.');
    } else if (error.message.includes('timeout')) {
      console.error('Request timed out. This often happens on slow mobile networks. Please try again.');
    }
    
    return null;
  }
};

/**
 * Listen for foreground messages
 * @param {Function} callback - Function to call when message received
 */
export const onMessageListener = (callback) => {
  if (!messaging) {
    console.warn('Firebase messaging not available');
    return () => {};
  }

  return onMessage(messaging, (payload) => {
    console.log('Message received in foreground:', payload);
    callback(payload);
  });
};

export { messaging };
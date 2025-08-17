// lib/firebaseClient.js - Enhanced with debugging and fix
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, signInWithCustomToken } from 'firebase/auth';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

// 🔍 DEBUGGING: Log all environment variables
console.log('🔍 Firebase Client Environment Variables:');
console.log('NEXT_PUBLIC_FIREBASE_API_KEY:', process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? 'SET' : 'NOT SET');
console.log('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:', process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN);
console.log('NEXT_PUBLIC_FIREBASE_PROJECT_ID:', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
console.log('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET:', process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET);
console.log('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID:', process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID);
console.log('NEXT_PUBLIC_FIREBASE_APP_ID:', process.env.NEXT_PUBLIC_FIREBASE_APP_ID);

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// 🚨 CRITICAL CHECK: Verify project ID matches server
console.log('🔍 CLIENT PROJECT ID:', firebaseConfig.projectId);
console.log('🔍 Expected to match server project: saveserve-f9fb5');

if (firebaseConfig.projectId !== 'saveserve-f9fb5') {
  console.error('🚨 PROJECT ID MISMATCH DETECTED!');
  console.error('Client Project ID:', firebaseConfig.projectId);
  console.error('Server Project ID: saveserve-f9fb5');
  console.error('This will cause CONFIGURATION_NOT_FOUND error');
}

// Initialize Firebase
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
  console.log('✅ Firebase app initialized with project:', firebaseConfig.projectId);
} else {
  app = getApps()[0];
  console.log('✅ Using existing Firebase app');
}

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Connect to Firestore emulator in development
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined' && !db._settings?.host?.includes('localhost')) {
  try {
    connectFirestoreEmulator(db, 'localhost', 8080);
  } catch (error) {
    console.log('Firestore emulator connection failed:', error);
  }
}

/**
 * Enhanced signInWithClerk with better debugging
 */
export const signInWithClerk = async (clerkUser) => {
  try {
    if (!clerkUser) {
      console.warn('No Clerk user provided');
      return null;
    }

    console.log('🔍 Client Firebase Config Project ID:', firebaseConfig.projectId);
    console.log('🔍 Attempting to get custom token for user:', clerkUser.id);

    // Get custom token from your API endpoint
    const response = await fetch('/api/auth/firebase-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        clerkUserId: clerkUser.id,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Failed to get Firebase custom token:', errorData);
      throw new Error(`Failed to get Firebase custom token: ${errorData.error}`);
    }

    const tokenResponse = await response.json();
    console.log('✅ Received custom token response');
    console.log('🔍 Server Project ID:', tokenResponse.projectId);
    console.log('🔍 Client Project ID:', firebaseConfig.projectId);
    
    // 🚨 CRITICAL CHECK: Verify project IDs match
    if (tokenResponse.projectId && tokenResponse.projectId !== firebaseConfig.projectId) {
      console.error('🚨 PROJECT ID MISMATCH!');
      console.error('Server Project ID:', tokenResponse.projectId);
      console.error('Client Project ID:', firebaseConfig.projectId);
      
      // Show user-friendly error
      throw new Error(`Firebase configuration mismatch. Server project: ${tokenResponse.projectId}, Client project: ${firebaseConfig.projectId}. Please check your NEXT_PUBLIC_FIREBASE_PROJECT_ID environment variable.`);
    }

    const { customToken } = tokenResponse;
    console.log('🎟️ Attempting to sign in with custom token...');
    console.log('🔍 Token starts with:', customToken.substring(0, 50) + '...');

    // 🔍 Additional debugging before sign in
    console.log('🔍 Current auth instance project:', auth.app.options.projectId);
    
    // Sign in to Firebase with the custom token
    const userCredential = await signInWithCustomToken(auth, customToken);
    console.log('✅ Successfully signed in to Firebase:', userCredential.user.uid);
    
    return userCredential.user;
  } catch (error) {
    console.error('❌ Firebase sign-in failed:', error);
    
    // Enhanced error reporting
    if (error.code === 'auth/invalid-custom-token') {
      console.error('💡 Troubleshooting: Invalid custom token - check server-side token generation');
    } else if (error.code === 'auth/configuration-not-found') {
      console.error('💡 Troubleshooting: Configuration not found - PROJECT ID MISMATCH');
      console.error('💡 Check that NEXT_PUBLIC_FIREBASE_PROJECT_ID matches your server service account project_id');
      console.error('💡 Current client project ID:', firebaseConfig.projectId);
      console.error('💡 Expected server project ID: saveserve-f9fb5');
    }
    
    throw error;
  }
};

// Initialize Firebase Cloud Messaging
let messaging = null;

if (typeof window !== 'undefined') {
  messaging = getMessaging(app);
}

// ... rest of your existing functions remain the same
const isBrowserSupported = () => {
  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
};

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
    
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  throw new Error('Service Worker registration timeout');
};

export const requestFCMToken = async () => {
  if (!messaging) {
    console.warn('Firebase messaging not available (likely running on server)');
    return null;
  }

  try {
    if (!isBrowserSupported()) {
      console.error('Browser does not support push notifications or service workers');
      return null;
    }

    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    if (!vapidKey) {
      console.error('VAPID key is not configured. Please add NEXT_PUBLIC_FIREBASE_VAPID_KEY to your environment variables.');
      return null;
    }

    console.log('Checking service worker registration...');
    
    try {
      await waitForServiceWorker(10000);
    } catch (swError) {
      console.error('Service Worker registration failed or timed out:', swError);
      return null;
    }

    console.log('Requesting notification permission...');
    const permission = await Notification.requestPermission();
    
    if (permission !== 'granted') {
      console.warn('Notification permission denied or dismissed:', permission);
      return null;
    }

    console.log('Notification permission granted, requesting FCM token...');
    
    const tokenPromise = getToken(messaging, { vapidKey });
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('FCM token request timeout')), 15000);
    });
    
    const token = await Promise.race([tokenPromise, timeoutPromise]);
    
    if (token) {
      console.log('FCM Token received successfully:', token.substring(0, 50) + '...');
      return token;
    } else {
      console.warn('No registration token available');
      return null;
    }
    
  } catch (error) {
    console.error('Error occurred while retrieving FCM token:', error);
    return null;
  }
};

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
export default app;
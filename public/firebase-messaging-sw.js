// public/firebase-messaging-sw.js
// Firebase Messaging Service Worker for background notifications

// Import Firebase scripts
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAvxSwi3t0G7aZ1mgzRMcbemPF-6smC4n8",
  authDomain: "saveserve-f9fb5.firebaseapp.com",
  projectId: "saveserve-f9fb5",
  storageBucket: "saveserve-f9fb5.firebasestorage.app",
  messagingSenderId: "220940003803",
  appId: "1:220940003803:web:9d7a44660981023541dffe"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firebase Messaging
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('📱 Background message received:', payload);

  const notificationTitle = payload.notification?.title || 'SaveServe Notification';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new notification',
    icon: '/icon-192x192.png', // Add your app icon
    badge: '/badge-72x72.png', // Add your badge icon
    tag: payload.data?.notificationId || 'saveserve-notification',
    data: payload.data,
    actions: [
      {
        action: 'view',
        title: 'View',
        icon: '/action-view.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/action-dismiss.png'
      }
    ],
    requireInteraction: true, // Keep notification visible until user interacts
    vibrate: [200, 100, 200], // Vibration pattern
    timestamp: Date.now()
  };

  // Show notification
  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click events
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Notification clicked:', event);

  const notification = event.notification;
  const action = event.action;
  const data = notification.data;

  // Close the notification
  notification.close();

  if (action === 'dismiss') {
    // Just close the notification
    return;
  }

  // Handle view action or notification click
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Try to focus existing window
      for (const client of clientList) {
        if (client.url.includes('localhost:3000') || client.url.includes('saveserve')) {
          // Navigate to specific page if data contains URL
          if (data?.url) {
            client.navigate(data.url);
          }
          return client.focus();
        }
      }

      // Open new window if no existing window found
      const urlToOpen = data?.url || '/notifications';
      return clients.openWindow(urlToOpen);
    })
  );
});

// Handle notification close events
self.addEventListener('notificationclose', (event) => {
  console.log('🔔 Notification closed:', event);
  
  // Optional: Track notification dismissal
  const data = event.notification.data;
  if (data?.notificationId) {
    // You could send analytics or mark as dismissed
    console.log('Notification dismissed:', data.notificationId);
  }
});

// Handle push events (alternative to onBackgroundMessage)
self.addEventListener('push', (event) => {
  console.log('📱 Push event received:', event);

  if (!event.data) {
    console.log('Push event has no data');
    return;
  }

  try {
    const payload = event.data.json();
    console.log('Push payload:', payload);

    // This will be handled by onBackgroundMessage, but keeping as fallback
    if (!payload.notification) {
      const notificationTitle = payload.data?.title || 'SaveServe';
      const notificationOptions = {
        body: payload.data?.body || 'You have a new notification',
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
        tag: 'saveserve-push',
        data: payload.data
      };

      event.waitUntil(
        self.registration.showNotification(notificationTitle, notificationOptions)
      );
    }
  } catch (error) {
    console.error('Error handling push event:', error);
  }
});

// Service worker installation
self.addEventListener('install', (event) => {
  console.log('🔧 Firebase messaging service worker installed');
  self.skipWaiting();
});

// Service worker activation
self.addEventListener('activate', (event) => {
  console.log('🔧 Firebase messaging service worker activated');
  event.waitUntil(self.clients.claim());
});

console.log('🔥 Firebase messaging service worker loaded');

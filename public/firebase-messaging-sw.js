// public/firebase-messaging-sw.js
// Firebase service worker for handling background notifications

// Import Firebase scripts using importScripts (required for service workers)
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Firebase configuration - same as client
const firebaseConfig = {
  apiKey: "AIzaSyAvxSwi3t0G7aZ1mgzRMcbemPF-6smC4n8",
  authDomain: "saveserve-f9fb5.firebaseapp.com",
  projectId: "saveserve-f9fb5",
  storageBucket: "saveserve-f9fb5.firebasestorage.app",
  messagingSenderId: "220940003803",
  appId: "1:220940003803:web:9d7a44660981023541dffe"
};

// Initialize Firebase in service worker
firebase.initializeApp(firebaseConfig);

// Initialize Firebase Cloud Messaging and get a reference to the service
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message:', payload);
  
  const notificationTitle = payload.notification?.title || 'New Food Available';
  const notificationOptions = {
    body: payload.notification?.body || 'Check out new food listings in your area',
    icon: '/icons/food-icon-192x192.png', // Add your app icon
    badge: '/icons/food-badge-72x72.png', // Add a small badge icon
    tag: 'food-notification',
    data: payload.data,
    actions: [
      {
        action: 'view',
        title: 'View Listing'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ],
    requireInteraction: true, // Keep notification visible until user interacts
    vibrate: [200, 100, 200], // Vibration pattern for mobile
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click received.');

  event.notification.close();

  const action = event.action;
  const data = event.notification.data;

  if (action === 'view') {
    // Open the app to the relevant page
    const urlToOpen = data?.listingId 
      ? `/listings/${data.listingId}` 
      : '/listings';
    
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((clientList) => {
          // Check if app is already open
          for (const client of clientList) {
            if (client.url.includes(self.location.origin) && 'focus' in client) {
              client.focus();
              client.postMessage({
                type: 'NOTIFICATION_CLICKED',
                data: data,
                url: urlToOpen
              });
              return;
            }
          }
          
          // If app is not open, open it
          if (clients.openWindow) {
            return clients.openWindow(self.location.origin + urlToOpen);
          }
        })
    );
  } else if (action === 'dismiss') {
    // Just close the notification (already handled above)
    console.log('Notification dismissed');
  } else {
    // Default action (clicking the notification body)
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((clientList) => {
          if (clientList.length > 0) {
            const client = clientList[0];
            client.focus();
            client.postMessage({
              type: 'NOTIFICATION_CLICKED',
              data: data
            });
          } else if (clients.openWindow) {
            return clients.openWindow(self.location.origin);
          }
        })
    );
  }
});

// Handle service worker installation
self.addEventListener('install', (event) => {
  console.log('[firebase-messaging-sw.js] Service worker installing...');
  self.skipWaiting();
});

// Handle service worker activation
self.addEventListener('activate', (event) => {
  console.log('[firebase-messaging-sw.js] Service worker activating...');
  event.waitUntil(self.clients.claim());
});
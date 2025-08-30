// This service worker can be customized further
// See https://developers.google.com/web/tools/workbox/

self.addEventListener("install", (event) => {
  self.skipWaiting();
  console.log("Service Worker installed");
});

self.addEventListener("activate", (event) => {
  console.log("Service Worker activated");
});

// Cache assets and respond with them when offline
const CACHE_NAME = "smart-food-redistribution-cache-v1";
const urlsToCache = [
  "/",
  "/offline.html",
  "/manifest.json",
  "/logo.png",
  "/icons/icon-512x512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

// Network first strategy, fallback to cache
self.addEventListener("fetch", (event) => {
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request).then((response) => {
        if (response) {
          return response;
        }
        // If both network and cache fail, show offline page for HTML requests
        if (event.request.headers.get("accept").includes("text/html")) {
          return caches.match("/offline.html");
        }
      });
    })
  );
});

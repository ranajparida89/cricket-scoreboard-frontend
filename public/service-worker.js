// Minimal PWA-compatible service worker (no caching yet).
// Feel free to add caching later with a versioned cache name.

self.addEventListener('install', (event) => {
  console.log('✅ [SW] Installed');
  self.skipWaiting(); // Activate immediately
});

self.addEventListener('activate', (event) => {
  console.log('✅ [SW] Activated');
  return self.clients.claim(); // Control all pages immediately
});

self.addEventListener('fetch', (event) => {
  // Currently passthrough — browser handles all requests.
  // Add caching strategies here if needed later.
});

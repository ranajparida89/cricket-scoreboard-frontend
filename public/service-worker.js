// ✅ public/service-worker.js
// 22-July-2025: Ranaj Parida - Minimal PWA-compatible service worker

self.addEventListener('install', (event) => {
  console.log('✅ [SW] Installed');
  self.skipWaiting(); // Activate immediately
});

self.addEventListener('activate', (event) => {
  console.log('✅ [SW] Activated');
  return self.clients.claim(); // Take control immediately
});

self.addEventListener('fetch', (event) => {
  // Let the browser handle all requests normally
  // Can add caching here if needed later
});

/**
 * CampusOS AI - Production Service Worker
 * Provides offline timetable & examination caching, PWA installation, and network-first resilience.
 */

const CACHE_NAME = "campusos-cache-v1";
const STATIC_ASSETS = [
  "/",
  "/timetable",
  "/examinations",
  "/dashboard",
  "/manifest.json",
];

const CACHEABLE_API_ROUTES = [
  "/api/v1/timetable",
  "/api/v1/examinations",
  "/api/v1/rooms",
  "/api/v1/analytics",
];

// Install: Pre-cache core shell pages
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn("Pre-cache asset warning:", err);
      });
    })
  );
  self.skipWaiting();
});

// Activate: Clean up old cache versions
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch: Strategy depending on request type
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Handle API requests: Network-First with Cache Fallback
  const isCacheableApi = CACHEABLE_API_ROUTES.some((route) => url.pathname.startsWith(route));
  if (isCacheableApi && event.request.method === "GET") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(event.request);
          if (cached) {
            const headers = new Headers(cached.headers);
            headers.set("X-CampusOS-Cached", "true");
            return new Response(cached.body, {
              status: cached.status,
              statusText: cached.statusText,
              headers,
            });
          }
          return new Response(
            JSON.stringify({
              success: false,
              offline: true,
              message: "Network unavailable and no cached version exists.",
            }),
            { status: 503, headers: { "Content-Type": "application/json" } }
          );
        })
    );
    return;
  }

  // Handle Navigation / Static Assets: Cache-First or Network with fallback
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(async () => {
        const cached = await caches.match(event.request);
        if (cached) return cached;
        const timetableFallback = await caches.match("/timetable");
        return timetableFallback || caches.match("/");
      })
    );
    return;
  }

  // Default: Stale-While-Revalidate for images, stylesheets, scripts
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return networkResponse;
        })
        .catch(() => cached);
      return cached || fetchPromise;
    })
  );
});


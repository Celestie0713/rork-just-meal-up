/* Just Meal Up — PWA service worker.
 *
 * Strategy (kept deliberately simple and update-safe):
 * - Same-origin GETs are NETWORK-FIRST: visitors always get the freshest app
 *   bundle when online, so deploys are never stuck behind a stale cache.
 * - Every successful response is mirrored into the cache, which becomes the
 *   offline fallback the next time that URL is requested without network.
 * - Never touches non-GET requests or API traffic (tRPC, Stripe, etc.).
 */
const CACHE = "meal-up-pwa-v1";
const PRECACHE = [
  "/manifest.json",
  "/pwa-icon-192.png",
  "/pwa-icon-512.png",
  "/pwa-icon-maskable-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .catch(() => {})
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  // API calls (tRPC, auth, Stripe callbacks) must always go to the network.
  if (url.pathname.startsWith("/api/")) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        // Mirror successful same-origin responses for offline fallback.
        if (response && response.ok) {
          const copy = response.clone();
          caches
            .open(CACHE)
            .then((cache) => cache.put(request, copy))
            .catch(() => {});
        }
        return response;
      })
      .catch(() =>
        caches
          .match(request)
          .then((hit) => hit || (request.mode === "navigate" ? caches.match("/") : undefined))
          .then((hit) => hit || Response.error())
      )
  );
});

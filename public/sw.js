// Service Worker — 漂亮一夏！G大調福隆攝影比賽
const CACHE_NAME = "gmajor-beach-photo-contest-v1";

const PRECACHE_URLS = [
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png",
  "/favicon.ico",
];

function shouldBypass(request) {
  if (request.method !== "GET") return true;

  const { pathname } = new URL(request.url);
  if (pathname.startsWith("/api/")) return true;

  return false;
}

function isSameOrigin(url) {
  return url.origin === self.location.origin;
}

function isAppShellAsset(url) {
  const { pathname } = url;
  return (
    pathname.startsWith("/_next/static/") ||
    /\.(css|js|woff2?)(\?|$)/i.test(pathname)
  );
}

function isLocalImage(url) {
  if (!isSameOrigin(url)) return false;
  return /\.(png|jpg|jpeg|webp|gif|svg|ico)(\?|$)/i.test(url.pathname);
}

function isSupabasePhoto(url) {
  return (
    url.hostname.endsWith(".supabase.co") &&
    url.pathname.includes("/storage/v1/object/public/")
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.allSettled(
        PRECACHE_URLS.map((path) =>
          cache.add(new Request(path, { cache: "reload" }))
        )
      )
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (shouldBypass(request)) return;

  const url = new URL(request.url);

  // Next.js pages are dynamic — always fetch fresh HTML
  if (request.mode === "navigate") {
    event.respondWith(fetch(request));
    return;
  }

  // Contest photos: network first so replaced/deleted photos stay accurate
  if (isSupabasePhoto(url)) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Next.js bundles and local static images: cache first
  if (isSameOrigin(url) && (isAppShellAsset(url) || isLocalImage(url))) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response.ok && response.type === "basic") {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            }
            return response;
          })
      )
    );
  }
});

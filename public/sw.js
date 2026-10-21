// Life OS - Progressive Web App Service Worker
// Version: 2.1.0

const CACHE_NAME = 'life-os-shell-v2.1.0';
const DYNAMIC_CACHE_NAME = 'life-os-dynamic-v2.1.0';

// Essential core application shell assets
// Using relative paths to ensure flawless operation whether hosted at root or on GitHub Pages subpaths (e.g. /username/repo/)
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png',
  './apple-touch-icon.png'
];

// Offline fallback response HTML for navigation requests on first-visit failure
const OFFLINE_HTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Life OS — Sem Conexão</title>
  <style>
    body {
      background: #0D0E15;
      color: #F4F4F8;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 24px;
      box-sizing: border-box;
      text-align: center;
    }
    .card {
      max-width: 420px;
      padding: 32px;
      background: #141622;
      border: 1px solid #272B40;
      border-radius: 24px;
      box-shadow: 0 20px 40px -12px rgba(0,0,0,0.5);
    }
    .icon {
      font-size: 48px;
      margin-bottom: 16px;
    }
    h1 {
      font-size: 20px;
      font-weight: 700;
      margin: 0 0 8px 0;
      color: #F2512E;
    }
    p {
      font-size: 14px;
      color: #8B8A99;
      line-height: 1.6;
      margin: 0 0 24px 0;
    }
    button {
      background: #F2512E;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: opacity 0.2s;
    }
    button:active {
      opacity: 0.8;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">⚡</div>
    <h1>Life OS</h1>
    <p>Você parece estar sem conexão com a internet. Uma vez que o aplicativo for aberto pela primeira vez conectado, ele funcionará completamente offline sem interrupções.</p>
    <button onclick="window.location.reload()">Tentar Novamente</button>
  </div>
</body>
</html>`;

// Install event: Pre-cache core shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Use catch on individual items to avoid failing install if an asset fails
      return Promise.allSettled(
        CORE_ASSETS.map((url) =>
          cache.add(new Request(url, { cache: 'reload' })).catch((err) => {
            console.warn(`[PWA SW] Pre-cache item failed for: ${url}`, err);
          })
        )
      );
    }).then(() => {
      // Force immediate activation
      return self.skipWaiting();
    })
  );
});

// Activate event: Clean up previous cache versions safely without touching user indexedDB/localStorage
self.addEventListener('activate', (event) => {
  const allowedCaches = [CACHE_NAME, DYNAMIC_CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (!allowedCaches.includes(name)) {
            console.log(`[PWA SW] Removing outdated cache: ${name}`);
            return caches.delete(name);
          }
        })
      );
    }).then(() => {
      // Claim clients immediately
      return self.clients.claim();
    })
  );
});

// Fetch event: Apply intelligent caching strategies
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Only handle GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Do not intercept or cache external non-whitelisted APIs (like Supabase, analytics, etc)
  const isSameOrigin = url.origin === self.location.origin;
  const isGoogleFont = url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com');

  if (!isSameOrigin && !isGoogleFont) {
    return;
  }

  // 1. Navigation requests (HTML pages): Network-first with Cache Fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(async () => {
          // If offline, attempt cache match
          const cached = await caches.match(request);
          if (cached) return cached;

          // Attempt fallback to cached root index.html
          const rootCached = await caches.match('./index.html') || await caches.match('./');
          if (rootCached) return rootCached;

          // Return clear offline fallback HTML
          return new Response(OFFLINE_HTML, {
            headers: { 'Content-Type': 'text/html; charset=utf-8' }
          });
        })
    );
    return;
  }

  // 2. Static Assets (JS, CSS, SVGs, PNGs, Fonts): Stale-While-Revalidate
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            const targetCache = isSameOrigin ? CACHE_NAME : DYNAMIC_CACHE_NAME;
            caches.open(targetCache).then((cache) => cache.put(request, clone));
          }
          return networkResponse;
        })
        .catch((err) => {
          // If network fails and we had no cache, return null or fallback
          return null;
        });

      // Return cached version immediately if available, while updating cache in background
      return cachedResponse || fetchPromise.then((res) => res || caches.match('./index.html'));
    })
  );
});

// Listen for message events (e.g. skipWaiting trigger from UI update banner)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

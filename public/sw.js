// PriMake Service Worker — Network-First + Cache Fallback
const CACHE_NAME = 'primake-v2';
const OFFLINE_URL = '/';

// Assets to pre-cache on install
const PRE_CACHE = [
    '/',
    '/index.html'
];

self.addEventListener('install', (event) => {
    console.log('[SW] Install');
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(PRE_CACHE);
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    console.log('[SW] Activate');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => caches.delete(name))
            );
        })
    );
    return self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    const { request } = event;

    // Skip non-GET requests and Supabase/API calls
    if (request.method !== 'GET') return;
    const url = new URL(request.url);
    if (url.hostname.includes('supabase') || url.pathname.startsWith('/rest/')) return;

    event.respondWith(
        fetch(request)
            .then((response) => {
                // Cache successful responses for navigation/pages
                if (response.ok && (request.mode === 'navigate' || request.destination === 'document')) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(request, clone);
                    });
                }
                return response;
            })
            .catch(() => {
                // Network failed — serve from cache
                return caches.match(request).then((cached) => {
                    if (cached) return cached;
                    // For navigation requests, serve the cached index
                    if (request.mode === 'navigate') {
                        return caches.match(OFFLINE_URL);
                    }
                    return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
                });
            })
    );
});

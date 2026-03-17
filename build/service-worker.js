// Service Worker for Harit Swaraj PWA
// Enables offline functionality and caching

const CACHE_NAME = 'harit-swaraj-v1';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/offline.html',
    '/manifest.json',
    '/logo192.png',
    '/logo512.png'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    console.log('Service Worker: Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Service Worker: Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => self.skipWaiting())
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activating...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        console.log('Service Worker: Deleting old cache:', cache);
                        return caches.delete(cache);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') {
        return;
    }

    const isApiRequest = event.request.url.includes('/api/');

    if (isApiRequest) {
        // Network First Strategy for API calls: content must be fresh
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    // If network fetch succeeds, cache the fresh data
                    if (response && response.status === 200 && response.type !== 'error') {
                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(event.request, responseToCache);
                        });
                    }
                    return response;
                })
                .catch(() => {
                    // If network fails (offline), try to return cached data
                    return caches.match(event.request);
                })
        );
    } else {
        // Cache First Strategy for static assets (images, css, js)
        event.respondWith(
            caches.match(event.request)
                .then((cachedResponse) => {
                    // Return cached response if found
                    if (cachedResponse) {
                        return cachedResponse;
                    }

                    // Otherwise fetch from network
                    return fetch(event.request)
                        .then((response) => {
                            // Don't cache non-successful responses
                            if (!response || response.status !== 200 || response.type === 'error') {
                                return response;
                            }

                            // Clone response to cache it
                            const responseToCache = response.clone();

                            // Cache static assets
                            caches.open(CACHE_NAME).then((cache) => {
                                cache.put(event.request, responseToCache);
                            });

                            return response;
                        })
                        .catch(() => {
                            // If both cache and network fail, show offline page
                            if (event.request.mode === 'navigate') {
                                return caches.match('/offline.html');
                            }
                        });
                })
        );
    }
});

// Background sync for offline form submissions
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-data') {
        console.log('Service Worker: Syncing offline data...');
        event.waitUntil(syncOfflineData());
    }
});

async function syncOfflineData() {
    // Get offline data from IndexedDB (implement as needed)
    // Send to server when online
    console.log('Syncing offline submissions...');
}

// Push notifications (optional)
self.addEventListener('push', (event) => {
    const data = event.data ? event.data.json() : {};
    const title = data.title || 'Harit Swaraj';
    const options = {
        body: data.body || 'New notification',
        icon: '/logo192.png',
        badge: '/logo192.png',
        vibrate: [200, 100, 200]
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

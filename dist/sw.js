/**
 * 69Shop.in - Service Worker
 * 
 * Features:
 * - Offline support
 * - Asset caching
 * - API response caching
 * - Background sync
 * - Push notifications
 */

const CACHE_NAME = '69shop-v1';
const STATIC_CACHE = '69shop-static-v1';
const DYNAMIC_CACHE = '69shop-dynamic-v1';
const IMAGE_CACHE = '69shop-images-v1';

// Static assets to cache immediately
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/shop.html',
    '/shop-login.html',
    '/profile.html',
    '/services.html',
    '/manifest.json',
    '/favicon.ico',
    '/js/anti-flicker.js',
    '/js/shop-enhancements.js',
    '/Logo/logo.png'
];

// Pages to cache on first visit
const RUNTIME_CACHE_PAGES = [
    '/product.html',
    '/category.html',
    '/seller-dashboard.html',
    '/seller-products.html',
    '/seller-orders.html'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    console.log('[SW] Installing service worker...');
    
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then(cache => {
                console.log('[SW] Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => self.skipWaiting())
            .catch(err => console.log('[SW] Cache failed:', err))
    );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating service worker...');
    
    event.waitUntil(
        caches.keys()
            .then(keys => {
                return Promise.all(
                    keys.filter(key => {
                        return key !== STATIC_CACHE && 
                               key !== DYNAMIC_CACHE && 
                               key !== IMAGE_CACHE;
                    }).map(key => {
                        console.log('[SW] Deleting old cache:', key);
                        return caches.delete(key);
                    })
                );
            })
            .then(() => self.clients.claim())
    );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }

    // Skip Firebase and external APIs
    if (url.origin !== location.origin) {
        if (url.hostname.includes('firebaseio.com') ||
            url.hostname.includes('googleapis.com') ||
            url.hostname.includes('firebase.com')) {
            return;
        }
    }

    // Handle different request types
    if (request.destination === 'image') {
        event.respondWith(handleImageRequest(request));
    } else if (request.destination === 'document') {
        event.respondWith(handlePageRequest(request));
    } else {
        event.respondWith(handleStaticRequest(request));
    }
});

// Handle image requests - cache first, then network
async function handleImageRequest(request) {
    const cache = await caches.open(IMAGE_CACHE);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
        // Return cached but also update in background
        fetchAndCache(request, IMAGE_CACHE);
        return cachedResponse;
    }

    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        // Return placeholder image if offline
        return caches.match('/assets/placeholder.png');
    }
}

// Handle page requests - network first, fallback to cache
async function handlePageRequest(request) {
    try {
        const networkResponse = await fetch(request);
        
        // Cache successful responses
        if (networkResponse.ok) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        // Offline - try cache
        const cachedResponse = await caches.match(request);
        
        if (cachedResponse) {
            return cachedResponse;
        }

        // Return offline page
        return caches.match('/offline.html');
    }
}

// Handle static assets - cache first
async function handleStaticRequest(request) {
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
        return cachedResponse;
    }

    try {
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            const cache = await caches.open(STATIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.log('[SW] Fetch failed:', request.url);
        return new Response('Offline', { status: 503 });
    }
}

// Background fetch and cache
async function fetchAndCache(request, cacheName) {
    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(cacheName);
            cache.put(request, response);
        }
    } catch (error) {
        // Silent fail for background updates
    }
}

// Push notification handling
self.addEventListener('push', (event) => {
    console.log('[SW] Push received');

    let data = {
        title: '69Shop.in',
        body: 'You have a new notification',
        icon: '/Logo/icon-192x192.png',
        badge: '/Logo/badge.png',
        data: {}
    };

    if (event.data) {
        try {
            data = { ...data, ...event.data.json() };
        } catch (e) {
            data.body = event.data.text();
        }
    }

    const options = {
        body: data.body,
        icon: data.icon || '/Logo/icon-192x192.png',
        badge: data.badge || '/Logo/badge.png',
        image: data.image,
        vibrate: [100, 50, 100],
        data: data.data || {},
        actions: data.actions || [
            { action: 'open', title: 'Open' },
            { action: 'close', title: 'Close' }
        ],
        requireInteraction: data.requireInteraction || false,
        tag: data.tag || 'default',
        renotify: data.renotify || false
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
    console.log('[SW] Notification clicked:', event.action);

    event.notification.close();

    if (event.action === 'close') {
        return;
    }

    const urlToOpen = event.notification.data?.url || '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then(windowClients => {
                // Check if already open
                for (const client of windowClients) {
                    if (client.url === urlToOpen && 'focus' in client) {
                        return client.focus();
                    }
                }
                // Open new window
                if (clients.openWindow) {
                    return clients.openWindow(urlToOpen);
                }
            })
    );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
    console.log('[SW] Background sync:', event.tag);

    if (event.tag === 'sync-cart') {
        event.waitUntil(syncCart());
    } else if (event.tag === 'sync-wishlist') {
        event.waitUntil(syncWishlist());
    } else if (event.tag === 'sync-orders') {
        event.waitUntil(syncOrders());
    }
});

// Sync cart when back online
async function syncCart() {
    try {
        const cache = await caches.open(DYNAMIC_CACHE);
        const pendingCart = await cache.match('/pending-cart');
        
        if (pendingCart) {
            const cartData = await pendingCart.json();
            // Send to server
            await fetch('/api/sync-cart', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(cartData)
            });
            // Clear pending
            await cache.delete('/pending-cart');
        }
    } catch (error) {
        console.log('[SW] Cart sync failed:', error);
    }
}

// Sync wishlist when back online
async function syncWishlist() {
    // Similar to syncCart
    console.log('[SW] Syncing wishlist...');
}

// Sync orders when back online
async function syncOrders() {
    // Sync pending order updates
    console.log('[SW] Syncing orders...');
}

// Message handling from main thread
self.addEventListener('message', (event) => {
    console.log('[SW] Message received:', event.data);

    if (event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }

    if (event.data.type === 'CACHE_URLS') {
        event.waitUntil(
            caches.open(DYNAMIC_CACHE)
                .then(cache => cache.addAll(event.data.urls))
        );
    }

    if (event.data.type === 'CLEAR_CACHE') {
        event.waitUntil(
            caches.keys().then(keys => 
                Promise.all(keys.map(key => caches.delete(key)))
            )
        );
    }
});

// Periodic background sync (if supported)
self.addEventListener('periodicsync', (event) => {
    console.log('[SW] Periodic sync:', event.tag);

    if (event.tag === 'update-products') {
        event.waitUntil(updateProductCache());
    }
});

async function updateProductCache() {
    // Refresh product data in background
    console.log('[SW] Updating product cache...');
}

console.log('[SW] Service worker loaded');

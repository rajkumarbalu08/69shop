/**
 * 69Shop.in - Firebase Messaging Service Worker
 * 
 * Handles push notifications when app is in background
 */

// Import Firebase scripts
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

// Firebase config (will be updated with actual config)
firebase.initializeApp({
    apiKey: "YOUR_API_KEY",
    authDomain: "shop69-1.firebaseapp.com",
    projectId: "shop69-1",
    storageBucket: "shop69-1.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
    console.log('[FCM SW] Background message received:', payload);

    const notificationTitle = payload.notification?.title || payload.data?.title || '69Shop.in';
    const notificationOptions = {
        body: payload.notification?.body || payload.data?.body || 'You have a new notification',
        icon: payload.notification?.icon || '/Logo/icon-192x192.png',
        badge: '/Logo/badge.png',
        image: payload.notification?.image || payload.data?.image,
        data: payload.data || {},
        vibrate: [100, 50, 100],
        tag: payload.data?.tag || 'default',
        requireInteraction: payload.data?.requireInteraction === 'true',
        actions: [
            { action: 'open', title: 'View' },
            { action: 'dismiss', title: 'Dismiss' }
        ]
    };

    return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
    console.log('[FCM SW] Notification clicked:', event);

    event.notification.close();

    if (event.action === 'dismiss') {
        return;
    }

    // Determine URL to open
    let urlToOpen = '/';
    
    if (event.notification.data) {
        if (event.notification.data.link) {
            urlToOpen = event.notification.data.link;
        } else if (event.notification.data.orderId) {
            urlToOpen = `/order-tracking.html?id=${event.notification.data.orderId}`;
        } else if (event.notification.data.productId) {
            urlToOpen = `/product.html?id=${event.notification.data.productId}`;
        }
    }

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then(clientList => {
                // Focus existing window if open
                for (const client of clientList) {
                    if (client.url.includes(self.location.origin) && 'focus' in client) {
                        client.navigate(urlToOpen);
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

console.log('[FCM SW] Firebase Messaging Service Worker loaded');

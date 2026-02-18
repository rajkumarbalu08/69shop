/**
 * 69Shop.in - Push Notifications System (Firebase Cloud Messaging)
 * 
 * Features:
 * - Browser push notifications
 * - Order status updates
 * - Shipping notifications
 * - Promotional alerts
 * - New message notifications
 * - Permission management
 * - Topic subscriptions
 * 
 * Usage:
 *   const notifications = new PushNotifications();
 *   await notifications.requestPermission();
 *   await notifications.subscribeToTopic('deals');
 */

class PushNotifications {
    constructor() {
        this.messaging = null;
        this.db = firebase.firestore();
        this.auth = firebase.auth();
        this.vapidKey = null; // Set from firebase-config
        this.token = null;
        this.isSupported = false;

        this.init();
    }

    /**
     * Initialize FCM
     */
    async init() {
        try {
            // Check if FCM is supported
            if (!('Notification' in window)) {
                console.log('Notifications not supported');
                return;
            }

            if (!('serviceWorker' in navigator)) {
                console.log('Service Worker not supported');
                return;
            }

            // Check if Firebase messaging is available
            if (firebase.messaging && firebase.messaging.isSupported()) {
                this.messaging = firebase.messaging();
                this.isSupported = true;

                // Get VAPID key from config
                if (window.firebaseConfig && window.firebaseConfig.vapidKey) {
                    this.vapidKey = window.firebaseConfig.vapidKey;
                }

                // Handle foreground messages
                this.messaging.onMessage((payload) => {
                    this.handleForegroundMessage(payload);
                });
            }
        } catch (error) {
            console.warn('FCM initialization failed:', error);
        }
    }

    /**
     * Request notification permission
     */
    async requestPermission() {
        if (!this.isSupported) {
            return { granted: false, reason: 'Not supported' };
        }

        try {
            const permission = await Notification.requestPermission();

            if (permission === 'granted') {
                await this.getToken();
                return { granted: true };
            } else if (permission === 'denied') {
                return { granted: false, reason: 'Permission denied by user' };
            } else {
                return { granted: false, reason: 'Permission dismissed' };
            }
        } catch (error) {
            console.error('Permission request failed:', error);
            return { granted: false, reason: error.message };
        }
    }

    /**
     * Get FCM token
     */
    async getToken() {
        if (!this.messaging || !this.vapidKey) {
            return null;
        }

        try {
            // Register service worker first
            const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');

            this.token = await this.messaging.getToken({
                vapidKey: this.vapidKey,
                serviceWorkerRegistration: registration
            });

            if (this.token) {
                await this.saveToken(this.token);
            }

            return this.token;
        } catch (error) {
            console.error('Failed to get FCM token:', error);
            return null;
        }
    }

    /**
     * Save FCM token to Firestore
     */
    async saveToken(token) {
        const user = this.auth.currentUser;
        if (!user) return;

        const tokenData = {
            token,
            userId: user.uid,
            platform: 'web',
            browser: navigator.userAgent,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            lastActive: firebase.firestore.FieldValue.serverTimestamp()
        };

        await this.db.collection('fcmTokens').doc(token).set(tokenData, { merge: true });

        // Also update user document
        await this.db.collection('users').doc(user.uid).set({
            fcmToken: token,
            notificationsEnabled: true
        }, { merge: true });
    }

    /**
     * Handle foreground messages
     */
    handleForegroundMessage(payload) {
        console.log('Foreground message:', payload);

        const { notification, data } = payload;

        // Show custom notification UI
        this.showNotification({
            title: notification?.title || data?.title || '69Shop',
            body: notification?.body || data?.body || '',
            icon: notification?.icon || '/Logo/logo.png',
            image: notification?.image || data?.image,
            data: data
        });
    }

    /**
     * Show in-app notification toast
     */
    showNotification(options) {
        // Create notification toast
        const toast = document.createElement('div');
        toast.className = 'notification-toast';
        toast.innerHTML = `
            <div class="notification-toast-content">
                <img src="${options.icon}" alt="" class="notification-icon">
                <div class="notification-text">
                    <strong>${options.title}</strong>
                    <p>${options.body}</p>
                </div>
                <button class="notification-close">&times;</button>
            </div>
        `;

        // Add styles if not present
        if (!document.getElementById('notification-toast-styles')) {
            const styles = document.createElement('style');
            styles.id = 'notification-toast-styles';
            styles.textContent = `
                .notification-toast {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    max-width: 360px;
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.2);
                    z-index: 10000;
                    animation: slideIn 0.3s ease;
                    overflow: hidden;
                }
                .notification-toast-content {
                    display: flex;
                    align-items: flex-start;
                    padding: 16px;
                    gap: 12px;
                }
                .notification-icon {
                    width: 48px;
                    height: 48px;
                    border-radius: 8px;
                    object-fit: cover;
                }
                .notification-text {
                    flex: 1;
                }
                .notification-text strong {
                    display: block;
                    font-size: 14px;
                    color: #1a1a1a;
                    margin-bottom: 4px;
                }
                .notification-text p {
                    font-size: 13px;
                    color: #666;
                    margin: 0;
                    line-height: 1.4;
                }
                .notification-close {
                    background: none;
                    border: none;
                    font-size: 20px;
                    color: #999;
                    cursor: pointer;
                    padding: 0;
                    line-height: 1;
                }
                .notification-close:hover {
                    color: #333;
                }
                @keyframes slideIn {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
            `;
            document.head.appendChild(styles);
        }

        document.body.appendChild(toast);

        // Close button
        toast.querySelector('.notification-close').addEventListener('click', () => {
            toast.remove();
        });

        // Click to navigate
        if (options.data?.link) {
            toast.style.cursor = 'pointer';
            toast.addEventListener('click', (e) => {
                if (!e.target.classList.contains('notification-close')) {
                    window.location.href = options.data.link;
                }
            });
        }

        // Auto dismiss
        setTimeout(() => {
            toast.style.animation = 'slideIn 0.3s ease reverse';
            setTimeout(() => toast.remove(), 300);
        }, 5000);

        // Play sound
        this.playNotificationSound();
    }

    /**
     * Play notification sound
     */
    playNotificationSound() {
        try {
            const audio = new Audio('/assets/notification.mp3');
            audio.volume = 0.3;
            audio.play().catch(() => {});
        } catch (e) {}
    }

    /**
     * Subscribe to a topic
     */
    async subscribeToTopic(topic) {
        if (!this.token) {
            await this.getToken();
        }

        if (!this.token) {
            throw new Error('No FCM token available');
        }

        // Store subscription in Firestore (actual subscription via Cloud Function)
        const user = this.auth.currentUser;
        if (user) {
            await this.db.collection('topicSubscriptions').add({
                userId: user.uid,
                token: this.token,
                topic,
                action: 'subscribe',
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        }

        return { success: true, topic };
    }

    /**
     * Unsubscribe from a topic
     */
    async unsubscribeFromTopic(topic) {
        if (!this.token) return;

        const user = this.auth.currentUser;
        if (user) {
            await this.db.collection('topicSubscriptions').add({
                userId: user.uid,
                token: this.token,
                topic,
                action: 'unsubscribe',
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        }

        return { success: true, topic };
    }

    /**
     * Get notification preferences
     */
    async getPreferences() {
        const user = this.auth.currentUser;
        if (!user) return null;

        const doc = await this.db.collection('notificationPreferences').doc(user.uid).get();
        return doc.exists ? doc.data() : this.getDefaultPreferences();
    }

    /**
     * Update notification preferences
     */
    async updatePreferences(preferences) {
        const user = this.auth.currentUser;
        if (!user) throw new Error('Must be logged in');

        await this.db.collection('notificationPreferences').doc(user.uid).set({
            ...preferences,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        return { success: true };
    }

    /**
     * Default notification preferences
     */
    getDefaultPreferences() {
        return {
            orderUpdates: true,
            shippingAlerts: true,
            promotions: true,
            priceDrops: true,
            newMessages: true,
            reviewReminders: true,
            restockAlerts: true
        };
    }

    /**
     * Check if notifications are enabled
     */
    isEnabled() {
        return this.isSupported && Notification.permission === 'granted';
    }

    /**
     * Get permission status
     */
    getPermissionStatus() {
        if (!('Notification' in window)) {
            return 'unsupported';
        }
        return Notification.permission;
    }

    /**
     * Show native notification (for testing)
     */
    showNativeNotification(title, options = {}) {
        if (Notification.permission !== 'granted') {
            return null;
        }

        return new Notification(title, {
            icon: '/Logo/logo.png',
            badge: '/Logo/badge.png',
            ...options
        });
    }

    /**
     * Request notification for order updates
     */
    async enableOrderNotifications(orderId) {
        const user = this.auth.currentUser;
        if (!user) return;

        await this.db.collection('orderNotificationSubscriptions').add({
            userId: user.uid,
            orderId,
            token: this.token,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    }

    /**
     * Delete token on logout
     */
    async deleteToken() {
        if (this.token) {
            try {
                await this.db.collection('fcmTokens').doc(this.token).delete();
                if (this.messaging) {
                    await this.messaging.deleteToken();
                }
                this.token = null;
            } catch (error) {
                console.warn('Failed to delete token:', error);
            }
        }
    }
}

// Export
if (typeof window !== 'undefined') {
    window.PushNotifications = PushNotifications;
}

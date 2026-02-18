/**
 * 69Shop.in - PWA Initialization
 * 
 * Features:
 * - Service worker registration
 * - Install prompt handling
 * - Update notifications
 * - Offline detection
 * 
 * Include this script in all HTML pages:
 * <script src="/js/pwa-init.js"></script>
 */

class PWAManager {
    constructor() {
        this.deferredPrompt = null;
        this.swRegistration = null;
        this.isInstalled = false;
        this.isOnline = navigator.onLine;
        
        this.init();
    }

    async init() {
        // Check if already installed
        this.checkInstallStatus();
        
        // Register service worker
        await this.registerServiceWorker();
        
        // Handle install prompt
        this.setupInstallPrompt();
        
        // Handle online/offline events
        this.setupNetworkListeners();
        
        // Add manifest link if not present
        this.ensureManifestLink();
        
        // Add meta tags for PWA
        this.addPWAMetaTags();
    }

    async registerServiceWorker() {
        if (!('serviceWorker' in navigator)) {
            console.log('[PWA] Service Worker not supported');
            return;
        }

        try {
            this.swRegistration = await navigator.serviceWorker.register('/sw.js', {
                scope: '/'
            });

            console.log('[PWA] Service Worker registered:', this.swRegistration.scope);

            // Check for updates
            this.swRegistration.addEventListener('updatefound', () => {
                const newWorker = this.swRegistration.installing;
                
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        // New version available
                        this.showUpdateNotification();
                    }
                });
            });

            // Handle controller change (update activated)
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                console.log('[PWA] New service worker activated');
            });

        } catch (error) {
            console.error('[PWA] Service Worker registration failed:', error);
        }
    }

    setupInstallPrompt() {
        window.addEventListener('beforeinstallprompt', (e) => {
            console.log('[PWA] Install prompt available');
            
            // Prevent automatic prompt
            e.preventDefault();
            
            // Store for later use
            this.deferredPrompt = e;
            
            // Show install button
            this.showInstallButton();
        });

        window.addEventListener('appinstalled', () => {
            console.log('[PWA] App installed');
            this.isInstalled = true;
            this.hideInstallButton();
            this.deferredPrompt = null;
            
            // Track installation
            this.trackInstall();
        });
    }

    async promptInstall() {
        if (!this.deferredPrompt) {
            console.log('[PWA] No install prompt available');
            return { outcome: 'unavailable' };
        }

        // Show the prompt
        this.deferredPrompt.prompt();

        // Wait for user response
        const { outcome } = await this.deferredPrompt.userChoice;
        console.log('[PWA] Install prompt outcome:', outcome);

        // Clear the prompt
        this.deferredPrompt = null;

        return { outcome };
    }

    showInstallButton() {
        // Create install button if not exists
        if (document.getElementById('pwa-install-btn')) return;

        const button = document.createElement('button');
        button.id = 'pwa-install-btn';
        button.innerHTML = `
            <span class="install-icon">📲</span>
            <span class="install-text">Install App</span>
        `;
        button.onclick = () => this.promptInstall();

        // Add styles
        const styles = document.createElement('style');
        styles.textContent = `
            #pwa-install-btn {
                position: fixed;
                bottom: 20px;
                left: 20px;
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 12px 20px;
                background: #0066ff;
                color: white;
                border: none;
                border-radius: 30px;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                box-shadow: 0 4px 20px rgba(0, 102, 255, 0.4);
                z-index: 9999;
                animation: slideUp 0.5s ease;
                transition: transform 0.2s, box-shadow 0.2s;
            }
            #pwa-install-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 25px rgba(0, 102, 255, 0.5);
            }
            #pwa-install-btn .install-icon {
                font-size: 18px;
            }
            @keyframes slideUp {
                from {
                    transform: translateY(100px);
                    opacity: 0;
                }
                to {
                    transform: translateY(0);
                    opacity: 1;
                }
            }
            @media (max-width: 480px) {
                #pwa-install-btn {
                    left: 50%;
                    transform: translateX(-50%);
                    bottom: 80px;
                }
            }
        `;
        document.head.appendChild(styles);
        document.body.appendChild(button);

        // Auto-hide after 30 seconds
        setTimeout(() => {
            if (button.parentNode) {
                button.style.animation = 'slideUp 0.5s ease reverse';
                setTimeout(() => button.remove(), 500);
            }
        }, 30000);
    }

    hideInstallButton() {
        const button = document.getElementById('pwa-install-btn');
        if (button) {
            button.remove();
        }
    }

    showUpdateNotification() {
        const notification = document.createElement('div');
        notification.id = 'pwa-update-notification';
        notification.innerHTML = `
            <div class="update-content">
                <span class="update-icon">🔄</span>
                <span class="update-text">A new version is available!</span>
                <button class="update-btn" onclick="window.pwaManager.applyUpdate()">Update</button>
                <button class="dismiss-btn" onclick="this.parentElement.parentElement.remove()">✕</button>
            </div>
        `;

        const styles = document.createElement('style');
        styles.textContent = `
            #pwa-update-notification {
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: white;
                border-radius: 12px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.2);
                z-index: 10000;
                animation: slideDown 0.5s ease;
            }
            .update-content {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 16px 20px;
            }
            .update-icon {
                font-size: 24px;
            }
            .update-text {
                font-weight: 500;
                color: #1a1a1a;
            }
            .update-btn {
                padding: 8px 16px;
                background: #0066ff;
                color: white;
                border: none;
                border-radius: 6px;
                font-weight: 600;
                cursor: pointer;
            }
            .dismiss-btn {
                background: none;
                border: none;
                font-size: 18px;
                color: #999;
                cursor: pointer;
                padding: 4px;
            }
            @keyframes slideDown {
                from {
                    transform: translateX(-50%) translateY(-100px);
                    opacity: 0;
                }
                to {
                    transform: translateX(-50%) translateY(0);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(styles);
        document.body.appendChild(notification);
    }

    applyUpdate() {
        if (this.swRegistration && this.swRegistration.waiting) {
            this.swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
        window.location.reload();
    }

    setupNetworkListeners() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.hideOfflineIndicator();
            console.log('[PWA] Back online');
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.showOfflineIndicator();
            console.log('[PWA] Gone offline');
        });

        // Initial check
        if (!this.isOnline) {
            this.showOfflineIndicator();
        }
    }

    showOfflineIndicator() {
        if (document.getElementById('offline-indicator')) return;

        const indicator = document.createElement('div');
        indicator.id = 'offline-indicator';
        indicator.innerHTML = `
            <span class="offline-dot"></span>
            <span>You're offline</span>
        `;

        const styles = document.createElement('style');
        styles.id = 'offline-styles';
        styles.textContent = `
            #offline-indicator {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                background: #ff4444;
                color: white;
                text-align: center;
                padding: 8px;
                font-size: 13px;
                font-weight: 500;
                z-index: 10001;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
            }
            .offline-dot {
                width: 8px;
                height: 8px;
                background: white;
                border-radius: 50%;
                animation: blink 1s infinite;
            }
            @keyframes blink {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
            }
        `;
        document.head.appendChild(styles);
        document.body.prepend(indicator);
    }

    hideOfflineIndicator() {
        const indicator = document.getElementById('offline-indicator');
        if (indicator) {
            indicator.remove();
        }
        const styles = document.getElementById('offline-styles');
        if (styles) {
            styles.remove();
        }
    }

    checkInstallStatus() {
        // Check if running as installed PWA
        if (window.matchMedia('(display-mode: standalone)').matches) {
            this.isInstalled = true;
            console.log('[PWA] Running as installed app');
        }

        // iOS check
        if (window.navigator.standalone === true) {
            this.isInstalled = true;
            console.log('[PWA] Running as iOS installed app');
        }
    }

    ensureManifestLink() {
        if (!document.querySelector('link[rel="manifest"]')) {
            const link = document.createElement('link');
            link.rel = 'manifest';
            link.href = '/manifest.json';
            document.head.appendChild(link);
        }
    }

    addPWAMetaTags() {
        const metaTags = [
            { name: 'theme-color', content: '#0066ff' },
            { name: 'apple-mobile-web-app-capable', content: 'yes' },
            { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
            { name: 'apple-mobile-web-app-title', content: '69Shop' },
            { name: 'mobile-web-app-capable', content: 'yes' }
        ];

        metaTags.forEach(tag => {
            if (!document.querySelector(`meta[name="${tag.name}"]`)) {
                const meta = document.createElement('meta');
                meta.name = tag.name;
                meta.content = tag.content;
                document.head.appendChild(meta);
            }
        });

        // Apple touch icon
        if (!document.querySelector('link[rel="apple-touch-icon"]')) {
            const link = document.createElement('link');
            link.rel = 'apple-touch-icon';
            link.href = '/Logo/icon-192x192.png';
            document.head.appendChild(link);
        }
    }

    trackInstall() {
        // Track installation analytics
        if (typeof gtag === 'function') {
            gtag('event', 'pwa_install', {
                event_category: 'PWA',
                event_label: 'App Installed'
            });
        }

        // Store in localStorage
        localStorage.setItem('pwa_installed', 'true');
        localStorage.setItem('pwa_installed_date', new Date().toISOString());
    }

    // Get PWA stats
    getStats() {
        return {
            isInstalled: this.isInstalled,
            isOnline: this.isOnline,
            hasServiceWorker: !!this.swRegistration,
            installPromptAvailable: !!this.deferredPrompt
        };
    }
}

// Initialize PWA manager
window.pwaManager = new PWAManager();

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PWAManager;
}

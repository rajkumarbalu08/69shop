(function (global) {
    const DEFAULT_LIMIT = 8;
    const ICON_MAP = {
        order: 'fa-shopping-bag',
        seller: 'fa-store',
        product: 'fa-box-open',
        warning: 'fa-triangle-exclamation',
        success: 'fa-circle-check',
        danger: 'fa-circle-exclamation',
        info: 'fa-bell',
        review: 'fa-star',
        payment: 'fa-wallet',
        ticket: 'fa-headset'
    };

    function resolveIcon(type) {
        return ICON_MAP[type] || ICON_MAP.info;
    }

    function toTimestamp(value) {
        if (!value) return 0;
        if (typeof value === 'number') return value;
        if (value instanceof Date) return value.getTime();
        if (typeof value === 'string') {
            const parsed = Date.parse(value);
            return Number.isFinite(parsed) ? parsed : 0;
        }
        if (typeof value === 'object') {
            if (typeof value.toDate === 'function') {
                return value.toDate().getTime();
            }
            if (typeof value.seconds === 'number') {
                return value.seconds * 1000;
            }
        }
        return 0;
    }

    function formatRelative(ts) {
        if (!ts) return 'Just now';
        const diff = Date.now() - ts;
        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        return new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    }

    async function fetchNotifications(db, filters) {
        if (!db || !filters.length) return [];
        try {
            const snapshot = await db.collection('notifications')
                .where('audience', 'in', filters)
                .get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.warn('Notification fetch failed:', error);
            return [];
        }
    }

    function renderNotifications(listEl, items, onMarkRead) {
        if (!listEl) return;
        if (!items.length) {
            listEl.innerHTML = `
                <div class="notification-empty">
                    <i class="fas fa-bell-slash"></i>
                    <p>No notifications yet</p>
                </div>`;
            return;
        }
        listEl.innerHTML = items.map(item => {
            const ts = toTimestamp(item.createdAt);
            const type = item.type || 'info';
            const actionLink = item.actionUrl ? `data-action-url="${item.actionUrl}"` : '';
            return `
                <div class="notification-item ${item.unread ? 'unread' : ''}" data-notification-id="${item.id}" ${actionLink}>
                    <div class="notification-icon ${type}">
                        <i class="fas ${resolveIcon(type)}"></i>
                    </div>
                    <div class="notification-content">
                        <p class="notification-title">${item.title || 'Update'}</p>
                        <p class="notification-message">${item.message || ''}</p>
                        <span class="notification-time">${formatRelative(ts)}</span>
                    </div>
                    ${item.unread ? '<button class="notification-mark-read" title="Mark as read"><i class="fas fa-check"></i></button>' : ''}
                </div>`;
        }).join('');

        // Add click handlers for marking as read
        listEl.querySelectorAll('.notification-item').forEach(el => {
            el.addEventListener('click', (e) => {
                const id = el.dataset.notificationId;
                const actionUrl = el.dataset.actionUrl;
                
                // If clicking the mark as read button specifically
                if (e.target.closest('.notification-mark-read')) {
                    e.preventDefault();
                    e.stopPropagation();
                    if (onMarkRead && id) onMarkRead(id, el);
                    return;
                }
                
                // Mark as read on any click
                if (el.classList.contains('unread') && onMarkRead && id) {
                    onMarkRead(id, el);
                }
                
                // Navigate if there's an action URL
                if (actionUrl) {
                    window.location.href = actionUrl;
                }
            });
        });
    }

    function updateBadge(badgeEl, items) {
        if (!badgeEl) return;
        const unread = items.filter(item => item.unread).length;
        badgeEl.style.display = unread ? 'inline-flex' : 'none';
        badgeEl.textContent = unread;
    }

    global.NotificationFeed = {
        init(options = {}) {
            const config = {
                audience: 'all',
                triggerSelector: '#notificationTrigger',
                panelSelector: '#notificationPanel',
                listSelector: '#notificationList',
                badgeSelector: '#notificationDot',
                refreshSelector: '#notificationRefresh',
                subtitleSelector: '#notificationSubtitle',
                markAllSelector: '#markAllRead',
                limit: DEFAULT_LIMIT,
                db: null,
                userId: null,
                ...options
            };

            const trigger = document.querySelector(config.triggerSelector);
            const panel = document.querySelector(config.panelSelector);
            const list = document.querySelector(config.listSelector);
            if (!trigger || !panel || !list || !config.db) {
                return null;
            }
            const badge = config.badgeSelector ? document.querySelector(config.badgeSelector) : null;
            const refreshBtn = config.refreshSelector ? document.querySelector(config.refreshSelector) : null;
            const subtitle = config.subtitleSelector ? document.querySelector(config.subtitleSelector) : null;
            const markAllBtn = config.markAllSelector ? document.querySelector(config.markAllSelector) : null;
            let loading = false;
            let currentItems = [];

            // Mark single notification as read
            async function markAsRead(notificationId, element) {
                if (!config.db || !config.userId || !notificationId) return;
                
                try {
                    await config.db.collection('notifications').doc(notificationId).update({
                        readBy: firebase.firestore.FieldValue.arrayUnion(config.userId)
                    });
                    
                    // Update UI immediately
                    if (element) {
                        element.classList.remove('unread');
                        const markBtn = element.querySelector('.notification-mark-read');
                        if (markBtn) markBtn.remove();
                    }
                    
                    // Update local state
                    const item = currentItems.find(i => i.id === notificationId);
                    if (item) item.unread = false;
                    
                    // Update badge
                    updateBadge(badge, currentItems);
                    updateSubtitle();
                } catch (error) {
                    console.warn('Failed to mark notification as read:', error);
                }
            }

            // Mark all notifications as read
            async function markAllAsRead() {
                if (!config.db || !config.userId) return;
                
                const unreadItems = currentItems.filter(item => item.unread);
                if (!unreadItems.length) return;
                
                try {
                    const batch = config.db.batch();
                    unreadItems.forEach(item => {
                        const ref = config.db.collection('notifications').doc(item.id);
                        batch.update(ref, {
                            readBy: firebase.firestore.FieldValue.arrayUnion(config.userId)
                        });
                    });
                    await batch.commit();
                    
                    // Update UI
                    list.querySelectorAll('.notification-item.unread').forEach(el => {
                        el.classList.remove('unread');
                        const markBtn = el.querySelector('.notification-mark-read');
                        if (markBtn) markBtn.remove();
                    });
                    
                    // Update local state
                    currentItems.forEach(item => item.unread = false);
                    
                    // Update badge
                    updateBadge(badge, currentItems);
                    updateSubtitle();
                } catch (error) {
                    console.warn('Failed to mark all notifications as read:', error);
                }
            }

            function updateSubtitle() {
                if (!subtitle) return;
                const unreadCount = currentItems.filter(i => i.unread).length;
                if (unreadCount > 0) {
                    subtitle.textContent = `${unreadCount} unread`;
                } else if (currentItems.length > 0) {
                    subtitle.textContent = 'All caught up!';
                } else {
                    subtitle.textContent = 'Nothing new right now';
                }
            }

            async function loadNotifications() {
                if (loading) return;
                loading = true;
                list.innerHTML = `
                    <div class="notification-empty">
                        <i class="fas fa-circle-notch fa-spin"></i>
                        <p>Fetching notifications...</p>
                    </div>`;
                const filters = ['all'];
                if (config.audience && config.audience !== 'all') {
                    filters.push(config.audience);
                }
                if (config.userId) {
                    filters.push(`user:${config.userId}`);
                }
                const docs = await fetchNotifications(config.db, filters);
                const parsed = docs
                    .map(doc => {
                        const readBy = doc.readBy || [];
                        const unread = config.userId ? !readBy.includes(config.userId) : !doc.read;
                        return { ...doc, unread };
                    })
                    .sort((a, b) => toTimestamp(b.createdAt) - toTimestamp(a.createdAt))
                    .slice(0, config.limit);
                
                currentItems = parsed;
                renderNotifications(list, parsed, markAsRead);
                updateBadge(badge, parsed);
                updateSubtitle();
                loading = false;
                return parsed;
            }

            trigger.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();
                panel.classList.toggle('show');
            });

            document.addEventListener('click', (event) => {
                if (!panel.contains(event.target) && !trigger.contains(event.target)) {
                    panel.classList.remove('show');
                }
            });

            if (refreshBtn) {
                refreshBtn.addEventListener('click', (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    loadNotifications();
                });
            }

            if (markAllBtn) {
                markAllBtn.addEventListener('click', (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    markAllAsRead();
                });
            }

            loadNotifications();

            return {
                refresh: loadNotifications,
                load: loadNotifications,
                markAsRead,
                markAllAsRead,
                getUnreadCount: () => currentItems.filter(i => i.unread).length
            };
        }
    };
})(window);

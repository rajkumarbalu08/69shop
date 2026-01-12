(function (global) {
    const DEFAULT_LIMIT = 8;
    const ICON_MAP = {
        order: 'fa-shopping-bag',
        seller: 'fa-store',
        product: 'fa-box-open',
        warning: 'fa-triangle-exclamation',
        success: 'fa-circle-check',
        danger: 'fa-circle-exclamation',
        info: 'fa-bell'
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

    function renderNotifications(listEl, items) {
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
            return `
                <div class="notification-item ${item.unread ? 'unread' : ''}">
                    <div class="notification-icon ${type}">
                        <i class="fas ${resolveIcon(type)}"></i>
                    </div>
                    <div class="notification-content">
                        <p class="notification-title">${item.title || 'Update'}</p>
                        <p class="notification-message">${item.message || ''}</p>
                        <span class="notification-time">${formatRelative(ts)}</span>
                    </div>
                </div>`;
        }).join('');
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
            let loading = false;

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
                renderNotifications(list, parsed);
                updateBadge(badge, parsed);
                if (subtitle) {
                    subtitle.textContent = parsed.length ? 'Latest updates' : 'Nothing new right now';
                }
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

            loadNotifications();

            return {
                refresh: loadNotifications,
                load: loadNotifications
            };
        }
    };
})(window);

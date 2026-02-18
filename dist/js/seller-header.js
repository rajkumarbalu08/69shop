/**
 * 69Shop.in — Shared Seller Header
 * Renders a consistent top header bar across all seller pages.
 * Usage: Add <header class="seller-header" data-page-title="Dashboard"></header>
 * Optional: data-page-subtitle, data-page-action-label, data-page-action-href, data-page-action-onclick
 */
(function () {
    'use strict';

    function escapeHtml(str) {
        if (!str) return '';
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function buildSellerHeader(opts) {
        var title = escapeHtml(opts.title || 'Dashboard');
        var subtitle = opts.subtitle ? '<p style="color: var(--slate-500); font-size: 0.9rem;">' + escapeHtml(opts.subtitle) + '</p>' : '';
        var actionBtn = '';

        if (opts.actionLabel) {
            var actionIcon = opts.actionIcon || 'fas fa-plus';
            if (opts.actionHref) {
                actionBtn = '<a href="' + escapeHtml(opts.actionHref) + '" class="btn-add-product">' +
                    '<i class="' + escapeHtml(actionIcon) + '"></i>' +
                    '<span>' + escapeHtml(opts.actionLabel) + '</span></a>';
            } else if (opts.actionOnclick) {
                actionBtn = '<button class="btn-add-product" onclick="' + escapeHtml(opts.actionOnclick) + '">' +
                    '<i class="' + escapeHtml(actionIcon) + '"></i>' +
                    '<span>' + escapeHtml(opts.actionLabel) + '</span></button>';
            }
        }

        return '<div class="header-left">' +
            '<button class="header-btn" id="menuToggle" onclick="toggleSidebar()" style="display: none;">' +
            '<i class="fas fa-bars"></i></button>' +
            '<div><h1 class="page-title">' + title + '</h1>' + subtitle + '</div>' +
            '</div>' +
            '<div class="header-right">' +
            '<div class="notification-wrapper">' +
            '<button class="header-btn" id="notificationTrigger" title="Notifications">' +
            '<i class="fas fa-bell"></i>' +
            '<span class="notification-dot" id="notificationDot" style="display: none;"></span>' +
            '</button>' +
            '<div class="notification-panel" id="notificationPanel">' +
            '<div class="notification-panel-header">' +
            '<div><h3>Notifications</h3><p id="notificationSubtitle">Latest updates</p></div>' +
            '<div class="header-actions">' +
            '<button class="btn-mark-all-read" id="markAllRead" title="Mark all as read">Mark all read</button>' +
            '<button id="notificationRefresh" title="Refresh notifications"><i class="fas fa-rotate-right"></i></button>' +
            '</div></div>' +
            '<div class="notification-list" id="notificationList">' +
            '<div class="notification-empty"><i class="fas fa-bell-slash"></i><p>No notifications yet</p></div>' +
            '</div></div></div>' +
            actionBtn +
            '<div class="dropdown-wrapper">' +
            '<div class="seller-user-menu" onclick="toggleUserDropdown()">' +
            '<div class="seller-user-avatar" id="userAvatar" data-seller-avatar>S</div>' +
            '<div class="seller-user-info"><strong id="userName" data-seller-name>Loading...</strong></div>' +
            '</div>' +
            '<div class="user-dropdown" id="userDropdown">' +
            '<a href="/seller-settings.html"><i class="fas fa-cog"></i> Settings</a>' +
            '<a href="/shop.html" target="_blank"><i class="fas fa-external-link-alt"></i> View Shop</a>' +
            '<hr>' +
            '<a href="#" class="logout" onclick="handleLogout(event)"><i class="fas fa-sign-out-alt"></i> Sign Out</a>' +
            '</div></div></div>';
    }

    function initSellerHeader() {
        var header = document.querySelector('header.seller-header');
        if (!header || header.dataset.initialized === 'true') return;

        var opts = {
            title: header.getAttribute('data-page-title') || 'Dashboard',
            subtitle: header.getAttribute('data-page-subtitle') || '',
            actionLabel: header.getAttribute('data-page-action-label') || '',
            actionHref: header.getAttribute('data-page-action-href') || '',
            actionOnclick: header.getAttribute('data-page-action-onclick') || '',
            actionIcon: header.getAttribute('data-page-action-icon') || 'fas fa-plus'
        };

        header.innerHTML = buildSellerHeader(opts);
        header.dataset.initialized = 'true';
    }

    // User dropdown toggle
    window.toggleUserDropdown = function () {
        var dropdown = document.getElementById('userDropdown');
        if (dropdown) dropdown.classList.toggle('show');
    };

    // Close dropdown on outside click
    document.addEventListener('click', function (e) {
        var dropdown = document.getElementById('userDropdown');
        var userMenu = document.querySelector('.seller-user-menu');
        if (dropdown && !dropdown.contains(e.target) && userMenu && !userMenu.contains(e.target)) {
            dropdown.classList.remove('show');
        }
    });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSellerHeader);
    } else {
        initSellerHeader();
    }
})();

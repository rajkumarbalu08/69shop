/**
 * 69SHOP.IN - Enhanced Profile Features
 * Additional dashboard features and improved UI
 */

(function() {
    'use strict';

    const ProfileEnhancements = {
        /**
         * Initialize enhancements
         */
        init() {
            this.injectEnhancedStyles();
            this.enhanceDashboard();
            this.addQuickActions();
            this.addActivityFeed();
            this.addRewardsWidget();
            this.addRecentlyViewed();
            console.log('🏠 Profile Enhancements initialized');
        },

        /**
         * Inject enhanced styles
         */
        injectEnhancedStyles() {
            if (document.getElementById('profile-enhancement-styles')) return;

            const styles = document.createElement('style');
            styles.id = 'profile-enhancement-styles';
            styles.textContent = `
                /* Enhanced Stats Grid */
                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
                    gap: 20px;
                    margin-bottom: 30px;
                }

                .stat-card {
                    background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
                    border-radius: 16px;
                    padding: 24px;
                    border: 1px solid rgba(0, 0, 0, 0.05);
                    transition: all 0.3s ease;
                    position: relative;
                    overflow: hidden;
                }

                .stat-card::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 4px;
                    background: linear-gradient(90deg, var(--blue-primary), #00d4ff);
                }

                .stat-card:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 12px 40px rgba(0, 102, 255, 0.15);
                }

                .stat-card.highlight {
                    background: linear-gradient(135deg, #0066ff 0%, #00a3ff 100%);
                    color: white;
                }

                .stat-card.highlight::before {
                    background: rgba(255, 255, 255, 0.3);
                }

                .stat-card.highlight .stat-helper {
                    color: rgba(255, 255, 255, 0.8);
                }

                .stat-value {
                    font-size: 2rem;
                    font-weight: 700;
                    color: var(--primary-black);
                    margin-bottom: 4px;
                }

                .stat-card.highlight .stat-value {
                    color: white;
                }

                .stat-label {
                    font-size: 0.9rem;
                    color: var(--medium-grey);
                    font-weight: 500;
                }

                .stat-card.highlight .stat-label {
                    color: rgba(255, 255, 255, 0.9);
                }

                .stat-helper {
                    font-size: 0.75rem;
                    color: var(--medium-grey);
                    margin-top: 8px;
                }

                .stat-icon {
                    position: absolute;
                    top: 20px;
                    right: 20px;
                    width: 48px;
                    height: 48px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.2rem;
                }

                .stat-icon.orders { background: #EFF6FF; color: #3B82F6; }
                .stat-icon.wishlist { background: #FEF2F2; color: #EF4444; }
                .stat-icon.rewards { background: #FEF3C7; color: #D97706; }
                .stat-icon.addresses { background: #ECFDF5; color: #10B981; }

                /* Quick Actions Panel */
                .quick-actions-panel {
                    background: white;
                    border-radius: 16px;
                    padding: 24px;
                    margin-bottom: 24px;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
                }

                .quick-actions-panel h3 {
                    font-size: 1.1rem;
                    margin-bottom: 20px;
                    color: var(--primary-black);
                }

                .quick-actions-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
                    gap: 12px;
                }

                .quick-action-btn {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 10px;
                    padding: 20px 16px;
                    background: var(--light-grey);
                    border: none;
                    border-radius: 12px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    text-decoration: none;
                    color: var(--dark-grey);
                }

                .quick-action-btn:hover {
                    background: #E6F2FF;
                    color: var(--blue-primary);
                    transform: translateY(-2px);
                }

                .quick-action-btn i {
                    font-size: 1.5rem;
                }

                .quick-action-btn span {
                    font-size: 0.85rem;
                    font-weight: 600;
                }

                /* Activity Feed */
                .activity-feed {
                    background: white;
                    border-radius: 16px;
                    padding: 24px;
                    margin-bottom: 24px;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
                }

                .activity-feed h3 {
                    font-size: 1.1rem;
                    margin-bottom: 20px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }

                .activity-feed h3 .see-all {
                    font-size: 0.85rem;
                    color: var(--blue-primary);
                    text-decoration: none;
                    font-weight: 500;
                }

                .activity-list {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }

                .activity-item {
                    display: flex;
                    gap: 16px;
                    padding: 16px;
                    background: var(--light-grey);
                    border-radius: 12px;
                    transition: all 0.2s ease;
                }

                .activity-item:hover {
                    background: #f0f4f8;
                }

                .activity-icon {
                    width: 44px;
                    height: 44px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }

                .activity-icon.order { background: #DBEAFE; color: #2563EB; }
                .activity-icon.wishlist { background: #FEE2E2; color: #DC2626; }
                .activity-icon.review { background: #FEF3C7; color: #D97706; }
                .activity-icon.delivery { background: #D1FAE5; color: #059669; }

                .activity-content {
                    flex: 1;
                }

                .activity-title {
                    font-weight: 600;
                    color: var(--primary-black);
                    margin-bottom: 4px;
                }

                .activity-desc {
                    font-size: 0.85rem;
                    color: var(--medium-grey);
                }

                .activity-time {
                    font-size: 0.75rem;
                    color: #999;
                    white-space: nowrap;
                }

                /* Rewards Widget */
                .rewards-widget {
                    background: linear-gradient(135deg, #7C3AED 0%, #A855F7 100%);
                    border-radius: 16px;
                    padding: 24px;
                    color: white;
                    margin-bottom: 24px;
                    position: relative;
                    overflow: hidden;
                }

                .rewards-widget::before {
                    content: '';
                    position: absolute;
                    top: -50%;
                    right: -20%;
                    width: 200px;
                    height: 200px;
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 50%;
                }

                .rewards-header {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 20px;
                }

                .rewards-header i {
                    font-size: 1.5rem;
                    color: #FCD34D;
                }

                .rewards-header h3 {
                    font-size: 1.1rem;
                    margin: 0;
                }

                .rewards-points {
                    font-size: 2.5rem;
                    font-weight: 700;
                    margin-bottom: 8px;
                }

                .rewards-tier {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    background: rgba(255, 255, 255, 0.2);
                    padding: 6px 14px;
                    border-radius: 20px;
                    font-size: 0.85rem;
                    font-weight: 600;
                }

                .rewards-progress {
                    margin-top: 20px;
                }

                .rewards-progress-bar {
                    height: 8px;
                    background: rgba(255, 255, 255, 0.3);
                    border-radius: 4px;
                    overflow: hidden;
                }

                .rewards-progress-fill {
                    height: 100%;
                    background: #FCD34D;
                    border-radius: 4px;
                    transition: width 0.5s ease;
                }

                .rewards-progress-label {
                    display: flex;
                    justify-content: space-between;
                    font-size: 0.75rem;
                    margin-top: 8px;
                    opacity: 0.8;
                }

                /* Recently Viewed */
                .recently-viewed {
                    background: white;
                    border-radius: 16px;
                    padding: 24px;
                    margin-bottom: 24px;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
                }

                .recently-viewed h3 {
                    font-size: 1.1rem;
                    margin-bottom: 20px;
                }

                .viewed-items-scroll {
                    display: flex;
                    gap: 16px;
                    overflow-x: auto;
                    padding-bottom: 10px;
                    scrollbar-width: thin;
                }

                .viewed-item {
                    flex: 0 0 140px;
                    text-decoration: none;
                    color: inherit;
                }

                .viewed-item-image {
                    width: 140px;
                    height: 140px;
                    border-radius: 12px;
                    overflow: hidden;
                    background: var(--light-grey);
                    margin-bottom: 10px;
                }

                .viewed-item-image img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    transition: transform 0.3s ease;
                }

                .viewed-item:hover .viewed-item-image img {
                    transform: scale(1.1);
                }

                .viewed-item-name {
                    font-size: 0.85rem;
                    font-weight: 500;
                    color: var(--primary-black);
                    margin-bottom: 4px;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .viewed-item-price {
                    font-size: 0.9rem;
                    font-weight: 700;
                    color: var(--blue-primary);
                }

                /* Order Cards */
                .order-card {
                    background: white;
                    border: 1px solid #e5e7eb;
                    border-radius: 16px;
                    padding: 20px;
                    margin-bottom: 16px;
                    transition: all 0.2s ease;
                }

                .order-card:hover {
                    border-color: var(--blue-primary);
                    box-shadow: 0 4px 20px rgba(0, 102, 255, 0.1);
                }

                .order-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 16px;
                    padding-bottom: 16px;
                    border-bottom: 1px solid #f3f4f6;
                }

                .order-id {
                    font-weight: 700;
                    color: var(--primary-black);
                }

                .order-date {
                    font-size: 0.85rem;
                    color: var(--medium-grey);
                    margin-top: 4px;
                }

                .order-status {
                    padding: 6px 14px;
                    border-radius: 20px;
                    font-size: 0.8rem;
                    font-weight: 600;
                }

                .order-status.pending { background: #FEF3C7; color: #D97706; }
                .order-status.confirmed { background: #DBEAFE; color: #2563EB; }
                .order-status.shipped { background: #E0E7FF; color: #4F46E5; }
                .order-status.delivered { background: #D1FAE5; color: #059669; }
                .order-status.cancelled { background: #FEE2E2; color: #DC2626; }

                .order-items {
                    display: flex;
                    gap: 12px;
                    flex-wrap: wrap;
                    margin-bottom: 16px;
                }

                .order-item-thumb {
                    width: 60px;
                    height: 60px;
                    border-radius: 10px;
                    overflow: hidden;
                    background: var(--light-grey);
                }

                .order-item-thumb img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .order-footer {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding-top: 16px;
                    border-top: 1px solid #f3f4f6;
                }

                .order-total {
                    font-weight: 700;
                    font-size: 1.1rem;
                    color: var(--primary-black);
                }

                .order-actions {
                    display: flex;
                    gap: 10px;
                }

                .order-actions button,
                .order-actions a {
                    padding: 10px 16px;
                    border-radius: 10px;
                    font-size: 0.85rem;
                    font-weight: 600;
                    cursor: pointer;
                    text-decoration: none;
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    transition: all 0.2s ease;
                }

                .btn-track {
                    background: var(--blue-primary);
                    color: white;
                    border: none;
                }

                .btn-track:hover {
                    background: #0052cc;
                }

                .btn-reorder {
                    background: var(--light-grey);
                    color: var(--dark-grey);
                    border: none;
                }

                .btn-reorder:hover {
                    background: #e5e7eb;
                }

                /* Empty States */
                .empty-state {
                    text-align: center;
                    padding: 60px 20px;
                }

                .empty-state-icon {
                    width: 100px;
                    height: 100px;
                    background: var(--light-grey);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 24px;
                    font-size: 2.5rem;
                    color: #999;
                }

                .empty-state h4 {
                    font-size: 1.25rem;
                    margin-bottom: 8px;
                    color: var(--primary-black);
                }

                .empty-state p {
                    color: var(--medium-grey);
                    margin-bottom: 24px;
                }

                .empty-state .btn-action {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    padding: 14px 28px;
                    background: var(--blue-primary);
                    color: white;
                    border: none;
                    border-radius: 12px;
                    font-weight: 600;
                    cursor: pointer;
                    text-decoration: none;
                    transition: all 0.2s ease;
                }

                .empty-state .btn-action:hover {
                    background: #0052cc;
                    transform: translateY(-2px);
                }

                /* Sidebar Enhancement */
                .profile-nav a {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 14px 18px;
                    border-radius: 12px;
                    text-decoration: none;
                    color: var(--dark-grey);
                    font-weight: 500;
                    transition: all 0.2s ease;
                    position: relative;
                }

                .profile-nav a:hover {
                    background: var(--light-grey);
                    color: var(--blue-primary);
                }

                .profile-nav a.active {
                    background: linear-gradient(135deg, #E6F2FF 0%, #F0F7FF 100%);
                    color: var(--blue-primary);
                }

                .profile-nav a.active::before {
                    content: '';
                    position: absolute;
                    left: 0;
                    top: 50%;
                    transform: translateY(-50%);
                    width: 4px;
                    height: 24px;
                    background: var(--blue-primary);
                    border-radius: 0 4px 4px 0;
                }

                .profile-nav a i {
                    width: 24px;
                    text-align: center;
                    font-size: 1rem;
                }

                /* Notification Badge */
                .nav-badge {
                    margin-left: auto;
                    background: #EF4444;
                    color: white;
                    font-size: 0.7rem;
                    font-weight: 700;
                    padding: 3px 8px;
                    border-radius: 10px;
                    min-width: 20px;
                    text-align: center;
                }

                /* Mobile Responsive */
                @media (max-width: 900px) {
                    .profile-shell {
                        grid-template-columns: 1fr;
                    }

                    .profile-sidebar {
                        order: 2;
                    }

                    .profile-content {
                        order: 1;
                    }

                    .stats-grid {
                        grid-template-columns: repeat(2, 1fr);
                    }

                    .quick-actions-grid {
                        grid-template-columns: repeat(3, 1fr);
                    }
                }

                @media (max-width: 600px) {
                    .stats-grid {
                        grid-template-columns: 1fr;
                    }

                    .quick-actions-grid {
                        grid-template-columns: repeat(2, 1fr);
                    }

                    .order-header {
                        flex-direction: column;
                        gap: 12px;
                    }

                    .order-footer {
                        flex-direction: column;
                        gap: 16px;
                    }

                    .order-actions {
                        width: 100%;
                    }

                    .order-actions button,
                    .order-actions a {
                        flex: 1;
                        justify-content: center;
                    }
                }
            `;
            document.head.appendChild(styles);
        },

        /**
         * Enhance dashboard with better stats
         */
        enhanceDashboard() {
            const statsGrid = document.getElementById('statsGrid');
            if (!statsGrid) return;

            // Watch for stats changes and enhance them
            const observer = new MutationObserver(() => {
                const statCards = statsGrid.querySelectorAll('.stat');
                statCards.forEach((card, index) => {
                    if (card.classList.contains('enhanced')) return;
                    card.classList.add('enhanced', 'stat-card');
                    
                    // Add icon based on content
                    const label = card.querySelector('.stat-label')?.textContent?.toLowerCase() || '';
                    let iconClass = 'fas fa-chart-line';
                    let iconType = 'orders';
                    
                    if (label.includes('order')) {
                        iconClass = 'fas fa-shopping-bag';
                        iconType = 'orders';
                    } else if (label.includes('wishlist')) {
                        iconClass = 'fas fa-heart';
                        iconType = 'wishlist';
                    } else if (label.includes('reward') || label.includes('point')) {
                        iconClass = 'fas fa-star';
                        iconType = 'rewards';
                    } else if (label.includes('address')) {
                        iconClass = 'fas fa-map-marker-alt';
                        iconType = 'addresses';
                    }
                    
                    const icon = document.createElement('div');
                    icon.className = `stat-icon ${iconType}`;
                    icon.innerHTML = `<i class="${iconClass}"></i>`;
                    card.appendChild(icon);
                    
                    // Highlight first card
                    if (index === 0) {
                        card.classList.add('highlight');
                    }
                });
            });

            observer.observe(statsGrid, { childList: true, subtree: true });
        },

        /**
         * Add quick actions panel
         */
        addQuickActions() {
            const sectionBody = document.getElementById('sectionBody');
            if (!sectionBody) return;

            // Watch for dashboard section
            const observer = new MutationObserver(() => {
                const currentSection = new URLSearchParams(window.location.search).get('section') || 'dashboard';
                if (currentSection !== 'dashboard') return;
                if (document.querySelector('.quick-actions-panel')) return;

                const panel = document.createElement('div');
                panel.className = 'quick-actions-panel';
                panel.innerHTML = `
                    <h3>Quick Actions</h3>
                    <div class="quick-actions-grid">
                        <a href="/shop.html" class="quick-action-btn">
                            <i class="fas fa-store"></i>
                            <span>Shop Now</span>
                        </a>
                        <a href="?section=orders" class="quick-action-btn">
                            <i class="fas fa-box"></i>
                            <span>Track Order</span>
                        </a>
                        <a href="?section=wishlist" class="quick-action-btn">
                            <i class="fas fa-heart"></i>
                            <span>Wishlist</span>
                        </a>
                        <a href="?section=cart" class="quick-action-btn">
                            <i class="fas fa-shopping-cart"></i>
                            <span>My Cart</span>
                        </a>
                        <a href="?section=addresses" class="quick-action-btn">
                            <i class="fas fa-map-marker-alt"></i>
                            <span>Addresses</span>
                        </a>
                        <a href="?section=settings" class="quick-action-btn">
                            <i class="fas fa-cog"></i>
                            <span>Settings</span>
                        </a>
                    </div>
                `;
                sectionBody.insertBefore(panel, sectionBody.firstChild);
            });

            observer.observe(sectionBody, { childList: true });
        },

        /**
         * Add activity feed
         */
        addActivityFeed() {
            const sectionBody = document.getElementById('sectionBody');
            if (!sectionBody) return;

            // This will be populated with real data from Firestore
            // For now, show sample activities
        },

        /**
         * Add rewards widget
         */
        addRewardsWidget() {
            const sidebar = document.querySelector('.profile-sidebar');
            if (!sidebar || document.querySelector('.rewards-widget')) return;

            const nav = sidebar.querySelector('.profile-nav');
            if (!nav) return;

            const widget = document.createElement('div');
            widget.className = 'rewards-widget';
            widget.innerHTML = `
                <div class="rewards-header">
                    <i class="fas fa-crown"></i>
                    <h3>Rewards</h3>
                </div>
                <div class="rewards-points" id="rewardsPoints">0</div>
                <div class="rewards-tier">
                    <i class="fas fa-medal"></i>
                    <span id="rewardsTier">Bronze Member</span>
                </div>
                <div class="rewards-progress">
                    <div class="rewards-progress-bar">
                        <div class="rewards-progress-fill" id="rewardsProgress" style="width: 0%"></div>
                    </div>
                    <div class="rewards-progress-label">
                        <span>0 pts</span>
                        <span>500 pts to Silver</span>
                    </div>
                </div>
            `;
            sidebar.insertBefore(widget, nav);

            // Load rewards from localStorage or Firestore
            this.loadRewards();
        },

        /**
         * Load rewards data
         */
        loadRewards() {
            const points = parseInt(localStorage.getItem('69shop_rewards_points') || '0');
            let tier = 'Bronze';
            let progress = 0;
            let nextTier = 'Silver';
            let nextPoints = 500;

            if (points >= 2000) {
                tier = 'Platinum';
                progress = 100;
                nextTier = 'Max';
                nextPoints = 2000;
            } else if (points >= 1000) {
                tier = 'Gold';
                progress = ((points - 1000) / 1000) * 100;
                nextTier = 'Platinum';
                nextPoints = 2000;
            } else if (points >= 500) {
                tier = 'Silver';
                progress = ((points - 500) / 500) * 100;
                nextTier = 'Gold';
                nextPoints = 1000;
            } else {
                progress = (points / 500) * 100;
            }

            const pointsEl = document.getElementById('rewardsPoints');
            const tierEl = document.getElementById('rewardsTier');
            const progressEl = document.getElementById('rewardsProgress');

            if (pointsEl) pointsEl.textContent = points.toLocaleString('en-IN');
            if (tierEl) tierEl.textContent = `${tier} Member`;
            if (progressEl) progressEl.style.width = `${progress}%`;
        },

        /**
         * Add recently viewed products
         */
        addRecentlyViewed() {
            // Load from localStorage
            const viewed = JSON.parse(localStorage.getItem('69shop_recently_viewed') || '[]');
            if (!viewed.length) return;

            const sectionBody = document.getElementById('sectionBody');
            if (!sectionBody) return;

            // Only show on dashboard
            const currentSection = new URLSearchParams(window.location.search).get('section') || 'dashboard';
            if (currentSection !== 'dashboard') return;

            const recentlyViewed = document.createElement('div');
            recentlyViewed.className = 'recently-viewed';
            recentlyViewed.innerHTML = `
                <h3>Recently Viewed</h3>
                <div class="viewed-items-scroll">
                    ${viewed.slice(0, 8).map(item => `
                        <a href="/shop.html?product=${item.id}" class="viewed-item">
                            <div class="viewed-item-image">
                                <img src="${item.image || '/Logo/69shopc.png'}" alt="${item.name}" loading="lazy">
                            </div>
                            <div class="viewed-item-name">${item.name}</div>
                            <div class="viewed-item-price">₹${item.price?.toLocaleString('en-IN') || '0'}</div>
                        </a>
                    `).join('')}
                </div>
            `;
            sectionBody.appendChild(recentlyViewed);
        }
    };

    // Initialize on DOM ready
    document.addEventListener('DOMContentLoaded', () => {
        // Wait for profile to load
        setTimeout(() => {
            ProfileEnhancements.init();
        }, 500);
    });

    // Expose globally
    window.ProfileEnhancements = ProfileEnhancements;

})();

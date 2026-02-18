/**
 * 69Shop.in Premium Shop Features
 * Live notifications, mega menu, flash sale, quick view, personalization
 */

// =============================================
// LIVE PURCHASE NOTIFICATIONS
// =============================================
class LiveNotifications {
    constructor() {
        this.enabled = true;
        this.interval = null;
        this.notificationQueue = [];
        this.isShowing = false;
        this.cities = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad', 'Pune', 'Ahmedabad', 'Jaipur', 'Lucknow', 'Chandigarh', 'Kochi', 'Indore', 'Bhopal', 'Nagpur'];
        this.names = ['Rahul', 'Priya', 'Amit', 'Sneha', 'Vikram', 'Anjali', 'Rajesh', 'Neha', 'Arun', 'Kavita', 'Suresh', 'Deepa', 'Manish', 'Pooja', 'Sanjay'];
        this.init();
    }

    init() {
        this.createNotificationElement();
        this.startNotifications();
    }

    createNotificationElement() {
        const notification = document.createElement('div');
        notification.className = 'live-notification';
        notification.id = 'liveNotification';
        notification.innerHTML = `
            <button class="live-notification-close" onclick="liveNotifications.hideNotification()">
                <i class="fas fa-times"></i>
            </button>
            <img class="live-notification-image" id="liveNotificationImage" src="" alt="Product">
            <div class="live-notification-content">
                <p class="live-notification-title"><strong id="liveNotificationName">Someone</strong> from <span id="liveNotificationCity">Mumbai</span> just purchased</p>
                <p class="live-notification-product" id="liveNotificationProduct">Product Name</p>
                <p class="live-notification-time" id="liveNotificationTime">2 minutes ago</p>
            </div>
        `;
        document.body.appendChild(notification);
    }

    startNotifications() {
        // Show first notification after 8 seconds
        setTimeout(() => {
            if (this.enabled) this.showRandomNotification();
        }, 8000);

        // Then show every 25-45 seconds
        this.interval = setInterval(() => {
            if (this.enabled && !this.isShowing) {
                this.showRandomNotification();
            }
        }, this.randomBetween(25000, 45000));
    }

    showRandomNotification() {
        const products = window.productsData || [];
        if (products.length === 0) return;

        const product = products[Math.floor(Math.random() * products.length)];
        const city = this.cities[Math.floor(Math.random() * this.cities.length)];
        const name = this.names[Math.floor(Math.random() * this.names.length)];
        const time = this.randomBetween(1, 15);

        this.showNotification({
            name: name,
            city: city,
            product: product.name,
            image: product.image,
            time: `${time} minute${time > 1 ? 's' : ''} ago`
        });
    }

    showNotification(data) {
        const notification = document.getElementById('liveNotification');
        if (!notification) return;

        document.getElementById('liveNotificationName').textContent = data.name;
        document.getElementById('liveNotificationCity').textContent = data.city;
        document.getElementById('liveNotificationProduct').textContent = data.product;
        document.getElementById('liveNotificationImage').src = data.image;
        document.getElementById('liveNotificationTime').textContent = data.time;

        this.isShowing = true;
        notification.classList.add('show');

        // Auto-hide after 6 seconds
        setTimeout(() => {
            this.hideNotification();
        }, 6000);
    }

    hideNotification() {
        const notification = document.getElementById('liveNotification');
        if (notification) {
            notification.classList.remove('show');
            this.isShowing = false;
        }
    }

    randomBetween(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    toggle(enabled) {
        this.enabled = enabled;
        if (!enabled) {
            this.hideNotification();
        }
    }
}

// =============================================
// FLASH SALE COUNTDOWN
// =============================================
class FlashSaleCountdown {
    constructor() {
        this.endTime = this.getEndTime();
        this.init();
    }

    getEndTime() {
        // Flash sale ends at midnight or in 6 hours, whichever is sooner
        const now = new Date();
        const midnight = new Date(now);
        midnight.setHours(24, 0, 0, 0);
        
        const sixHours = new Date(now.getTime() + 6 * 60 * 60 * 1000);
        
        return midnight < sixHours ? midnight : sixHours;
    }

    init() {
        this.updateCountdown();
        setInterval(() => this.updateCountdown(), 1000);
    }

    updateCountdown() {
        const now = new Date().getTime();
        const distance = this.endTime.getTime() - now;

        if (distance < 0) {
            // Reset for next day
            this.endTime = this.getEndTime();
            return;
        }

        const hours = Math.floor(distance / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        const hoursEl = document.getElementById('flashSaleHours');
        const minutesEl = document.getElementById('flashSaleMinutes');
        const secondsEl = document.getElementById('flashSaleSeconds');

        if (hoursEl) hoursEl.textContent = String(hours).padStart(2, '0');
        if (minutesEl) minutesEl.textContent = String(minutes).padStart(2, '0');
        if (secondsEl) secondsEl.textContent = String(seconds).padStart(2, '0');
    }
}

// =============================================
// MEGA MENU
// =============================================
class MegaMenu {
    constructor() {
        this.activeCategory = null;
        this.menuData = {
            electronics: {
                icon: 'fas fa-laptop',
                name: 'Electronics',
                subcategories: ['Smartphones', 'Laptops', 'Audio', 'Cameras', 'Accessories']
            },
            fashion: {
                icon: 'fas fa-tshirt',
                name: 'Fashion',
                subcategories: ['Men', 'Women', 'Kids', 'Footwear', 'Accessories']
            },
            home: {
                icon: 'fas fa-couch',
                name: 'Home & Living',
                subcategories: ['Furniture', 'Decor', 'Kitchen', 'Bedding', 'Storage']
            },
            beauty: {
                icon: 'fas fa-spa',
                name: 'Beauty',
                subcategories: ['Skincare', 'Makeup', 'Haircare', 'Fragrances', 'Wellness']
            },
            sports: {
                icon: 'fas fa-running',
                name: 'Sports',
                subcategories: ['Fitness', 'Outdoor', 'Team Sports', 'Cycling', 'Swimming']
            }
        };
    }

    show(category) {
        this.activeCategory = category;
        const menu = document.getElementById('megaMenu');
        if (menu) {
            this.renderProducts(category);
            menu.classList.add('active');
        }
    }

    hide() {
        const menu = document.getElementById('megaMenu');
        if (menu) {
            menu.classList.remove('active');
        }
        this.activeCategory = null;
    }

    renderProducts(category) {
        const productsContainer = document.getElementById('megaMenuProducts');
        if (!productsContainer) return;

        const products = (window.productsData || [])
            .filter(p => p.category?.toLowerCase().includes(category.toLowerCase()))
            .slice(0, 6);

        if (products.length === 0) {
            productsContainer.innerHTML = '<p style="color: #718096; text-align: center; grid-column: 1/-1;">No products available</p>';
            return;
        }

        productsContainer.innerHTML = products.map(p => `
            <a href="/product.html?id=${p.id}" class="mega-menu-product">
                <img src="${p.image}" alt="${p.name}" onerror="this.src='/Logo/placeholder.svg'">
                <span class="mega-menu-product-name">${p.name}</span>
                <span class="mega-menu-product-price">₹${p.price.toLocaleString()}</span>
            </a>
        `).join('');
    }
}

// =============================================
// QUICK VIEW MODAL
// =============================================
class QuickViewModal {
    constructor() {
        this.currentProduct = null;
        this.quantity = 1;
    }

    open(productId) {
        const products = window.productsData || [];
        const product = products.find(p => p.id === productId);
        if (!product) return;

        this.currentProduct = product;
        this.quantity = 1;
        this.render(product);

        document.getElementById('quickViewOverlay')?.classList.add('active');
        document.getElementById('quickViewModal')?.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    close() {
        document.getElementById('quickViewOverlay')?.classList.remove('active');
        document.getElementById('quickViewModal')?.classList.remove('active');
        document.body.style.overflow = '';
        this.currentProduct = null;
    }

    render(product) {
        const modal = document.getElementById('quickViewModal');
        if (!modal) return;

        const originalPrice = Math.round(product.price * 1.3);
        const discount = Math.round((1 - product.price / originalPrice) * 100);
        const stars = '★'.repeat(Math.floor(product.rating)) + '☆'.repeat(5 - Math.floor(product.rating));

        modal.innerHTML = `
            <button class="quick-view-close" onclick="quickViewModal.close()">
                <i class="fas fa-times"></i>
            </button>
            <div class="quick-view-gallery">
                <img src="${product.image}" alt="${product.name}" class="quick-view-main-image" id="quickViewMainImage" onerror="this.src='/Logo/placeholder.svg'">
                <div class="quick-view-thumbnails">
                    <img src="${product.image}" class="quick-view-thumb active" onclick="quickViewModal.setImage(this.src)">
                </div>
            </div>
            <div class="quick-view-details">
                <span class="quick-view-brand">${product.brand || product.seller || '69Shop'}</span>
                <h2 class="quick-view-title">${product.name}</h2>
                <div class="quick-view-rating">
                    <span class="quick-view-stars">${stars}</span>
                    <span class="quick-view-reviews">${product.rating} (${Math.floor(Math.random() * 500) + 50} reviews)</span>
                </div>
                <div class="quick-view-price">
                    <span class="quick-view-current-price">₹${product.price.toLocaleString()}</span>
                    <span class="quick-view-original-price">₹${originalPrice.toLocaleString()}</span>
                    <span class="quick-view-discount">${discount}% OFF</span>
                </div>
                <p class="quick-view-description">${product.description || 'Experience premium quality with this carefully selected product. Perfect for everyday use with exceptional durability and style.'}</p>
                <div class="quick-view-quantity">
                    <span class="quick-view-option-label">Quantity:</span>
                    <div class="quantity-controls">
                        <button class="quantity-btn" onclick="quickViewModal.updateQuantity(-1)">−</button>
                        <input type="text" class="quantity-value" id="quickViewQuantity" value="1" readonly>
                        <button class="quantity-btn" onclick="quickViewModal.updateQuantity(1)">+</button>
                    </div>
                </div>
                <div class="quick-view-actions">
                    <button class="quick-view-add-cart" onclick="quickViewModal.addToCart()">
                        <i class="fas fa-shopping-cart"></i>
                        Add to Cart
                    </button>
                    <button class="quick-view-wishlist" onclick="quickViewModal.toggleWishlist()">
                        <i class="fas fa-heart"></i>
                    </button>
                </div>
            </div>
        `;
    }

    setImage(src) {
        const mainImage = document.getElementById('quickViewMainImage');
        if (mainImage) mainImage.src = src;
        
        document.querySelectorAll('.quick-view-thumb').forEach(thumb => {
            thumb.classList.toggle('active', thumb.src === src);
        });
    }

    updateQuantity(delta) {
        this.quantity = Math.max(1, Math.min(10, this.quantity + delta));
        const input = document.getElementById('quickViewQuantity');
        if (input) input.value = this.quantity;
    }

    addToCart() {
        if (!this.currentProduct) return;
        
        // Call existing addToCart function if available
        if (typeof window.addToCart === 'function') {
            for (let i = 0; i < this.quantity; i++) {
                window.addToCart(this.currentProduct);
            }
        } else {
            // Fallback: add to localStorage cart
            const cart = JSON.parse(localStorage.getItem('cart') || '[]');
            const existingIndex = cart.findIndex(item => item.id === this.currentProduct.id);
            
            if (existingIndex > -1) {
                cart[existingIndex].quantity = (cart[existingIndex].quantity || 1) + this.quantity;
            } else {
                cart.push({ ...this.currentProduct, quantity: this.quantity });
            }
            
            localStorage.setItem('cart', JSON.stringify(cart));
            
            // Update cart count
            const countEl = document.getElementById('cartCount');
            if (countEl) {
                const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
                countEl.textContent = totalItems;
            }
        }
        
        this.close();
        showNotification?.('Added to cart!', 'success') || alert('Added to cart!');
    }

    toggleWishlist() {
        if (!this.currentProduct) return;
        
        const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
        const index = wishlist.indexOf(this.currentProduct.id);
        
        if (index > -1) {
            wishlist.splice(index, 1);
        } else {
            wishlist.push(this.currentProduct.id);
        }
        
        localStorage.setItem('wishlist', JSON.stringify(wishlist));
        
        const btn = document.querySelector('.quick-view-wishlist');
        if (btn) btn.classList.toggle('active', index === -1);
    }
}

// =============================================
// RECENTLY VIEWED PRODUCTS
// =============================================
class RecentlyViewed {
    constructor() {
        this.storageKey = 'recentlyViewed';
        this.maxItems = 10;
    }

    add(productId) {
        const items = this.get();
        const filtered = items.filter(id => id !== productId);
        filtered.unshift(productId);
        localStorage.setItem(this.storageKey, JSON.stringify(filtered.slice(0, this.maxItems)));
    }

    get() {
        return JSON.parse(localStorage.getItem(this.storageKey) || '[]');
    }

    clear() {
        localStorage.removeItem(this.storageKey);
        this.render();
    }

    render() {
        const container = document.getElementById('recentlyViewedGrid');
        if (!container) return;

        const productIds = this.get();
        const products = window.productsData || [];
        const recentProducts = productIds
            .map(id => products.find(p => p.id === id))
            .filter(Boolean);

        if (recentProducts.length === 0) {
            container.innerHTML = '<p style="color: #718096; padding: 20px;">No recently viewed products</p>';
            return;
        }

        container.innerHTML = recentProducts.map(p => `
            <a href="/product.html?id=${p.id}" class="recently-viewed-item">
                <img src="${p.image}" alt="${p.name}" onerror="this.src='/Logo/placeholder.svg'">
                <p class="recently-viewed-item-name">${p.name}</p>
                <p class="recently-viewed-item-price">₹${p.price.toLocaleString()}</p>
            </a>
        `).join('');
    }
}

// =============================================
// SCROLL ANIMATIONS
// =============================================
class ScrollAnimations {
    constructor() {
        this.init();
    }

    init() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

        document.querySelectorAll('.animate-on-scroll').forEach(el => {
            observer.observe(el);
        });
    }
}

// =============================================
// FLOATING HEADER
// =============================================
class FloatingHeader {
    constructor() {
        this.header = document.querySelector('.header');
        this.lastScrollY = 0;
        this.init();
    }

    init() {
        if (!this.header) return;
        
        window.addEventListener('scroll', () => {
            const scrollY = window.scrollY;
            
            // Add floating class when scrolled
            this.header.classList.toggle('floating', scrollY > 50);
            
            // Add compact class when scrolled more
            this.header.classList.toggle('compact', scrollY > 150);
            
            this.lastScrollY = scrollY;
        });
    }
}

// =============================================
// PERSONALIZED GREETING
// =============================================
function getPersonalizedGreeting() {
    const hour = new Date().getHours();
    const userName = localStorage.getItem('userName') || 'there';
    
    let greeting = '';
    if (hour < 12) {
        greeting = 'Good morning';
    } else if (hour < 17) {
        greeting = 'Good afternoon';
    } else {
        greeting = 'Good evening';
    }
    
    return `${greeting}, ${userName}! `;
}

// =============================================
// TRUST BADGES ANIMATION
// =============================================
function initTrustBadges() {
    const track = document.querySelector('.trust-badges-track');
    if (!track) return;

    // Duplicate content for seamless loop
    track.innerHTML += track.innerHTML;
}

// =============================================
// INITIALIZE ALL PREMIUM FEATURES
// =============================================
let liveNotifications, flashSaleCountdown, megaMenu, quickViewModal, recentlyViewed, scrollAnimations, floatingHeader;

function initPremiumFeatures() {
    // Initialize all modules
    // liveNotifications = new LiveNotifications(); // Disabled - can be perceived as spam
    flashSaleCountdown = new FlashSaleCountdown();
    megaMenu = new MegaMenu();
    quickViewModal = new QuickViewModal();
    recentlyViewed = new RecentlyViewed();
    scrollAnimations = new ScrollAnimations();
    floatingHeader = new FloatingHeader();
    
    // Initialize trust badges
    initTrustBadges();
    
    // Render recently viewed
    recentlyViewed.render();
    
    // Update personalized greeting
    const greetingEl = document.getElementById('personalizedGreeting');
    if (greetingEl) {
        greetingEl.textContent = getPersonalizedGreeting();
    }
    
    // Setup quick view overlay click to close
    document.getElementById('quickViewOverlay')?.addEventListener('click', () => {
        quickViewModal.close();
    });
    
    console.log('✨ Premium shop features initialized');
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPremiumFeatures);
} else {
    initPremiumFeatures();
}

// Export for global access
window.liveNotifications = liveNotifications;
window.megaMenu = megaMenu;
window.quickViewModal = quickViewModal;
window.recentlyViewed = recentlyViewed;

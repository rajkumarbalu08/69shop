class EnhancedProductManager {
    constructor() {
        this.db = (window.firebaseReady && firebase.firestore) ? firebase.firestore() : null;
        this.products = [];
        this.filteredProducts = [];
        this.currentFilters = {
            category: 'all',
            maxPrice: 50000,
            sortBy: 'featured',
            seller: 'all',
            delivery: 'any',
            searchTerm: ''
        };
        this.viewMode = 'grid'; // 'grid' or 'list'
        this.wishlist = new Set();
        this.cart = [];
        this.compareList = []; // Products for comparison (max 4)
        this.maxCompareItems = 4;
        this.filterBar = null;
        this.productUpdateCallbacks = [];
        this.pageSize = 20;
        this.currentPage = 1;
        this.isLoadingMore = false;
        this.hasMoreProducts = false;
        this._scrollObserver = null;
        this.readyPromise = this.initialize();
    }

    async initialize() {
        console.log('EnhancedProductManager initialize started');
        try {
            await this.loadProducts();
            console.log('Products loaded:', this.products.length);
            this.loadCartFromStorage();
            this.loadWishlistFromStorage();
            this.updateCartDisplay();
            this.renderProducts();
            console.log('Products rendered');
            this.setupEventListeners();
            this.initializeFilterBar();
            this.notifyProductsUpdated();
        } catch (error) {
            console.error('Error in initialize:', error);
            // Still try to render products even if there was an error
            const loadingState = document.getElementById('loadingState');
            if (loadingState) loadingState.style.display = 'none';
        }
    }

    notifyProductsUpdated() {
        const snapshot = this.products.slice();
        this.productUpdateCallbacks.forEach((callback) => {
            try {
                callback(snapshot);
            } catch (error) {
                console.warn('Product update callback failed', error);
            }
        });
    }

    onProductsUpdated(callback) {
        if (typeof callback !== 'function') {
            return;
        }
        this.productUpdateCallbacks.push(callback);
        if (this.products.length) {
            callback(this.products.slice());
        }
    }

    initializeFilterBar() {
        this.filterBar = document.getElementById('filterBar');
        this.updateFilterBar();
        
        // Listen for scroll to show/hide filter bar
        let lastScrollTop = 0;
        window.addEventListener('scroll', () => {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            
            // Show filter bar when scrolled past shop content
            const shopContent = document.querySelector('.shop-content');
            if (shopContent) {
                const shopContentTop = shopContent.offsetTop - 100;
                
                if (scrollTop > shopContentTop) {
                    this.filterBar.classList.add('active');
                    
                    // Hide filter bar on scroll down, show on scroll up
                    if (scrollTop > lastScrollTop) {
                        this.filterBar.style.transform = 'translateY(-100%)';
                    } else {
                        this.filterBar.style.transform = 'translateY(0)';
                    }
                } else {
                    this.filterBar.classList.remove('active');
                }
            }
            
            lastScrollTop = scrollTop;
        });
    }

    updateFilterBar() {
        // Simplified: Don't show filter tags in bar, just show results directly
        // The filter bar is now hidden - users can use sidebar filters
        const activeFilters = document.getElementById('activeFilters');
        if (activeFilters) {
            activeFilters.innerHTML = '';
        }
        // Keep filter bar hidden - we show results directly without displaying filters
        this.filterBar?.classList.remove('active');
    }

    removeFilter(filterType) {
        switch (filterType) {
            case 'category':
                this.currentFilters.category = 'all';
                this.resetCategoryButtons();
                break;
            case 'price':
                this.currentFilters.maxPrice = 50000;
                this.resetPriceSlider();
                break;
            case 'seller':
                this.currentFilters.seller = 'all';
                this.resetSellerButtons();
                break;
            case 'delivery':
                this.currentFilters.delivery = 'any';
                this.resetDeliveryButtons();
                break;
            case 'search':
                this.currentFilters.searchTerm = '';
                break;
        }
        
        this.renderProducts();
        this.updateFilterBar();
    }

    resetCategoryButtons() {
        document.querySelectorAll('#categoryFilters .filter-option').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.category === 'all') {
                btn.classList.add('active');
            }
        });
    }

    resetPriceSlider() {
        const priceRange = document.getElementById('priceRange');
        const maxPriceValue = document.getElementById('maxPriceValue');
        
        if (priceRange) priceRange.value = 50000;
        if (maxPriceValue) maxPriceValue.textContent = '₹50,000';
    }

    resetSellerButtons() {
        document.querySelectorAll('#sellerFilters .filter-option').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.seller === 'all') {
                btn.classList.add('active');
            }
        });
    }

    resetDeliveryButtons() {
        document.querySelectorAll('#deliveryFilters .filter-option').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.delivery === 'any') {
                btn.classList.add('active');
            }
        });
    }

    async loadProducts() {
        console.log('loadProducts called');
        console.log('window.productsData exists:', !!window.productsData);
        console.log('window.productsData is array:', Array.isArray(window.productsData));
        console.log('window.productsData length:', window.productsData?.length || 0);
        
        // Start with static catalog for fast initial load
        const fallbackImage = 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=400&q=80';
        let staticProducts = [];
        
        if (Array.isArray(window.productsData) && window.productsData.length) {
            staticProducts = window.productsData.map((p, idx) => ({
                id: p.id || `p-${idx + 1}`,
                name: p.name || 'Featured product',
                description: p.description || 'Curated pick from our catalog.',
                price: Number(p.price) || 0,
                category: p.category || 'general',
                image: p.image || fallbackImage,
                seller: p.seller || '69Shop Seller',
                sellerId: p.sellerId || '69shop-platform',
                rating: Number(p.rating) || 4.4,
                stock: p.stock || 50,
                sellerType: p.sellerType || 'verified',
                isVerified: p.isVerified !== undefined ? p.isVerified : true,
                deliveryTime: p.deliveryTime || '2day',
                createdAt: p.createdAt || new Date(Date.now() - idx * 86400000).toISOString()
            }));
            console.log('Loaded', staticProducts.length, 'products from static catalog');
        }
        
        // Also fetch products from Firestore (seller-uploaded products)
        let firestoreProducts = [];
        if (this.db) {
            try {
                const productsSnapshot = await this.db.collection('products')
                    .where('status', '==', 'active')
                    .get();
                
                firestoreProducts = productsSnapshot.docs
                    // Filter out rejected products - only show approved or pending
                    .filter(doc => {
                        const data = doc.data();
                        // Show if approved, or if no approvalStatus (legacy products)
                        return data.approvalStatus !== 'rejected';
                    })
                    .map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    price: parseFloat(doc.data().price) || 0,
                    rating: parseFloat(doc.data().rating) || 4.0,
                    sellerType: doc.data().sellerType || 'regular',
                    isVerified: doc.data().isVerified || false,
                    deliveryTime: doc.data().deliveryTime || 'standard',
                    createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
                    image: doc.data().image || doc.data().images?.[0] || fallbackImage,
                    seller: doc.data().sellerName || doc.data().seller || 'Seller'
                }));
                console.log('Loaded', firestoreProducts.length, 'products from Firestore');
            } catch (error) {
                console.error("Error loading Firestore products:", error);
            }
        }
        
        // Combine both: Firestore products first (newest), then static catalog
        this.products = [...firestoreProducts, ...staticProducts];
        
        // If no products at all, use sample data
        if (this.products.length === 0) {
            this.products = this.getSampleProducts();
        }
        
        console.log(`Total products loaded: ${this.products.length}`);
    }

    getSampleProducts() {
        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
        
        return [
            {
                id: '1',
                name: 'Wireless Bluetooth Headphones',
                description: 'Noise cancelling over-ear headphones with 30hr battery life',
                price: 2999,
                category: 'electronics',
                image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80',
                seller: 'AudioTech India',
                rating: 4.5,
                stock: 50,
                sellerType: 'premium',
                isVerified: true,
                deliveryTime: '2day',
                createdAt: oneWeekAgo.toISOString()
            },
            {
                id: '2',
                name: 'Premium Cotton T-Shirt',
                description: '100% cotton crew neck t-shirt, available in multiple colors',
                price: 899,
                category: 'fashion',
                image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80',
                seller: 'FashionHub',
                rating: 4.2,
                stock: 100,
                sellerType: 'verified',
                isVerified: true,
                deliveryTime: '1day',
                createdAt: twoWeeksAgo.toISOString()
            },
            {
                id: '3',
                name: 'Smartphone Stand',
                description: 'Adjustable aluminum stand for phones and tablets',
                price: 499,
                category: 'electronics',
                image: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80',
                seller: 'TechGadgets',
                rating: 4.0,
                stock: 75,
                sellerType: 'new',
                isVerified: false,
                deliveryTime: 'week',
                createdAt: new Date().toISOString()
            },
            {
                id: '4',
                name: 'Ceramic Coffee Mug Set',
                description: 'Set of 4 handcrafted ceramic mugs, dishwasher safe',
                price: 1299,
                category: 'home',
                image: 'https://images.unsplash.com/photo-1514228742587-6b1558fcf93a?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80',
                seller: 'HomeEssentials',
                rating: 4.7,
                stock: 40,
                sellerType: 'premium',
                isVerified: true,
                deliveryTime: '2day',
                createdAt: oneWeekAgo.toISOString()
            },
            {
                id: '5',
                name: 'Professional Makeup Kit',
                description: 'Complete makeup kit with 12 eyeshadows, 6 lipsticks, and brushes',
                price: 2499,
                category: 'beauty',
                image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80',
                seller: 'BeautyStudio',
                rating: 4.8,
                stock: 30,
                sellerType: 'verified',
                isVerified: true,
                deliveryTime: '1day',
                createdAt: twoWeeksAgo.toISOString()
            },
            {
                id: '6',
                name: 'Best Selling Novel Collection',
                description: 'Set of 3 best selling novels by popular authors',
                price: 799,
                category: 'books',
                image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80',
                seller: 'BookWorld',
                rating: 4.6,
                stock: 60,
                sellerType: 'regular',
                isVerified: true,
                deliveryTime: 'week',
                createdAt: oneWeekAgo.toISOString()
            },
            {
                id: '7',
                name: 'Yoga Mat Premium',
                description: 'Non-slip, eco-friendly yoga mat with carrying strap',
                price: 1599,
                category: 'home',
                image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80',
                seller: 'FitLife',
                rating: 4.3,
                stock: 45,
                sellerType: 'new',
                isVerified: false,
                deliveryTime: '2day',
                createdAt: new Date().toISOString()
            },
            {
                id: '8',
                name: 'Wireless Mouse',
                description: 'Ergonomic wireless mouse with silent click technology',
                price: 699,
                category: 'electronics',
                image: 'https://images.unsplash.com/photo-1527814050087-3793815479db?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80',
                seller: 'TechZone',
                rating: 4.1,
                stock: 85,
                sellerType: 'verified',
                isVerified: true,
                deliveryTime: '1day',
                createdAt: twoWeeksAgo.toISOString()
            }
        ];
    }

    applyFilters() {
        this.filteredProducts = [...this.products];
        
        // Apply category filter
        if (this.currentFilters.category !== 'all') {
            this.filteredProducts = this.filteredProducts.filter(
                product => product.category === this.currentFilters.category
            );
        }
        
        // Apply price filter
        this.filteredProducts = this.filteredProducts.filter(
            product => product.price <= this.currentFilters.maxPrice
        );
        
        // Apply seller filter
        if (this.currentFilters.seller !== 'all') {
            this.filteredProducts = this.filteredProducts.filter(product => {
                if (this.currentFilters.seller === 'premium') {
                    return product.sellerType === 'premium';
                } else if (this.currentFilters.seller === 'verified') {
                    return product.isVerified === true;
                } else if (this.currentFilters.seller === 'new') {
                    return product.sellerType === 'new';
                }
                // Exact seller name match (for mall outlet filtering)
                return product.seller === this.currentFilters.seller;
            });
        }
        
        // Apply delivery filter
        if (this.currentFilters.delivery !== 'any') {
            this.filteredProducts = this.filteredProducts.filter(
                product => product.deliveryTime === this.currentFilters.delivery
            );
        }
        
        // Apply search filter - ADVANCED SEARCH with synonyms, fuzzy matching, and stemming
        if (this.currentFilters.searchTerm) {
            const searchTerm = this.currentFilters.searchTerm.toLowerCase();
            const searchWords = searchTerm.split(/\s+/).filter(w => w.length > 1);
            
            // Helper function to normalize words (handles plurals)
            const normalizeWord = (word) => {
                if (!word || word.length < 3) return word;
                const w = word.toLowerCase();
                const suffixes = [
                    { pattern: /ies$/i, replacement: 'y' },
                    { pattern: /ves$/i, replacement: 'f' },
                    { pattern: /oes$/i, replacement: 'o' },
                    { pattern: /ses$/i, replacement: 's' },
                    { pattern: /xes$/i, replacement: 'x' },
                    { pattern: /ches$/i, replacement: 'ch' },
                    { pattern: /shes$/i, replacement: 'sh' },
                    { pattern: /ing$/i, replacement: '' },
                    { pattern: /ed$/i, replacement: '' },
                    { pattern: /s$/i, replacement: '' }
                ];
                for (const { pattern, replacement } of suffixes) {
                    if (pattern.test(w)) return w.replace(pattern, replacement);
                }
                return w;
            };
            
            // Synonym dictionary for better matching
            const getSynonyms = (word) => {
                const synonymMap = {
                    'sneakers': ['shoes', 'footwear', 'trainers', 'kicks', 'running shoes', 'sports shoes'],
                    'shoes': ['sneakers', 'footwear', 'trainers', 'boots', 'sandals'],
                    'phone': ['mobile', 'smartphone', 'cellphone'],
                    'mobile': ['phone', 'smartphone', 'cellphone'],
                    'laptop': ['notebook', 'computer', 'macbook'],
                    'headphones': ['earphones', 'earbuds', 'headset', 'airpods'],
                    'earphones': ['headphones', 'earbuds', 'airpods'],
                    'watch': ['smartwatch', 'timepiece', 'wristwatch'],
                    'shirt': ['tshirt', 't-shirt', 'top'],
                    'pants': ['trousers', 'jeans', 'bottoms'],
                    'bag': ['backpack', 'handbag', 'purse'],
                    'glasses': ['spectacles', 'eyewear', 'sunglasses'],
                    'tv': ['television', 'smart tv'],
                    'speaker': ['speakers', 'bluetooth speaker', 'soundbar'],
                    'camera': ['dslr', 'mirrorless', 'photography'],
                    'charger': ['charging', 'power adapter', 'cable'],
                    'cover': ['case', 'protector', 'sleeve'],
                    'toys': ['games', 'playset', 'action figure'],
                    'book': ['books', 'novel', 'ebook']
                };
                const w = word.toLowerCase();
                if (synonymMap[w]) return synonymMap[w];
                for (const [key, values] of Object.entries(synonymMap)) {
                    if (values.includes(w)) return [key, ...values.filter(v => v !== w)];
                }
                return [];
            };
            
            // Fuzzy match helper
            const isFuzzyMatch = (w1, w2) => {
                if (!w1 || !w2 || w1.length < 3 || w2.length < 3) return false;
                if (w1 === w2 || w1.includes(w2) || w2.includes(w1)) return true;
                if (Math.abs(w1.length - w2.length) > 2) return false;
                let diff = 0;
                for (let i = 0; i < Math.min(w1.length, w2.length); i++) {
                    if (w1[i] !== w2[i]) diff++;
                    if (diff > 2) return false;
                }
                return diff <= 2;
            };
            
            // Get all word variants including synonyms
            const getAdvancedVariants = (word) => {
                const normalized = normalizeWord(word);
                const variants = new Set([word.toLowerCase()]);
                if (normalized && normalized !== word.toLowerCase()) variants.add(normalized);
                if (word.length >= 3) variants.add(word.toLowerCase() + 's');
                getSynonyms(word).forEach(syn => variants.add(syn.toLowerCase()));
                getSynonyms(normalized).forEach(syn => variants.add(syn.toLowerCase()));
                return [...variants];
            };
            
            const searchVariants = searchWords.flatMap(w => getAdvancedVariants(w));
            const termVariants = getAdvancedVariants(searchTerm);
            
            this.filteredProducts = this.filteredProducts.filter(product => {
                const name = (product.name || '').toLowerCase();
                const description = (product.description || '').toLowerCase();
                const seller = (product.seller || '').toLowerCase();
                const category = (product.category || '').toLowerCase();
                const brand = (product.brand || '').toLowerCase();
                const tags = (product.tags || []).map(t => t.toLowerCase());
                const normalizedTags = tags.map(t => normalizeWord(t));
                
                // Check if any search variant matches (includes synonyms)
                const matchesVariant = (variant) => 
                    name.includes(variant) || 
                    description.includes(variant) || 
                    seller.includes(variant) || 
                    category.includes(variant) ||
                    brand.includes(variant) ||
                    tags.some(tag => tag.includes(variant) || variant.includes(tag)) ||
                    normalizedTags.some(tag => tag.includes(variant) || variant.includes(tag));
                
                // Check standard variant matching
                if (searchVariants.some(matchesVariant) || 
                    termVariants.some(v => name.includes(v) || brand.includes(v))) {
                    return true;
                }
                
                // Fuzzy matching as fallback
                const nameWords = name.split(/\s+/);
                for (const searchWord of searchWords) {
                    if (searchWord.length < 3) continue;
                    for (const nameWord of nameWords) {
                        if (isFuzzyMatch(searchWord, nameWord)) return true;
                    }
                    for (const tag of tags) {
                        if (isFuzzyMatch(searchWord, tag)) return true;
                    }
                    if (isFuzzyMatch(searchWord, brand)) return true;
                }
                
                return false;
            });
        }
        
        // Apply sorting
        this.sortProducts();
        
        return this.filteredProducts;
    }

    sortProducts() {
        switch (this.currentFilters.sortBy) {
            case 'price-low':
                this.filteredProducts.sort((a, b) => a.price - b.price);
                break;
            case 'price-high':
                this.filteredProducts.sort((a, b) => b.price - a.price);
                break;
            case 'rating':
                this.filteredProducts.sort((a, b) => b.rating - a.rating);
                break;
            case 'newest':
                this.filteredProducts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                break;
            case 'featured':
            default:
                // Featured: premium sellers first, then by rating
                this.filteredProducts.sort((a, b) => {
                    if (a.sellerType === 'premium' && b.sellerType !== 'premium') return -1;
                    if (a.sellerType !== 'premium' && b.sellerType === 'premium') return 1;
                    return b.rating - a.rating;
                });
                break;
        }
    }

    filterBySearch(searchTerm) {
        this.currentFilters.searchTerm = searchTerm;
        this.renderProducts();
        this.updateFilterBar();
    }
    
    // Helper methods for search filters
    setViewMode(mode) {
        this.viewMode = mode;
        this.renderProducts();
    }
    
    setMaxPrice(price) {
        this.currentFilters.maxPrice = price;
        const priceRange = document.getElementById('priceRange');
        const maxPriceValue = document.getElementById('maxPriceValue');
        if (priceRange) priceRange.value = price;
        if (maxPriceValue) maxPriceValue.textContent = `₹${price.toLocaleString()}`;
    }
    
    setCategory(category) {
        this.currentFilters.category = category;
        document.querySelectorAll('#categoryFilters .filter-option').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.category === category) {
                btn.classList.add('active');
            }
        });
    }
    
    setDeliveryFilter(delivery) {
        this.currentFilters.delivery = delivery;
        document.querySelectorAll('#deliveryFilters .filter-option').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.delivery === delivery) {
                btn.classList.add('active');
            }
        });
    }
    
    setSortBy(sortBy) {
        this.currentFilters.sortBy = sortBy;
        document.querySelectorAll('#sortOptions .filter-option').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.sort === sortBy) {
                btn.classList.add('active');
            }
        });
    }

    renderProducts() {
        const productsGrid = document.getElementById('productsGrid');
        const loadingState = document.getElementById('loadingState');
        const emptyState = document.getElementById('emptyState');
        const productCount = document.getElementById('productCount');
        const skeletonGrid = document.getElementById('skeletonLoading');

        if (!productsGrid) return;

        const filteredProducts = this.applyFilters();

        // Hide skeleton and loading states
        if (loadingState) loadingState.style.display = 'none';
        if (skeletonGrid) skeletonGrid.style.display = 'none';

        // Disconnect previous scroll observer
        if (this._scrollObserver) {
            this._scrollObserver.disconnect();
            this._scrollObserver = null;
        }

        if (filteredProducts.length === 0) {
            productsGrid.style.display = 'none';
            if (emptyState) emptyState.style.display = 'block';
            this.hasMoreProducts = false;
        } else {
            if (emptyState) emptyState.style.display = 'none';

            // Reset pagination for fresh render
            this.currentPage = 1;
            const initialBatch = filteredProducts.slice(0, this.pageSize);
            this.hasMoreProducts = filteredProducts.length > this.pageSize;

            // Render based on view mode
            if (this.viewMode === 'list') {
                productsGrid.style.display = 'flex';
                productsGrid.style.flexDirection = 'column';
                productsGrid.style.gap = '16px';
                productsGrid.innerHTML = initialBatch.map(product => this.renderListItem(product)).join('');
            } else {
                productsGrid.style.display = 'grid';
                productsGrid.style.flexDirection = '';
                productsGrid.style.gap = '25px';
                productsGrid.innerHTML = initialBatch.map(product => this.renderGridItem(product)).join('');
            }

            // Add infinite scroll sentinel
            this.appendScrollSentinel(productsGrid);
        }

        // Update product count (show total, not just loaded batch)
        if (productCount) {
            productCount.textContent = filteredProducts.length;
        }

        // Update filter bar
        this.updateFilterBar();

        // Inject brand spotlight cards between products
        if (this.viewMode !== 'list' && filteredProducts.length >= 6) {
            this.injectBrandSpotlights(productsGrid);
        }

        // Load recently viewed after first render
        if (typeof loadRecentlyViewed === 'function') {
            setTimeout(loadRecentlyViewed, 100);
        }
    }

    loadMoreProducts() {
        if (this.isLoadingMore || !this.hasMoreProducts) return;
        this.isLoadingMore = true;

        const filteredProducts = this.applyFilters();
        const start = this.currentPage * this.pageSize;
        const end = start + this.pageSize;
        const nextBatch = filteredProducts.slice(start, end);

        if (nextBatch.length === 0) {
            this.hasMoreProducts = false;
            this.isLoadingMore = false;
            return;
        }

        const productsGrid = document.getElementById('productsGrid');
        if (!productsGrid) { this.isLoadingMore = false; return; }

        // Remove old sentinel before appending
        const oldSentinel = document.getElementById('scrollSentinel');
        if (oldSentinel) oldSentinel.remove();

        // Create fragment and append new cards
        const fragment = document.createDocumentFragment();
        const tempDiv = document.createElement('div');
        const self = this;
        nextBatch.forEach(function(product) {
            tempDiv.innerHTML = self.viewMode === 'list' ? self.renderListItem(product) : self.renderGridItem(product);
            if (tempDiv.firstElementChild) {
                fragment.appendChild(tempDiv.firstElementChild);
            }
        });
        productsGrid.appendChild(fragment);

        this.currentPage++;
        this.hasMoreProducts = end < filteredProducts.length;
        this.isLoadingMore = false;

        // Re-add sentinel if more products exist
        this.appendScrollSentinel(productsGrid);

        // Re-inject brand spotlights after adding new products
        if (this.viewMode !== 'list' && filteredProducts.length >= 6) {
            this.injectBrandSpotlights(productsGrid);
        }
    }

    appendScrollSentinel(container) {
        // Remove existing sentinel
        const existing = document.getElementById('scrollSentinel');
        if (existing) existing.remove();

        if (!this.hasMoreProducts) return;

        const sentinel = document.createElement('div');
        sentinel.id = 'scrollSentinel';
        sentinel.style.cssText = 'grid-column:1/-1;text-align:center;padding:32px;';
        sentinel.innerHTML = '<div style="display:inline-block;width:32px;height:32px;border:3px solid rgba(37,99,235,0.2);border-top-color:#2563EB;border-radius:50%;animation:infiniteScrollSpin 0.8s linear infinite;"></div>';
        container.appendChild(sentinel);

        // Inject keyframes if not already present
        if (!document.getElementById('infiniteScrollKeyframes')) {
            const style = document.createElement('style');
            style.id = 'infiniteScrollKeyframes';
            style.textContent = '@keyframes infiniteScrollSpin { to { transform: rotate(360deg); } }';
            document.head.appendChild(style);
        }

        // Set up IntersectionObserver for the sentinel
        if (this._scrollObserver) this._scrollObserver.disconnect();
        const self = this;
        this._scrollObserver = new IntersectionObserver(function(entries) {
            if (entries[0].isIntersecting) {
                self.loadMoreProducts();
            }
        }, { rootMargin: '200px' });
        this._scrollObserver.observe(sentinel);
    }

    injectBrandSpotlights(grid) {
        const spotlights = [
            { name: 'Samsung Exclusive', logo: 'S', logoBg: '#1428A0', tagline: 'Galaxy smartphones, TVs & appliances', banner: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?auto=format&fit=crop&w=900&q=80', badge: 'premium' },
            { name: 'Nike Official', logo: 'N', logoBg: '#111', tagline: 'Athletic footwear, apparel & equipment', banner: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80', badge: 'premium' },
            { name: 'Apple Authorised', logo: 'A', logoBg: '#000', tagline: 'iPhone, iPad, Mac, AirPods & more', banner: 'https://images.unsplash.com/photo-1491933382434-500287f9b54b?auto=format&fit=crop&w=900&q=80', badge: 'premium' },
        ];
        const cards = grid.querySelectorAll('.product-card');
        const interval = 8;
        let inserted = 0;
        for (let i = 0; i < spotlights.length && (i + 1) * interval <= cards.length; i++) {
            const idx = (i + 1) * interval + inserted;
            const allItems = grid.children;
            if (idx < allItems.length) {
                const s = spotlights[i];
                const el = document.createElement('div');
                el.className = 'brand-spotlight-inline';
                el.style.cssText = 'grid-column:1/-1;border-radius:16px;overflow:hidden;background:#0F172A;position:relative;cursor:pointer;transition:transform 0.25s;';
                el.onclick = function() { window.location.href = '/brand-store.html?brand=' + encodeURIComponent(s.name); };
                el.innerHTML =
                    '<div style="position:relative;display:flex;align-items:center;gap:24px;padding:28px 32px;">' +
                        '<div style="position:absolute;inset:0;background-image:url(' + s.banner + ');background-size:cover;background-position:center;opacity:0.18;"></div>' +
                        '<div style="position:relative;width:56px;height:56px;border-radius:14px;background:' + s.logoBg + ';color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:1.2rem;flex-shrink:0;">' + s.logo + '</div>' +
                        '<div style="position:relative;flex:1;min-width:0;">' +
                            '<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">' +
                                '<span style="color:#fff;font-family:Poppins,sans-serif;font-weight:700;font-size:1.05rem;">' + s.name + '</span>' +
                                '<span style="background:rgba(251,191,36,0.2);color:#FBBF24;padding:2px 8px;border-radius:10px;font-size:0.65rem;font-weight:700;"><i class="fas fa-crown"></i> ' + s.badge.toUpperCase() + '</span>' +
                            '</div>' +
                            '<p style="color:rgba(255,255,255,0.65);font-size:0.85rem;margin:0;">' + s.tagline + '</p>' +
                        '</div>' +
                        '<div style="position:relative;display:flex;align-items:center;gap:8px;background:#2563EB;padding:10px 20px;border-radius:10px;color:#fff;font-size:0.82rem;font-weight:600;white-space:nowrap;flex-shrink:0;"><i class="fas fa-store"></i> Visit Store</div>' +
                    '</div>';
                el.onmouseenter = function() { this.style.transform = 'translateY(-2px)'; };
                el.onmouseleave = function() { this.style.transform = ''; };
                grid.insertBefore(el, allItems[idx]);
                inserted++;
            }
        }
    }
    
    getProductImage(product) {
        // Support both 'images' array and 'image' field
        if (product.images && Array.isArray(product.images) && product.images.length > 0) {
            return product.images[0];
        }
        return product.image || '/Logo/placeholder.svg';
    }
    
    getProductImages(product) {
        // Get all images for gallery
        if (product.images && Array.isArray(product.images) && product.images.length > 0) {
            return product.images;
        }
        return product.image ? [product.image] : ['/Logo/placeholder.svg'];
    }
    
    renderGridItem(product) {
        const isNew = product.createdAt && new Date(product.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const isPremium = product.sellerType === 'premium';
        const isVerified = product.isVerified || product.verified;
        const images = this.getProductImages(product);
        const hasMultipleImages = images.length > 1;
        const discount = product.originalPrice ? Math.round((1 - product.price / product.originalPrice) * 100) : 0;
        const inStock = (product.stock ?? product.quantity ?? 1) > 0;
        const stockQty = product.stock ?? product.quantity ?? 10;
        const lowStock = stockQty > 0 && stockQty <= 5;
        const productUrl = '/product.html?id=' + product.id;
        
        return `
        <div class="product-card ${!inStock ? 'out-of-stock' : ''}" data-id="${product.id}">
            <a href="${productUrl}" class="product-image-link" onclick="trackRecentlyViewed('${product.id}')">
                <div class="product-image-wrapper">
                    ${hasMultipleImages ? `
                    <div class="image-gallery" data-current="0">
                        ${images.slice(0, 4).map((img, i) => `
                            <img src="${img}" alt="${product.name}" class="gallery-image ${i === 0 ? 'active' : ''}" data-index="${i}" loading="lazy" onerror="this.src='/Logo/placeholder.svg'">
                        `).join('')}
                        <div class="gallery-dots">
                            ${images.slice(0, 4).map((_, i) => `<span class="dot ${i === 0 ? 'active' : ''}" data-index="${i}"></span>`).join('')}
                        </div>
                        <button class="gallery-nav prev" onclick="event.stopPropagation(); event.preventDefault(); productManager.prevImage(this)"><i class="fas fa-chevron-left"></i></button>
                        <button class="gallery-nav next" onclick="event.stopPropagation(); event.preventDefault(); productManager.nextImage(this)"><i class="fas fa-chevron-right"></i></button>
                    </div>
                    ` : `
                    <img src="${images[0]}" alt="${product.name}" class="single-image" loading="lazy" onerror="this.src='/Logo/placeholder.svg'">
                    `}
                    <div class="product-badges">
                        ${isNew ? '<span class="badge badge-new">NEW</span>' : ''}
                        ${discount > 0 ? `<span class="badge badge-discount">-${discount}%</span>` : ''}
                        ${isPremium ? '<span class="badge badge-premium"><i class="fas fa-crown"></i></span>' : ''}
                        ${lowStock ? `<span class="badge badge-low-stock"><i class="fas fa-fire"></i> Only ${stockQty} left!</span>` : ''}
                    </div>
                    <div class="product-quick-actions">
                        <button class="quick-action-btn" onclick="event.stopPropagation(); event.preventDefault(); productManager.toggleWishlist('${product.id}')" title="Add to wishlist">
                            <i class="fa${this.wishlist.has(product.id) ? 's' : 'r'} fa-heart"></i>
                        </button>
                        <button class="quick-action-btn" onclick="event.stopPropagation(); event.preventDefault(); productManager.openQuickView('${product.id}')" title="Quick view">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="quick-action-btn" onclick="event.stopPropagation(); event.preventDefault(); productManager.toggleCompare('${product.id}')" title="Compare">
                            <i class="fas fa-balance-scale"></i>
                        </button>
                        <button class="quick-action-btn" onclick="event.stopPropagation(); event.preventDefault(); shareProduct('${product.id}', event)" title="Share">
                            <i class="fas fa-share-alt"></i>
                        </button>
                    </div>
                    ${!inStock ? '<div class="out-of-stock-overlay"><span>Out of Stock</span></div>' : ''}
                </div>
            </a>
            <div class="product-details">
                <div class="product-category-tag">${product.category || 'General'}</div>
                <a href="${productUrl}" class="product-title-link" onclick="trackRecentlyViewed('${product.id}')">
                    <h3 class="product-title">${product.name}</h3>
                </a>
                <div class="product-rating">
                    <div class="stars">
                        ${this.renderStars(product.rating || 0)}
                    </div>
                    <span class="rating-count">(${product.reviewCount || 0})</span>
                </div>
                <div class="product-pricing">
                    <span class="current-price">₹${product.price?.toLocaleString() || '0'}</span>
                    ${product.originalPrice ? `<span class="original-price">₹${product.originalPrice.toLocaleString()}</span>` : ''}
                </div>
                <div class="product-seller-info">
                    <span class="seller-name"><i class="fas fa-store"></i> ${product.seller || product.sellerName || 'Shop'}</span>
                    ${isVerified ? '<span class="verified-badge"><i class="fas fa-check-circle"></i></span>' : ''}
                </div>
                <div class="product-action-buttons">
                    <button class="add-to-cart-btn ${!inStock ? 'disabled' : ''}" onclick="event.stopPropagation(); productManager.addToCart('${product.id}')" ${!inStock ? 'disabled' : ''}>
                        <i class="fas fa-shopping-bag"></i>
                        <span>${inStock ? 'Add to Cart' : 'Notify Me'}</span>
                    </button>
                </div>
            </div>
        </div>
        `;
    }
    
    renderStars(rating) {
        const fullStars = Math.floor(rating);
        const hasHalf = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);
        return `
            ${'<i class="fas fa-star"></i>'.repeat(fullStars)}
            ${hasHalf ? '<i class="fas fa-star-half-alt"></i>' : ''}
            ${'<i class="far fa-star"></i>'.repeat(emptyStars)}
        `;
    }
    
    // =============================================
    // REVIEW SYSTEM
    // =============================================
    
    async loadProductReviews(productId) {
        const container = document.querySelector(`.reviews-list[data-product-id="${productId}"]`);
        if (!container) return;
        
        try {
            let reviews = [];
            
            // Load from Firestore if available
            if (typeof db !== 'undefined') {
                const snapshot = await db.collection('reviews')
                    .where('productId', '==', productId)
                    .where('status', '==', 'approved')
                    .orderBy('createdAt', 'desc')
                    .limit(10)
                    .get();
                
                reviews = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            }
            
            // If no reviews, show empty state
            if (reviews.length === 0) {
                container.innerHTML = `
                    <div class="no-reviews">
                        <i class="fas fa-comment-dots"></i>
                        <p>No reviews yet. Be the first to review this product!</p>
                    </div>
                `;
                return;
            }
            
            // Render reviews
            container.innerHTML = reviews.map(review => this.renderReviewItem(review)).join('');
        } catch (error) {
            console.error('Error loading reviews:', error);
            container.innerHTML = `
                <div class="no-reviews">
                    <i class="fas fa-star"></i>
                    <p>Reviews will appear here after purchase.</p>
                </div>
            `;
        }
    }
    
    renderReviewItem(review) {
        const date = review.createdAt?.toDate ? review.createdAt.toDate() : new Date(review.createdAt);
        const dateStr = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
        
        return `
            <div class="review-item">
                <div class="review-header">
                    <div class="reviewer-info">
                        <div class="reviewer-avatar">
                            <i class="fas fa-user"></i>
                        </div>
                        <div class="reviewer-details">
                            <span class="reviewer-name">${review.userName || 'Anonymous'}</span>
                            ${review.verified ? '<span class="verified-badge"><i class="fas fa-check-circle"></i> Verified Purchase</span>' : ''}
                        </div>
                    </div>
                    <div class="review-date">${dateStr}</div>
                </div>
                <div class="review-rating">
                    ${this.renderStars(review.rating || 0)}
                </div>
                ${review.title ? `<h4 class="review-title">${review.title}</h4>` : ''}
                <p class="review-text">${review.comment || review.text || ''}</p>
                ${review.images?.length > 0 ? `
                    <div class="review-images">
                        ${review.images.map(img => `<img src="${img}" alt="Review image" onclick="window.open('${img}', '_blank')">`).join('')}
                    </div>
                ` : ''}
                <div class="review-actions">
                    <button class="helpful-btn" onclick="productManager.markReviewHelpful('${review.id}')">
                        <i class="far fa-thumbs-up"></i> Helpful (${review.helpfulCount || 0})
                    </button>
                </div>
            </div>
        `;
    }
    
    showReviewForm(productId) {
        // Check if user is logged in
        const user = authManager?.getUserData();
        if (!user) {
            this.showNotification('Please login to write a review', 'warning');
            document.getElementById('loginModal')?.classList.add('active');
            return;
        }
        
        const product = this.products.find(p => p.id === productId);
        if (!product) return;
        
        // Create review modal
        const existingModal = document.getElementById('reviewFormModal');
        if (existingModal) existingModal.remove();
        
        const modal = document.createElement('div');
        modal.id = 'reviewFormModal';
        modal.className = 'review-modal';
        modal.innerHTML = `
            <div class="review-modal-overlay" onclick="this.parentElement.remove()"></div>
            <div class="review-modal-content">
                <button class="review-modal-close" onclick="this.closest('.review-modal').remove()">
                    <i class="fas fa-times"></i>
                </button>
                <h2><i class="fas fa-star"></i> Write a Review</h2>
                <p class="review-product-name">For: ${product.name}</p>
                
                <form id="reviewSubmitForm" onsubmit="productManager.submitReview(event, '${productId}')">
                    <div class="form-group">
                        <label>Your Rating *</label>
                        <div class="star-rating-input" id="starRatingInput">
                            ${[1,2,3,4,5].map(n => `
                                <span class="star-input" data-rating="${n}" onclick="productManager.setRating(${n})">
                                    <i class="far fa-star"></i>
                                </span>
                            `).join('')}
                        </div>
                        <input type="hidden" id="reviewRating" name="rating" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="reviewTitle">Review Title</label>
                        <input type="text" id="reviewTitle" name="title" placeholder="Summarize your experience" maxlength="100">
                    </div>
                    
                    <div class="form-group">
                        <label for="reviewComment">Your Review *</label>
                        <textarea id="reviewComment" name="comment" rows="4" placeholder="Tell others about your experience with this product..." required maxlength="1000"></textarea>
                    </div>
                    
                    <div class="form-group">
                        <label>Add Photos (optional)</label>
                        <div class="photo-upload">
                            <input type="file" id="reviewPhotos" accept="image/*" multiple onchange="productManager.previewPhotos(event)">
                            <label for="reviewPhotos" class="upload-label">
                                <i class="fas fa-camera"></i>
                                <span>Add Photos</span>
                            </label>
                            <div id="photoPreview" class="photo-preview"></div>
                        </div>
                    </div>
                    
                    <button type="submit" class="submit-review-btn">
                        <i class="fas fa-paper-plane"></i> Submit Review
                    </button>
                </form>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add review modal styles
        this.addReviewStyles();
    }
    
    setRating(rating) {
        const container = document.getElementById('starRatingInput');
        const input = document.getElementById('reviewRating');
        if (!container || !input) return;
        
        input.value = rating;
        const stars = container.querySelectorAll('.star-input');
        stars.forEach((star, index) => {
            const icon = star.querySelector('i');
            if (index < rating) {
                icon.className = 'fas fa-star';
                star.classList.add('active');
            } else {
                icon.className = 'far fa-star';
                star.classList.remove('active');
            }
        });
    }
    
    previewPhotos(event) {
        const preview = document.getElementById('photoPreview');
        if (!preview) return;
        
        preview.innerHTML = '';
        const files = event.target.files;
        
        for (let i = 0; i < Math.min(files.length, 5); i++) {
            const file = files[i];
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = document.createElement('div');
                img.className = 'photo-preview-item';
                img.innerHTML = `
                    <img src="${e.target.result}" alt="Preview">
                    <button type="button" class="remove-photo" onclick="this.parentElement.remove()">×</button>
                `;
                preview.appendChild(img);
            };
            reader.readAsDataURL(file);
        }
    }
    
    async submitReview(event, productId) {
        event.preventDefault();
        
        const form = event.target;
        const rating = parseInt(form.rating.value);
        const title = form.title.value.trim();
        const comment = form.comment.value.trim();
        
        if (!rating || rating < 1 || rating > 5) {
            this.showNotification('Please select a rating', 'error');
            return;
        }
        
        if (!comment) {
            this.showNotification('Please write a review', 'error');
            return;
        }
        
        const user = authManager?.getUserData();
        if (!user) {
            this.showNotification('Please login to submit a review', 'error');
            return;
        }
        
        const submitBtn = form.querySelector('.submit-review-btn');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
        
        try {
            const reviewData = {
                productId,
                userId: user.uid,
                userName: user.displayName || user.name || 'Anonymous',
                userEmail: user.email,
                rating,
                title,
                comment,
                status: 'pending', // Will be approved by admin/seller
                verified: false, // Can be verified if they purchased
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                helpfulCount: 0,
                images: []
            };
            
            // Save to Firestore
            if (typeof db !== 'undefined') {
                await db.collection('reviews').add(reviewData);
                
                // Update product's review count and average
                const productRef = db.collection('products').doc(productId);
                const productDoc = await productRef.get();
                if (productDoc.exists) {
                    const data = productDoc.data();
                    const currentCount = data.reviewCount || 0;
                    const currentRating = data.rating || 0;
                    const newCount = currentCount + 1;
                    const newRating = ((currentRating * currentCount) + rating) / newCount;
                    
                    await productRef.update({
                        reviewCount: newCount,
                        rating: Math.round(newRating * 10) / 10
                    });
                }
            }
            
            this.showNotification('Thank you! Your review has been submitted for approval.', 'success');
            document.getElementById('reviewFormModal')?.remove();
            
            // Refresh reviews
            this.loadProductReviews(productId);
            
        } catch (error) {
            console.error('Error submitting review:', error);
            this.showNotification('Failed to submit review. Please try again.', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Review';
        }
    }
    
    async markReviewHelpful(reviewId) {
        try {
            if (typeof db !== 'undefined') {
                await db.collection('reviews').doc(reviewId).update({
                    helpfulCount: firebase.firestore.FieldValue.increment(1)
                });
                this.showNotification('Thanks for your feedback!', 'success');
            }
        } catch (error) {
            console.error('Error marking helpful:', error);
        }
    }
    
    // =============================================
    // IMAGE GALLERY & ZOOM
    // =============================================
    
    currentGalleryIndex = 0;
    
    showImageZoom(imageSrc, altText) {
        const existingZoom = document.getElementById('imageZoomModal');
        if (existingZoom) existingZoom.remove();
        
        const modal = document.createElement('div');
        modal.id = 'imageZoomModal';
        modal.className = 'image-zoom-modal';
        modal.innerHTML = `
            <div class="zoom-overlay" onclick="this.parentElement.remove()"></div>
            <div class="zoom-container">
                <button class="zoom-close" onclick="this.closest('.image-zoom-modal').remove()">
                    <i class="fas fa-times"></i>
                </button>
                <img src="${imageSrc}" alt="${altText}" class="zoomed-image" id="zoomedImage">
                <div class="zoom-controls">
                    <button class="zoom-btn" onclick="productManager.zoomIn()">
                        <i class="fas fa-search-plus"></i>
                    </button>
                    <button class="zoom-btn" onclick="productManager.zoomOut()">
                        <i class="fas fa-search-minus"></i>
                    </button>
                    <button class="zoom-btn" onclick="productManager.resetZoom()">
                        <i class="fas fa-expand"></i>
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add zoom styles
        this.addGalleryStyles();
        
        // Enable mouse wheel zoom
        const img = modal.querySelector('.zoomed-image');
        img.style.transform = 'scale(1)';
        img.dataset.scale = '1';
        
        modal.addEventListener('wheel', (e) => {
            e.preventDefault();
            const currentScale = parseFloat(img.dataset.scale) || 1;
            const delta = e.deltaY > 0 ? -0.1 : 0.1;
            const newScale = Math.min(Math.max(currentScale + delta, 0.5), 4);
            img.dataset.scale = newScale;
            img.style.transform = `scale(${newScale})`;
        });
        
        // Close on escape
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                modal.remove();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
    }
    
    zoomIn() {
        const img = document.getElementById('zoomedImage');
        if (!img) return;
        const currentScale = parseFloat(img.dataset.scale) || 1;
        const newScale = Math.min(currentScale + 0.25, 4);
        img.dataset.scale = newScale;
        img.style.transform = `scale(${newScale})`;
    }
    
    zoomOut() {
        const img = document.getElementById('zoomedImage');
        if (!img) return;
        const currentScale = parseFloat(img.dataset.scale) || 1;
        const newScale = Math.max(currentScale - 0.25, 0.5);
        img.dataset.scale = newScale;
        img.style.transform = `scale(${newScale})`;
    }
    
    resetZoom() {
        const img = document.getElementById('zoomedImage');
        if (!img) return;
        img.dataset.scale = '1';
        img.style.transform = 'scale(1)';
    }
    
    navigateGallery(direction, images) {
        this.currentGalleryIndex += direction;
        if (this.currentGalleryIndex < 0) this.currentGalleryIndex = images.length - 1;
        if (this.currentGalleryIndex >= images.length) this.currentGalleryIndex = 0;
        
        const mainImage = document.getElementById('quickViewMainImage');
        const counter = document.getElementById('galleryCounter');
        const thumbnails = document.querySelectorAll('.thumbnail');
        
        if (mainImage) mainImage.src = images[this.currentGalleryIndex];
        if (counter) counter.textContent = `${this.currentGalleryIndex + 1} / ${images.length}`;
        
        thumbnails.forEach((t, i) => {
            t.classList.toggle('active', i === this.currentGalleryIndex);
        });
    }
    
    // =============================================
    // SIZE/VARIANT SELECTION
    // =============================================
    
    selectedVariants = {};
    
    renderVariantSelector(product) {
        const variants = product.variants || {};
        const sizes = product.sizes || variants.sizes || [];
        const colors = product.colors || variants.colors || [];
        
        // If no variants defined, check category for default sizes
        let defaultSizes = [];
        if (sizes.length === 0 && (product.category === 'fashion' || product.category === 'Fashion' || product.category === 'Clothing')) {
            defaultSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
        }
        
        if (sizes.length === 0 && colors.length === 0 && defaultSizes.length === 0) {
            return '';
        }
        
        const sizesToRender = sizes.length > 0 ? sizes : defaultSizes;
        
        return `
            <div class="qv-variants" id="qvVariants-${product.id}">
                ${sizesToRender.length > 0 ? `
                <div class="variant-group">
                    <label class="variant-label">Size:</label>
                    <div class="variant-options size-options">
                        ${sizesToRender.map((size, i) => `
                            <button type="button" class="variant-btn size-btn ${i === 0 ? 'active' : ''}" 
                                    data-variant-type="size" data-variant-value="${size}"
                                    onclick="productManager.selectVariant('${product.id}', 'size', '${size}', this)">
                                ${size}
                            </button>
                        `).join('')}
                    </div>
                </div>
                ` : ''}
                
                ${colors.length > 0 ? `
                <div class="variant-group">
                    <label class="variant-label">Color:</label>
                    <div class="variant-options color-options">
                        ${colors.map((color, i) => `
                            <button type="button" class="variant-btn color-btn ${i === 0 ? 'active' : ''}" 
                                    data-variant-type="color" data-variant-value="${color.value || color}"
                                    style="background-color: ${color.hex || color}"
                                    title="${color.name || color}"
                                    onclick="productManager.selectVariant('${product.id}', 'color', '${color.value || color}', this)">
                            </button>
                        `).join('')}
                    </div>
                </div>
                ` : ''}
                
                <div class="variant-group quantity-group">
                    <label class="variant-label">Quantity:</label>
                    <div class="quantity-selector">
                        <button type="button" class="qty-btn" onclick="productManager.changeQuantity('${product.id}', -1)">-</button>
                        <input type="number" id="qvQty-${product.id}" value="1" min="1" max="${product.stock || 10}" readonly>
                        <button type="button" class="qty-btn" onclick="productManager.changeQuantity('${product.id}', 1)">+</button>
                    </div>
                </div>
            </div>
        `;
    }
    
    selectVariant(productId, type, value, btn) {
        // Update selected state
        const group = btn.closest('.variant-options');
        group.querySelectorAll('.variant-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Store selection
        if (!this.selectedVariants[productId]) {
            this.selectedVariants[productId] = {};
        }
        this.selectedVariants[productId][type] = value;
        
        // If product has variant-specific pricing, update it
        const product = this.products.find(p => p.id === productId);
        if (product?.variantPricing?.[value]) {
            const priceEl = document.getElementById(`qvPrice-${productId}`);
            if (priceEl) {
                priceEl.textContent = `₹${product.variantPricing[value].toLocaleString()}`;
            }
        }
    }
    
    changeQuantity(productId, delta) {
        const input = document.getElementById(`qvQty-${productId}`);
        if (!input) return;
        
        const product = this.products.find(p => p.id === productId);
        const max = product?.stock || 10;
        const newValue = Math.max(1, Math.min(max, parseInt(input.value) + delta));
        input.value = newValue;
        
        if (!this.selectedVariants[productId]) {
            this.selectedVariants[productId] = {};
        }
        this.selectedVariants[productId].quantity = newValue;
    }
    
    addToCartWithVariant(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product) return;
        
        // Get selected variants
        const variants = this.selectedVariants[productId] || {};
        const quantity = variants.quantity || parseInt(document.getElementById(`qvQty-${productId}`)?.value) || 1;
        
        // Build variant string for display
        const variantParts = [];
        if (variants.size) variantParts.push(`Size: ${variants.size}`);
        if (variants.color) variantParts.push(`Color: ${variants.color}`);
        const variantStr = variantParts.join(', ');
        
        // Check if same product with same variant is already in cart
        const cartKey = variantStr ? `${productId}-${variantStr}` : productId;
        const existingItem = this.cart.find(item => 
            (item.variantKey === cartKey) || (item.id === productId && !item.variant && !variantStr)
        );
        
        if (existingItem) {
            if (existingItem.quantity + quantity <= product.stock) {
                existingItem.quantity += quantity;
            } else {
                this.showNotification('Maximum stock reached!', 'warning');
                return;
            }
        } else {
            this.cart.push({
                id: productId,
                variantKey: cartKey,
                name: product.name,
                price: product.variantPricing?.[variants.size] || product.variantPricing?.[variants.color] || product.price,
                image: product.image,
                quantity: quantity,
                maxQuantity: product.stock,
                variant: variantStr || null
            });
        }
        
        // Clear selected variants
        delete this.selectedVariants[productId];
        
        this.saveCartToStorage();
        this.updateCartDisplay();
        this.showNotification(`${product.name}${variantStr ? ` (${variantStr})` : ''} added to cart!`);
    }
    
    // ===== PRODUCT COMPARISON METHODS =====
    
    toggleCompare(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product) return;
        
        const existingIndex = this.compareList.findIndex(p => p.id === productId);
        
        if (existingIndex >= 0) {
            // Remove from compare
            this.compareList.splice(existingIndex, 1);
            this.showNotification('Removed from comparison', 'info');
        } else {
            // Add to compare
            if (this.compareList.length >= this.maxCompareItems) {
                this.showNotification(`Maximum ${this.maxCompareItems} products can be compared`, 'warning');
                return;
            }
            this.compareList.push(product);
            this.showNotification('Added to comparison', 'success');
        }
        
        this.saveCompareToStorage();
        this.updateCompareWidget();
        this.updateCompareButtons();
    }
    
    saveCompareToStorage() {
        localStorage.setItem('69shop_compare', JSON.stringify(this.compareList.map(p => p.id)));
    }
    
    loadCompareFromStorage() {
        try {
            const ids = JSON.parse(localStorage.getItem('69shop_compare') || '[]');
            this.compareList = ids.map(id => this.products.find(p => p.id === id)).filter(Boolean);
            this.updateCompareWidget();
        } catch (e) {
            this.compareList = [];
        }
    }
    
    updateCompareButtons() {
        document.querySelectorAll('.compare-btn').forEach(btn => {
            const productId = btn.dataset.productId;
            const isInCompare = this.compareList.some(p => p.id === productId);
            btn.classList.toggle('active', isInCompare);
            btn.innerHTML = `<i class="fas fa-balance-scale"></i> ${isInCompare ? 'In Compare' : 'Compare'}`;
        });
    }
    
    updateCompareWidget() {
        let widget = document.getElementById('compareWidget');
        
        if (this.compareList.length === 0) {
            if (widget) widget.remove();
            return;
        }
        
        if (!widget) {
            widget = document.createElement('div');
            widget.id = 'compareWidget';
            widget.className = 'compare-widget';
            document.body.appendChild(widget);
            this.addCompareStyles();
        }
        
        widget.innerHTML = `
            <div class="compare-header">
                <span><i class="fas fa-balance-scale"></i> Compare (${this.compareList.length}/${this.maxCompareItems})</span>
                <button class="close-compare-widget" onclick="productManager.clearCompare()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="compare-items">
                ${this.compareList.map(product => `
                    <div class="compare-item">
                        <img src="${product.image || '/Logo/placeholder.svg'}" alt="${product.name}">
                        <button class="remove-compare-item" onclick="productManager.toggleCompare('${product.id}')" title="Remove">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                `).join('')}
            </div>
            <button class="btn-compare-now" onclick="productManager.showCompareModal()" ${this.compareList.length < 2 ? 'disabled' : ''}>
                Compare Now
            </button>
        `;
    }
    
    clearCompare() {
        this.compareList = [];
        this.saveCompareToStorage();
        this.updateCompareWidget();
        this.updateCompareButtons();
    }
    
    showCompareModal() {
        if (this.compareList.length < 2) {
            this.showNotification('Add at least 2 products to compare', 'warning');
            return;
        }
        
        // Remove existing modal
        document.getElementById('compareModal')?.remove();
        
        // Build spec categories based on product category
        const specCategories = this.buildSpecCategories(this.compareList);
        
        const modal = document.createElement('div');
        modal.id = 'compareModal';
        modal.className = 'compare-modal';
        modal.innerHTML = `
            <div class="compare-modal-content">
                <div class="compare-modal-header">
                    <h2><i class="fas fa-balance-scale"></i> Product Comparison</h2>
                    <button class="close-compare-modal" onclick="document.getElementById('compareModal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="compare-table-wrapper">
                    <table class="compare-table">
                        <thead>
                            <tr>
                                <th class="feature-col">Feature</th>
                                ${this.compareList.map(p => `
                                    <th class="product-col">
                                        <img src="${p.image || '/Logo/placeholder.svg'}" alt="${p.name}">
                                        <span class="compare-product-name">${p.name}</span>
                                        <button class="btn-remove-compare" onclick="productManager.toggleCompare('${p.id}'); productManager.showCompareModal();">
                                            <i class="fas fa-trash"></i> Remove
                                        </button>
                                    </th>
                                `).join('')}
                            </tr>
                        </thead>
                        <tbody>
                            ${specCategories}
                        </tbody>
                    </table>
                </div>
                <div class="compare-modal-footer">
                    ${this.compareList.map(p => `
                        <button class="btn-add-to-cart" onclick="productManager.addToCart('${p.id}')">
                            <i class="fas fa-shopping-bag"></i> Add ${p.name.split(' ')[0]} to Cart
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
        
        // Close on ESC
        document.addEventListener('keydown', function escHandler(e) {
            if (e.key === 'Escape') {
                document.getElementById('compareModal')?.remove();
                document.removeEventListener('keydown', escHandler);
            }
        });
    }
    
    buildSpecCategories(products) {
        let html = '';
        
        // Price & Availability Section
        html += `<tr class="spec-category-row"><td class="feature-name" colspan="${products.length + 1}">💰 Price & Availability</td></tr>`;
        html += this.buildSpecRow('Price', products, p => `₹${(p.price || 0).toLocaleString('en-IN')}`, 'price');
        html += this.buildSpecRow('Rating', products, p => {
            const rating = p.rating || 0;
            return `<span class="stars">${'★'.repeat(Math.round(rating))}${'☆'.repeat(5 - Math.round(rating))}</span> (${rating.toFixed(1)})`;
        }, 'rating');
        html += this.buildSpecRow('In Stock', products, p => {
            const stock = p.stock ?? p.quantity ?? 10;
            return stock > 0 ? '<i class="fas fa-check" style="color:#00c853"></i> Yes' : '<i class="fas fa-times" style="color:#ff5252"></i> No';
        });
        html += this.buildSpecRow('Seller', products, p => p.seller || 'N/A');
        html += this.buildSpecRow('Brand', products, p => p.brand || 'N/A');

        // General Section
        html += `<tr class="spec-category-row"><td class="feature-name" colspan="${products.length + 1}">📋 General</td></tr>`;
        html += this.buildSpecRow('Category', products, p => p.category || 'N/A');
        html += this.buildSpecRow('Model', products, p => p.specs?.general?.model || p.model || p.name);
        html += this.buildSpecRow('Color', products, p => p.specs?.general?.color || p.color || 'N/A');
        html += this.buildSpecRow('Weight', products, p => p.specs?.general?.weight || p.weight || 'N/A');
        html += this.buildSpecRow('Dimensions', products, p => p.specs?.general?.dimensions || p.dimensions || 'N/A');
        html += this.buildSpecRow('Warranty', products, p => p.specs?.general?.warranty || p.warranty || '1 Year');

        // Technical Specs (for electronics/mobiles)
        const hasTechSpecs = products.some(p => p.specs?.technical || p.category === 'mobiles' || p.category === 'electronics' || p.category === 'headphones');
        if (hasTechSpecs) {
            html += `<tr class="spec-category-row"><td class="feature-name" colspan="${products.length + 1}">⚙️ Technical Specifications</td></tr>`;
            html += this.buildSpecRow('Display', products, p => p.specs?.technical?.display || 'N/A');
            html += this.buildSpecRow('Processor', products, p => p.specs?.technical?.processor || 'N/A');
            html += this.buildSpecRow('RAM', products, p => p.specs?.technical?.ram || 'N/A');
            html += this.buildSpecRow('Storage', products, p => p.specs?.technical?.storage || 'N/A');
            html += this.buildSpecRow('Battery', products, p => p.specs?.technical?.battery || 'N/A');
            html += this.buildSpecRow('Connectivity', products, p => p.specs?.technical?.connectivity || 'N/A');
            html += this.buildSpecRow('OS', products, p => p.specs?.technical?.os || 'N/A');
        }

        // Camera specs (for mobiles)
        const hasCameraSpecs = products.some(p => p.specs?.camera || p.category === 'mobiles');
        if (hasCameraSpecs) {
            html += `<tr class="spec-category-row"><td class="feature-name" colspan="${products.length + 1}">📷 Camera</td></tr>`;
            html += this.buildSpecRow('Rear Camera', products, p => p.specs?.camera?.rear || 'N/A');
            html += this.buildSpecRow('Front Camera', products, p => p.specs?.camera?.front || 'N/A');
            html += this.buildSpecRow('Video', products, p => p.specs?.camera?.video || 'N/A');
            html += this.buildSpecRow('Features', products, p => p.specs?.camera?.features || 'N/A');
        }

        // Audio specs (for headphones)
        const hasAudioSpecs = products.some(p => p.specs?.audio || p.category === 'headphones');
        if (hasAudioSpecs) {
            html += `<tr class="spec-category-row"><td class="feature-name" colspan="${products.length + 1}">🎵 Audio</td></tr>`;
            html += this.buildSpecRow('Driver Size', products, p => p.specs?.audio?.driver || 'N/A');
            html += this.buildSpecRow('Frequency Response', products, p => p.specs?.audio?.frequency || 'N/A');
            html += this.buildSpecRow('ANC', products, p => p.specs?.audio?.anc || 'N/A');
            html += this.buildSpecRow('Codec Support', products, p => p.specs?.audio?.codec || 'N/A');
            html += this.buildSpecRow('Battery Life', products, p => p.specs?.audio?.battery || p.specs?.technical?.battery || 'N/A');
        }

        // Features Section
        html += `<tr class="spec-category-row"><td class="feature-name" colspan="${products.length + 1}">✨ Key Features</td></tr>`;
        html += this.buildSpecRow('Highlights', products, p => {
            if (p.specs?.features && Array.isArray(p.specs.features)) {
                return p.specs.features.slice(0, 3).join(', ');
            }
            return p.description || 'N/A';
        });
        html += this.buildSpecRow('Tags', products, p => {
            if (p.tags && Array.isArray(p.tags)) {
                return p.tags.slice(0, 5).join(', ');
            }
            return 'N/A';
        });

        return html;
    }
    
    buildSpecRow(label, products, getValue, className = '') {
        return `
            <tr>
                <td class="feature-name">${label}</td>
                ${products.map(p => `
                    <td class="feature-value ${className}">${getValue(p)}</td>
                `).join('')}
            </tr>
        `;
    }
    
    addCompareStyles() {
        if (document.getElementById('compareStyles')) return;
        
        const style = document.createElement('style');
        style.id = 'compareStyles';
        style.textContent = `
            .compare-widget {
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: white;
                border-radius: 16px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
                padding: 16px;
                z-index: 9990;
                min-width: 220px;
                animation: slideUp 0.3s ease-out;
            }
            @keyframes slideUp {
                from { transform: translateY(100px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
            .compare-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 12px;
                font-weight: 600;
            }
            .compare-header i {
                color: var(--blue-primary);
                margin-right: 8px;
            }
            .close-compare-widget {
                background: none;
                border: none;
                color: #666;
                cursor: pointer;
                font-size: 16px;
            }
            .compare-items {
                display: flex;
                gap: 8px;
                margin-bottom: 12px;
            }
            .compare-item {
                position: relative;
                width: 48px;
                height: 48px;
            }
            .compare-item img {
                width: 100%;
                height: 100%;
                object-fit: cover;
                border-radius: 8px;
                border: 2px solid #e5e7eb;
            }
            .remove-compare-item {
                position: absolute;
                top: -6px;
                right: -6px;
                width: 18px;
                height: 18px;
                border-radius: 50%;
                background: #ef4444;
                color: white;
                border: none;
                cursor: pointer;
                font-size: 10px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .btn-compare-now {
                width: 100%;
                padding: 10px;
                background: var(--blue-primary);
                color: white;
                border: none;
                border-radius: 8px;
                font-weight: 600;
                cursor: pointer;
                transition: background 0.2s;
            }
            .btn-compare-now:disabled {
                background: #d1d5db;
                cursor: not-allowed;
            }
            .btn-compare-now:not(:disabled):hover {
                background: #0052cc;
            }
            
            /* Compare Modal */
            .compare-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.6);
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
            }
            .compare-modal-content {
                background: white;
                border-radius: 16px;
                width: 100%;
                max-width: 1000px;
                max-height: 90vh;
                display: flex;
                flex-direction: column;
                overflow: hidden;
            }
            .compare-modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 20px 24px;
                border-bottom: 1px solid #e5e7eb;
            }
            .compare-modal-header h2 {
                font-size: 20px;
                margin: 0;
            }
            .compare-modal-header i {
                color: var(--blue-primary);
                margin-right: 10px;
            }
            .close-compare-modal {
                background: none;
                border: none;
                font-size: 20px;
                color: #666;
                cursor: pointer;
            }
            .compare-table-wrapper {
                overflow: auto;
                flex: 1;
                padding: 20px;
            }
            .compare-table {
                width: 100%;
                border-collapse: collapse;
            }
            .compare-table th, .compare-table td {
                padding: 12px 16px;
                text-align: center;
                border-bottom: 1px solid #f3f4f6;
            }
            .compare-table th.feature-col,
            .compare-table td.feature-name {
                text-align: left;
                font-weight: 600;
                background: #f9fafb;
                min-width: 140px;
            }
            .compare-table th.product-col {
                vertical-align: top;
            }
            .compare-table th.product-col img {
                width: 80px;
                height: 80px;
                object-fit: cover;
                border-radius: 8px;
                margin-bottom: 8px;
            }
            .compare-product-name {
                display: block;
                font-size: 14px;
                font-weight: 600;
                margin-bottom: 8px;
            }
            .btn-remove-compare {
                font-size: 12px;
                color: #ef4444;
                background: none;
                border: none;
                cursor: pointer;
            }
            .feature-value.price {
                font-weight: 700;
                color: var(--blue-primary);
                font-size: 16px;
            }
            .feature-value.rating .stars {
                color: #fbbf24;
            }
            .feature-value.in-stock {
                color: #10b981;
            }
            .feature-value.out-of-stock {
                color: #ef4444;
            }
            .compare-modal-footer {
                display: flex;
                gap: 12px;
                padding: 16px 24px;
                border-top: 1px solid #e5e7eb;
                justify-content: center;
            }
            .compare-modal-footer .btn-add-to-cart {
                padding: 10px 20px;
                background: var(--blue-primary);
                color: white;
                border: none;
                border-radius: 8px;
                font-weight: 600;
                cursor: pointer;
            }
            
            /* Spec Category Headers in Compare Modal */
            .spec-category-row td {
                background: linear-gradient(135deg, var(--blue-primary), #009cf7) !important;
                color: white !important;
                font-weight: 600;
                text-transform: uppercase;
                font-size: 12px;
                letter-spacing: 1px;
                padding: 10px 16px !important;
            }
            .spec-category-row td.feature-name {
                background: linear-gradient(135deg, var(--blue-primary), #009cf7) !important;
                color: white !important;
            }
            
            /* Compare button on product cards */
            .compare-btn {
                background: none;
                border: 1px solid #d1d5db;
                padding: 6px 12px;
                border-radius: 6px;
                font-size: 12px;
                cursor: pointer;
                transition: all 0.2s;
                color: #666;
            }
            .compare-btn:hover {
                border-color: var(--blue-primary);
                color: var(--blue-primary);
            }
            .compare-btn.active {
                background: var(--blue-primary);
                color: white;
                border-color: var(--blue-primary);
            }
            
            @media (max-width: 768px) {
                .compare-widget {
                    left: 10px;
                    right: 10px;
                }
                .compare-modal-content {
                    max-height: 95vh;
                }
                .compare-table th.product-col img {
                    width: 60px;
                    height: 60px;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    addGalleryStyles() {
        if (document.getElementById('galleryStyles')) return;
        
        const style = document.createElement('style');
        style.id = 'galleryStyles';
        style.textContent = `
            /* Image Zoom Modal */
            .image-zoom-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .zoom-overlay {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.9);
            }
            .zoom-container {
                position: relative;
                max-width: 90%;
                max-height: 90%;
                display: flex;
                flex-direction: column;
                align-items: center;
            }
            .zoom-close {
                position: absolute;
                top: -40px;
                right: 0;
                background: none;
                border: none;
                color: white;
                font-size: 24px;
                cursor: pointer;
            }
            .zoomed-image {
                max-width: 100%;
                max-height: 80vh;
                object-fit: contain;
                transition: transform 0.2s ease;
                cursor: grab;
            }
            .zoom-controls {
                display: flex;
                gap: 12px;
                margin-top: 16px;
            }
            .zoom-btn {
                background: rgba(255,255,255,0.1);
                border: 1px solid rgba(255,255,255,0.3);
                color: white;
                width: 44px;
                height: 44px;
                border-radius: 50%;
                cursor: pointer;
                transition: all 0.2s;
            }
            .zoom-btn:hover {
                background: rgba(255,255,255,0.2);
            }
            
            /* Gallery Navigation */
            .gallery-nav {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 16px;
                margin-top: 12px;
            }
            .gallery-nav-btn {
                width: 36px;
                height: 36px;
                border-radius: 50%;
                background: #f3f4f6;
                border: none;
                cursor: pointer;
                transition: all 0.2s;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .gallery-nav-btn:hover {
                background: var(--blue-primary);
                color: white;
            }
            .gallery-counter {
                font-size: 13px;
                color: #666;
            }
            
            /* Zoom hint */
            .zoom-hint {
                position: absolute;
                bottom: 8px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(0,0,0,0.6);
                color: white;
                padding: 6px 12px;
                border-radius: 20px;
                font-size: 12px;
                opacity: 0;
                transition: opacity 0.3s;
                pointer-events: none;
            }
            .main-image-container:hover .zoom-hint {
                opacity: 1;
            }
            .main-image-container {
                cursor: pointer;
                position: relative;
            }
            
            /* Variant Selector Styles */
            .qv-variants {
                margin: 16px 0;
                padding: 16px;
                background: #f8fafc;
                border-radius: 12px;
            }
            .variant-group {
                margin-bottom: 16px;
            }
            .variant-group:last-child {
                margin-bottom: 0;
            }
            .variant-label {
                display: block;
                font-weight: 600;
                margin-bottom: 8px;
                color: #333;
                font-size: 14px;
            }
            .variant-options {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
            }
            .variant-btn {
                padding: 8px 16px;
                border: 2px solid #e5e7eb;
                background: white;
                border-radius: 8px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
                transition: all 0.2s;
            }
            .variant-btn:hover {
                border-color: var(--blue-primary);
            }
            .variant-btn.active {
                border-color: var(--blue-primary);
                background: #e8f4ff;
                color: var(--blue-primary);
            }
            .color-btn {
                width: 36px;
                height: 36px;
                padding: 0;
                border-radius: 50%;
                border-width: 3px;
            }
            .color-btn.active {
                transform: scale(1.1);
                box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            }
            .quantity-selector {
                display: flex;
                align-items: center;
                gap: 4px;
                background: white;
                border-radius: 8px;
                border: 1px solid #e5e7eb;
                width: fit-content;
            }
            .qty-btn {
                width: 36px;
                height: 36px;
                border: none;
                background: none;
                cursor: pointer;
                font-size: 18px;
                font-weight: 600;
                color: #666;
                transition: all 0.2s;
            }
            .qty-btn:hover {
                background: #f3f4f6;
                color: var(--blue-primary);
            }
            .quantity-selector input {
                width: 48px;
                text-align: center;
                border: none;
                font-size: 16px;
                font-weight: 600;
                background: none;
            }
            .quantity-selector input::-webkit-outer-spin-button,
            .quantity-selector input::-webkit-inner-spin-button {
                -webkit-appearance: none;
                margin: 0;
            }
            
            /* Saved Address Styles */
            .saved-addresses-section {
                margin-bottom: 20px;
                padding: 16px;
                background: #f8fafc;
                border-radius: 12px;
            }
            .saved-addresses-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 12px;
                font-weight: 500;
            }
            .manage-addresses-link {
                font-size: 13px;
                color: var(--blue-primary);
                text-decoration: none;
            }
            .saved-address-list {
                display: grid;
                gap: 12px;
                max-height: 200px;
                overflow-y: auto;
            }
            .saved-address-card {
                background: white;
                border: 2px solid #e5e7eb;
                border-radius: 10px;
                padding: 12px;
                cursor: pointer;
                transition: all 0.2s;
                position: relative;
            }
            .saved-address-card:hover {
                border-color: #c7d2fe;
            }
            .saved-address-card.selected {
                border-color: var(--blue-primary);
                background: #e8f4ff;
            }
            .address-card-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 8px;
            }
            .address-label {
                font-weight: 600;
                text-transform: capitalize;
            }
            .address-label i {
                margin-right: 6px;
                color: var(--blue-primary);
            }
            .default-badge {
                font-size: 11px;
                background: #10b981;
                color: white;
                padding: 2px 8px;
                border-radius: 4px;
            }
            .address-card-body {
                font-size: 13px;
                color: #555;
                line-height: 1.5;
            }
            .address-card-body strong {
                color: #333;
            }
            .address-card-body p {
                margin: 2px 0;
            }
            .address-phone {
                color: #666;
                margin-top: 6px !important;
            }
            .address-phone i {
                margin-right: 4px;
            }
            .selected-indicator {
                position: absolute;
                top: 8px;
                right: 8px;
                color: var(--blue-primary);
                font-size: 20px;
            }
            .btn-new-address {
                width: 100%;
                padding: 10px;
                margin-top: 12px;
                border: 2px dashed #d1d5db;
                background: none;
                border-radius: 8px;
                color: #666;
                cursor: pointer;
                transition: all 0.2s;
            }
            .btn-new-address:hover {
                border-color: var(--blue-primary);
                color: var(--blue-primary);
            }
            
            /* Coupon Section Styles */
            .coupon-section {
                padding: 12px 0;
                border-top: 1px dashed #e5e7eb;
                border-bottom: 1px dashed #e5e7eb;
                margin: 8px 0;
            }
            .coupon-input-wrapper {
                display: flex;
                gap: 8px;
            }
            .coupon-input-wrapper input {
                flex: 1;
                padding: 10px 12px;
                border: 2px solid #e5e7eb;
                border-radius: 8px;
                font-size: 14px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                transition: border-color 0.2s;
            }
            .coupon-input-wrapper input:focus {
                outline: none;
                border-color: var(--blue-primary);
            }
            .coupon-input-wrapper input::placeholder {
                text-transform: none;
                letter-spacing: normal;
                color: #9ca3af;
            }
            .coupon-input-wrapper button {
                padding: 10px 20px;
                background: var(--blue-primary);
                color: white;
                border: none;
                border-radius: 8px;
                font-weight: 600;
                cursor: pointer;
                transition: background 0.2s;
                min-width: 80px;
            }
            .coupon-input-wrapper button:hover:not(:disabled) {
                background: #0052cc;
            }
            .coupon-input-wrapper button:disabled {
                opacity: 0.7;
                cursor: not-allowed;
            }
            .coupon-applied {
                display: flex;
                align-items: center;
            }
            .coupon-tag {
                display: flex;
                align-items: center;
                gap: 8px;
                background: linear-gradient(135deg, #e8f4ff 0%, #dbeafe 100%);
                border: 1px solid #93c5fd;
                padding: 8px 12px;
                border-radius: 8px;
                color: #1e40af;
                font-weight: 500;
                font-size: 13px;
            }
            .coupon-tag i.fa-tag {
                color: #3b82f6;
            }
            .coupon-tag button {
                background: none;
                border: none;
                color: #ef4444;
                cursor: pointer;
                padding: 4px;
                border-radius: 4px;
                transition: background 0.2s;
            }
            .coupon-tag button:hover {
                background: rgba(239, 68, 68, 0.1);
            }
            .coupon-error {
                color: #ef4444;
                font-size: 12px;
                margin-top: 8px;
                display: flex;
                align-items: center;
                gap: 6px;
            }
            .coupon-error::before {
                content: '\\f06a';
                font-family: 'Font Awesome 6 Free';
                font-weight: 900;
            }
            .discount-row {
                color: #10b981;
            }
            .discount-amount {
                font-weight: 600;
                color: #10b981;
            }
        `;
        document.head.appendChild(style);
    }
    
    addReviewStyles() {
        if (document.getElementById('reviewStyles')) return;
        
        const style = document.createElement('style');
        style.id = 'reviewStyles';
        style.textContent = `
            /* Review Modal Styles */
            .review-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 9999;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .review-modal-overlay {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.6);
                backdrop-filter: blur(4px);
            }
            .review-modal-content {
                position: relative;
                background: white;
                border-radius: 16px;
                padding: 32px;
                max-width: 500px;
                width: 90%;
                max-height: 90vh;
                overflow-y: auto;
                animation: slideUp 0.3s ease;
            }
            @keyframes slideUp {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
            }
            .review-modal-close {
                position: absolute;
                top: 16px;
                right: 16px;
                background: none;
                border: none;
                font-size: 20px;
                cursor: pointer;
                color: #666;
            }
            .review-modal-content h2 {
                margin: 0 0 8px;
                font-size: 24px;
                color: #333;
            }
            .review-modal-content h2 i {
                color: #fbbf24;
            }
            .review-product-name {
                color: #666;
                margin-bottom: 24px;
            }
            .star-rating-input {
                display: flex;
                gap: 8px;
                font-size: 32px;
                margin: 12px 0;
            }
            .star-input {
                cursor: pointer;
                color: #d1d5db;
                transition: all 0.2s;
            }
            .star-input:hover, .star-input.active {
                color: #fbbf24;
                transform: scale(1.1);
            }
            .star-input i {
                transition: color 0.2s;
            }
            .form-group {
                margin-bottom: 20px;
            }
            .form-group label {
                display: block;
                font-weight: 600;
                margin-bottom: 8px;
                color: #333;
            }
            .form-group input, .form-group textarea {
                width: 100%;
                padding: 12px;
                border: 1px solid #e5e7eb;
                border-radius: 8px;
                font-size: 15px;
            }
            .form-group textarea {
                resize: vertical;
                min-height: 100px;
            }
            .photo-upload {
                position: relative;
            }
            .photo-upload input[type="file"] {
                display: none;
            }
            .upload-label {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                padding: 12px 24px;
                background: #f3f4f6;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.2s;
            }
            .upload-label:hover {
                background: #e5e7eb;
            }
            .photo-preview {
                display: flex;
                gap: 8px;
                flex-wrap: wrap;
                margin-top: 12px;
            }
            .photo-preview-item {
                position: relative;
                width: 60px;
                height: 60px;
            }
            .photo-preview-item img {
                width: 100%;
                height: 100%;
                object-fit: cover;
                border-radius: 8px;
            }
            .remove-photo {
                position: absolute;
                top: -8px;
                right: -8px;
                width: 20px;
                height: 20px;
                border-radius: 50%;
                background: #ef4444;
                color: white;
                border: none;
                cursor: pointer;
                font-size: 12px;
            }
            .submit-review-btn {
                width: 100%;
                padding: 14px;
                background: linear-gradient(135deg, #0066ff, #00c6ff);
                color: white;
                border: none;
                border-radius: 8px;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s;
            }
            .submit-review-btn:hover:not(:disabled) {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0, 102, 255, 0.3);
            }
            .submit-review-btn:disabled {
                opacity: 0.7;
                cursor: not-allowed;
            }
            
            /* Reviews in Quick View */
            .qv-reviews {
                margin-top: 24px;
                padding-top: 24px;
                border-top: 1px solid #e5e7eb;
            }
            .reviews-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 16px;
                flex-wrap: wrap;
                gap: 12px;
            }
            .reviews-header h3 {
                margin: 0;
                font-size: 18px;
            }
            .reviews-summary {
                display: flex;
                align-items: center;
                gap: 8px;
            }
            .avg-rating {
                font-size: 24px;
                font-weight: 700;
                color: #fbbf24;
            }
            .summary-stars {
                color: #fbbf24;
            }
            .review-count {
                color: #666;
            }
            .reviews-list {
                max-height: 300px;
                overflow-y: auto;
            }
            .no-reviews {
                text-align: center;
                padding: 32px;
                color: #666;
            }
            .no-reviews i {
                font-size: 32px;
                margin-bottom: 12px;
                color: #d1d5db;
            }
            .review-item {
                padding: 16px 0;
                border-bottom: 1px solid #f3f4f6;
            }
            .review-item:last-child {
                border-bottom: none;
            }
            .review-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 8px;
            }
            .reviewer-info {
                display: flex;
                align-items: center;
                gap: 12px;
            }
            .reviewer-avatar {
                width: 36px;
                height: 36px;
                border-radius: 50%;
                background: #e5e7eb;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #666;
            }
            .reviewer-name {
                font-weight: 600;
            }
            .verified-badge {
                font-size: 12px;
                color: #10b981;
                display: flex;
                align-items: center;
                gap: 4px;
            }
            .review-date {
                font-size: 13px;
                color: #999;
            }
            .review-rating {
                color: #fbbf24;
                margin-bottom: 8px;
            }
            .review-title {
                margin: 8px 0;
                font-size: 15px;
            }
            .review-text {
                color: #444;
                line-height: 1.6;
                margin: 8px 0;
            }
            .review-images {
                display: flex;
                gap: 8px;
                margin-top: 12px;
            }
            .review-images img {
                width: 60px;
                height: 60px;
                object-fit: cover;
                border-radius: 8px;
                cursor: pointer;
            }
            .review-actions {
                margin-top: 12px;
            }
            .helpful-btn {
                background: none;
                border: 1px solid #e5e7eb;
                padding: 6px 12px;
                border-radius: 6px;
                font-size: 13px;
                cursor: pointer;
                transition: all 0.2s;
            }
            .helpful-btn:hover {
                background: #f3f4f6;
                border-color: #d1d5db;
            }
            .qv-review-btn {
                padding: 10px 16px;
                background: #fbbf24;
                color: #333;
                border: none;
                border-radius: 8px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s;
            }
            .qv-review-btn:hover {
                background: #f59e0b;
            }
            .loading-reviews {
                text-align: center;
                padding: 24px;
                color: #666;
            }
        `;
        document.head.appendChild(style);
    }
    
    prevImage(btn) {
        const gallery = btn.closest('.image-gallery');
        const images = gallery.querySelectorAll('.gallery-image');
        const dots = gallery.querySelectorAll('.dot');
        let current = parseInt(gallery.dataset.current) || 0;
        current = (current - 1 + images.length) % images.length;
        gallery.dataset.current = current;
        images.forEach((img, i) => img.classList.toggle('active', i === current));
        dots.forEach((dot, i) => dot.classList.toggle('active', i === current));
    }
    
    nextImage(btn) {
        const gallery = btn.closest('.image-gallery');
        const images = gallery.querySelectorAll('.gallery-image');
        const dots = gallery.querySelectorAll('.dot');
        let current = parseInt(gallery.dataset.current) || 0;
        current = (current + 1) % images.length;
        gallery.dataset.current = current;
        images.forEach((img, i) => img.classList.toggle('active', i === current));
        dots.forEach((dot, i) => dot.classList.toggle('active', i === current));
    }
    
    renderListItem(product) {
        const isNew = product.createdAt && new Date(product.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const isPremium = product.sellerType === 'premium';
        const isVerified = product.isVerified || product.verified;
        const mainImage = this.getProductImage(product);
        const discount = product.originalPrice ? Math.round((1 - product.price / product.originalPrice) * 100) : 0;
        const inStock = (product.stock ?? product.quantity ?? 1) > 0;
        const productUrl = '/product.html?id=' + product.id;
        
        return `
        <div class="product-list-item ${!inStock ? 'out-of-stock' : ''}" data-id="${product.id}">
            <a href="${productUrl}" class="product-list-image">
                <img src="${mainImage}" alt="${product.name}" loading="lazy" onerror="this.src='/Logo/placeholder.svg'">
                ${discount > 0 ? `<span class="discount-tag">-${discount}%</span>` : ''}
                ${!inStock ? '<div class="out-of-stock-overlay"><span>Out of Stock</span></div>' : ''}
            </a>
            <div class="product-list-content">
                <div class="list-header">
                    <span class="category-tag">${product.category || 'General'}</span>
                    ${isNew ? '<span class="new-tag">NEW</span>' : ''}
                    ${isPremium ? '<span class="premium-tag"><i class="fas fa-crown"></i> Premium</span>' : ''}
                </div>
                <a href="${productUrl}" class="product-list-name-link">
                    <h3 class="product-list-name">${product.name}</h3>
                </a>
                <a href="${productUrl}" class="product-list-desc-link">
                    <p class="product-list-description">${product.description || ''}</p>
                </a>
                <div class="product-list-meta">
                    <div class="rating-block">
                        <div class="stars">${this.renderStars(product.rating || 0)}</div>
                        <span>(${product.reviewCount || 0} reviews)</span>
                    </div>
                    <div class="seller-block">
                        <i class="fas fa-store"></i>
                        <span>${product.seller || product.sellerName || 'Shop'}</span>
                        ${isVerified ? '<i class="fas fa-check-circle verified"></i>' : ''}
                    </div>
                </div>
            </div>
            <div class="product-list-actions">
                <div class="price-block">
                    <span class="current-price">₹${product.price?.toLocaleString() || '0'}</span>
                    ${product.originalPrice ? `<span class="original-price">₹${product.originalPrice.toLocaleString()}</span>` : ''}
                </div>
                <a href="${productUrl}" class="view-product-btn">
                    <i class="fas fa-eye"></i> View Product
                </a>
                <button class="add-to-cart-btn ${!inStock ? 'disabled' : ''}" onclick="productManager.addToCart('${product.id}')" ${!inStock ? 'disabled' : ''}>
                    <i class="fas fa-shopping-bag"></i>
                    ${inStock ? 'Add to Cart' : 'Notify Me'}
                </button>
                <button class="wishlist-btn ${this.wishlist.has(product.id) ? 'active' : ''}" onclick="productManager.toggleWishlist('${product.id}')">
                    <i class="fa${this.wishlist.has(product.id) ? 's' : 'r'} fa-heart"></i>
                </button>
            </div>
        </div>
        `;
    }

    // ... (rest of the methods remain the same as original ProductManager)

    openQuickView(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product) return;
        
        const images = this.getProductImages(product);
        const discount = product.originalPrice ? Math.round((1 - product.price / product.originalPrice) * 100) : 0;
        const inStock = (product.stock ?? product.quantity ?? 1) > 0;
        
        // Create and show quick view modal
        const existingModal = document.querySelector('.quick-view-modal');
        if (existingModal) existingModal.remove();
        
        const modal = document.createElement('div');
        modal.className = 'quick-view-modal';
        modal.innerHTML = `
            <div class="quick-view-overlay" onclick="this.parentElement.remove()"></div>
            <div class="quick-view-content">
                <button class="quick-view-close" onclick="this.closest('.quick-view-modal').remove()">
                    <i class="fas fa-times"></i>
                </button>
                <div class="quick-view-gallery">
                    <div class="main-image-container" onclick="productManager.showImageZoom(this.querySelector('img').src, '${product.name}')">
                        <img src="${images[0]}" alt="${product.name}" class="main-image" id="quickViewMainImage">
                        <div class="zoom-hint"><i class="fas fa-search-plus"></i> Click to zoom</div>
                    </div>
                    ${images.length > 1 ? `
                    <div class="thumbnail-strip">
                        ${images.map((img, i) => `
                            <img src="${img}" alt="Thumbnail ${i+1}" class="thumbnail ${i === 0 ? 'active' : ''}" 
                                 onclick="event.stopPropagation(); document.getElementById('quickViewMainImage').src='${img}'; 
                                          document.querySelectorAll('.thumbnail').forEach(t=>t.classList.remove('active')); 
                                          this.classList.add('active');">
                        `).join('')}
                    </div>
                    ` : ''}
                    <div class="gallery-nav">
                        <button class="gallery-nav-btn prev" onclick="productManager.navigateGallery(-1, [${images.map(i => `'${i}'`).join(',')}])">
                            <i class="fas fa-chevron-left"></i>
                        </button>
                        <span class="gallery-counter" id="galleryCounter">1 / ${images.length}</span>
                        <button class="gallery-nav-btn next" onclick="productManager.navigateGallery(1, [${images.map(i => `'${i}'`).join(',')}])">
                            <i class="fas fa-chevron-right"></i>
                        </button>
                    </div>
                </div>
                <div class="quick-view-info">
                    <span class="qv-category">${product.category || 'General'}</span>
                    <h2 class="qv-title">${product.name}</h2>
                    <div class="qv-rating">
                        <div class="stars">${this.renderStars(product.rating || 0)}</div>
                        <span class="rating-text">${product.rating || 0} (${product.reviewCount || 0} reviews)</span>
                    </div>
                    <p class="qv-description">${product.description || 'No description available.'}</p>
                    
                    ${this.renderVariantSelector(product)}
                    
                    <div class="qv-pricing">
                        <span class="qv-price" id="qvPrice-${product.id}">₹${product.price?.toLocaleString() || '0'}</span>
                        ${product.originalPrice ? `<span class="qv-original">₹${product.originalPrice.toLocaleString()}</span>` : ''}
                        ${discount > 0 ? `<span class="qv-discount">${discount}% OFF</span>` : ''}
                    </div>
                    <div class="qv-seller">
                        <i class="fas fa-store"></i>
                        <span>Sold by <strong>${product.seller || product.sellerName || 'Shop'}</strong></span>
                        ${product.isVerified || product.verified ? '<i class="fas fa-check-circle verified"></i>' : ''}
                    </div>
                    <div class="qv-stock ${inStock ? 'in-stock' : 'out-of-stock'}">
                        <i class="fas ${inStock ? 'fa-check-circle' : 'fa-times-circle'}"></i>
                        ${inStock ? `In Stock (${product.stock ?? product.quantity ?? 'Available'})` : 'Out of Stock'}
                    </div>
                    <div class="qv-actions">
                        <button class="qv-add-to-cart ${!inStock ? 'disabled' : ''}" 
                                onclick="productManager.addToCartWithVariant('${product.id}'); this.closest('.quick-view-modal').remove();" 
                                ${!inStock ? 'disabled' : ''}>
                            <i class="fas fa-shopping-bag"></i>
                            ${inStock ? 'Add to Cart' : 'Notify When Available'}
                        </button>
                        <button class="qv-wishlist ${this.wishlist.has(product.id) ? 'active' : ''}" 
                                onclick="productManager.toggleWishlist('${product.id}'); this.classList.toggle('active');">
                            <i class="fa${this.wishlist.has(product.id) ? 's' : 'r'} fa-heart"></i>
                        </button>
                        <button class="qv-review-btn" 
                                onclick="productManager.showReviewForm('${product.id}');">
                            <i class="fas fa-star"></i> Write Review
                        </button>
                    </div>
                    
                    <!-- Reviews Section -->
                    <div class="qv-reviews" id="productReviews-${product.id}">
                        <div class="reviews-header">
                            <h3><i class="fas fa-comments"></i> Customer Reviews</h3>
                            <div class="reviews-summary">
                                <span class="avg-rating">${(product.rating || 0).toFixed(1)}</span>
                                <div class="summary-stars">${this.renderStars(product.rating || 0)}</div>
                                <span class="review-count">(${product.reviewCount || 0} reviews)</span>
                            </div>
                        </div>
                        <div class="reviews-list" data-product-id="${product.id}">
                            <p class="loading-reviews"><i class="fas fa-spinner fa-spin"></i> Loading reviews...</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';
        
        // Load reviews for this product
        this.loadProductReviews(product.id);
        
        // Close on escape key
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                modal.remove();
                document.body.style.overflow = '';
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
        
        // Restore scroll when modal is removed
        const observer = new MutationObserver(() => {
            if (!document.body.contains(modal)) {
                document.body.style.overflow = '';
                observer.disconnect();
            }
        });
        observer.observe(document.body, { childList: true });
    }

    addToCart(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product) return;
        
        // Sellers cannot add to cart - they should be selling, not buying
        const userData = authManager?.getUserData();
        if (userData && userData.accountType === 'seller') {
            this.showNotification('🏪 Sellers cannot add products to cart. Use a buyer account to shop!', 'warning');
            return;
        }
        
        // Gentle nudge for guests adding to cart
        if (!authManager || !authManager.getUserData()) {
            // Still allow adding to cart, but show a nudge after first item
            if (this.cart.length === 0) {
                setTimeout(() => {
                    this.showNotification('💡 Login to save your cart and get exclusive deals!', 'info');
                }, 1500);
            }
        }
        
        // Check if product is already in cart
        const existingItem = this.cart.find(item => item.id === productId);
        
        if (existingItem) {
            if (existingItem.quantity < product.stock) {
                existingItem.quantity++;
            } else {
                this.showNotification('Maximum stock reached!');
                return;
            }
        } else {
            this.cart.push({
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.image,
                quantity: 1,
                maxQuantity: product.stock,
                sellerId: product.sellerId || product.uid || null
            });
        }
        
        this.saveCartToStorage();
        this.updateCartDisplay();
        this.showNotification(`${product.name} added to cart!`);
    }

    removeFromCart(productId) {
        this.cart = this.cart.filter(item => item.id !== productId);
        this.saveCartToStorage();
        this.updateCartDisplay();
    }

    updateCartQuantity(productId, newQuantity) {
        const item = this.cart.find(item => item.id === productId);
        if (item) {
            if (newQuantity <= 0) {
                this.removeFromCart(productId);
            } else if (newQuantity <= item.maxQuantity) {
                item.quantity = newQuantity;
                this.saveCartToStorage();
                this.updateCartDisplay();
            } else {
                this.showNotification('Maximum stock reached!');
            }
        }
    }

    toggleWishlist(productId) {
        // Allow guests to add to wishlist, but show a gentle nudge to login
        const userData = authManager?.getUserData?.();
        if (!userData) {
            if (!this.wishlist.has(productId)) {
                this.showNotification('💡 Login to sync your wishlist across devices!', 'info');
            }
        }
        
        if (this.wishlist.has(productId)) {
            this.wishlist.delete(productId);
        } else {
            this.wishlist.add(productId);
        }
        this.saveWishlistToStorage();
        this.syncWishlistToFirestore();
        this.renderProducts();
    }

    loadCartFromStorage() {
        try {
            const savedCart = localStorage.getItem('69shop_cart');
            if (savedCart) {
                this.cart = JSON.parse(savedCart);
            }
        } catch (error) {
            console.error("Error loading cart:", error);
            this.cart = [];
        }
    }

    saveCartToStorage() {
        try {
            localStorage.setItem('69shop_cart', JSON.stringify(this.cart));
        } catch (error) {
            console.error("Error saving cart:", error);
        }
    }

    loadWishlistFromStorage() {
        try {
            const savedWishlist = localStorage.getItem('69shop_wishlist');
            if (savedWishlist) {
                this.wishlist = new Set(JSON.parse(savedWishlist));
            }
        } catch (error) {
            console.error("Error loading wishlist:", error);
            this.wishlist = new Set();
        }
    }

    saveWishlistToStorage() {
        try {
            localStorage.setItem('69shop_wishlist', JSON.stringify([...this.wishlist]));
        } catch (error) {
            console.error("Error saving wishlist:", error);
        }
    }

    // Firestore Wishlist Sync
    async syncWishlistToFirestore() {
        try {
            const user = auth?.currentUser;
            if (!user || !db) return;
            const wishlistArray = [...this.wishlist];
            await db.collection('users').doc(user.uid).set({
                wishlist: wishlistArray,
                wishlistUpdatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        } catch (error) {
            console.error('Wishlist Firestore sync error:', error);
        }
    }

    async loadWishlistFromFirestore() {
        try {
            const user = auth?.currentUser;
            if (!user || !db) return;
            const doc = await db.collection('users').doc(user.uid).get();
            if (doc.exists && doc.data().wishlist) {
                const firestoreWishlist = new Set(doc.data().wishlist);
                // Merge: union of local + Firestore
                const localWishlist = new Set(this.wishlist);
                const merged = new Set([...localWishlist, ...firestoreWishlist]);
                this.wishlist = merged;
                this.saveWishlistToStorage();
                // Push merged back to Firestore
                if (merged.size !== firestoreWishlist.size) {
                    this.syncWishlistToFirestore();
                }
                this.renderProducts();
                console.log('Wishlist synced from Firestore:', merged.size, 'items');
            }
        } catch (error) {
            console.error('Error loading wishlist from Firestore:', error);
        }
    }

    updateCartDisplay() {
        const cartCount = document.getElementById('cartCount');
        const cartTotal = document.getElementById('cartTotal');
        const cartItems = document.getElementById('cartItems');
        
        // Update cart count
        if (cartCount) {
            const totalItems = this.cart.reduce((sum, item) => sum + item.quantity, 0);
            cartCount.textContent = totalItems;
        }
        
        // Update cart total
        if (cartTotal) {
            const total = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            cartTotal.textContent = `₹${total.toLocaleString()}`;
        }
        
        // Update cart items display
        if (cartItems) {
            if (this.cart.length === 0) {
                cartItems.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon">
                            <i class="fas fa-shopping-cart"></i>
                        </div>
                        <h3 class="empty-state-title">Your cart is empty</h3>
                        <p class="empty-state-text">Add some products to get started!</p>
                    </div>
                `;
            } else {
                cartItems.innerHTML = this.cart.map(item => `
                    <div class="cart-item">
                        <div class="cart-item-image">
                            <img src="${item.image}" alt="${item.name}">
                        </div>
                        <div class="cart-item-details">
                            <div class="cart-item-name">${item.name}</div>
                            <div class="cart-item-price">₹${(item.price * item.quantity).toLocaleString()}</div>
                            <div class="cart-item-actions">
                                <div class="quantity-control">
                                    <button class="quantity-btn" onclick="productManager.updateCartQuantity('${item.id}', ${item.quantity - 1})">
                                        <i class="fas fa-minus"></i>
                                    </button>
                                    <span class="quantity">${item.quantity}</span>
                                    <button class="quantity-btn" onclick="productManager.updateCartQuantity('${item.id}', ${item.quantity + 1})">
                                        <i class="fas fa-plus"></i>
                                    </button>
                                </div>
                                <button class="remove-item" onclick="productManager.removeFromCart('${item.id}')">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                `).join('');
            }
        }

        if (window.checkoutManager && typeof window.checkoutManager.syncWithCart === 'function') {
            window.checkoutManager.syncWithCart();
        }
    }

    clearFilters() {
        this.currentFilters = {
            category: 'all',
            maxPrice: 50000,
            sortBy: 'featured',
            seller: 'all',
            delivery: 'any',
            searchTerm: ''
        };
        
        // Reset UI elements
        this.resetCategoryButtons();
        this.resetPriceSlider();
        this.resetSellerButtons();
        this.resetDeliveryButtons();
        
        // Reset sort buttons
        document.querySelectorAll('#sortOptions .filter-option').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.sort === 'featured') {
                btn.classList.add('active');
            }
        });
        
        this.renderProducts();
        this.updateFilterBar();
    }

    setupEventListeners() {
        // Category filters
        document.querySelectorAll('#categoryFilters .filter-option').forEach(btn => {
            btn.addEventListener('click', () => {
                // Update active state
                document.querySelectorAll('#categoryFilters .filter-option').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // Update filter
                this.currentFilters.category = btn.dataset.category;
                this.renderProducts();
                this.updateFilterBar();
            });
        });
        
        // Price range
        const priceRange = document.getElementById('priceRange');
        const maxPriceValue = document.getElementById('maxPriceValue');
        
        if (priceRange) {
            priceRange.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                this.currentFilters.maxPrice = value;
                
                if (maxPriceValue) {
                    maxPriceValue.textContent = `₹${value.toLocaleString()}`;
                }
            });
            
            priceRange.addEventListener('change', () => {
                this.renderProducts();
                this.updateFilterBar();
            });
        }
        
        // Sort options
        document.querySelectorAll('#sortOptions .filter-option').forEach(btn => {
            btn.addEventListener('click', () => {
                // Update active state
                document.querySelectorAll('#sortOptions .filter-option').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // Update sort
                this.currentFilters.sortBy = btn.dataset.sort;
                this.renderProducts();
            });
        });
        
        // Seller filters
        document.querySelectorAll('#sellerFilters .filter-option').forEach(btn => {
            btn.addEventListener('click', () => {
                // Update active state
                document.querySelectorAll('#sellerFilters .filter-option').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // Update filter
                this.currentFilters.seller = btn.dataset.seller;
                this.renderProducts();
                this.updateFilterBar();
            });
        });
        
        // Delivery filters
        document.querySelectorAll('#deliveryFilters .filter-option').forEach(btn => {
            btn.addEventListener('click', () => {
                // Update active state
                document.querySelectorAll('#deliveryFilters .filter-option').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // Update filter
                this.currentFilters.delivery = btn.dataset.delivery;
                this.renderProducts();
                this.updateFilterBar();
            });
        });
        
        // Clear filters button
        const clearFiltersBtn = document.getElementById('clearFilters');
        if (clearFiltersBtn) {
            clearFiltersBtn.addEventListener('click', () => this.clearFilters());
        }
        
        // Reset filters button
        const resetFiltersBtn = document.getElementById('resetFiltersBtn');
        if (resetFiltersBtn) {
            resetFiltersBtn.addEventListener('click', () => this.clearFilters());
        }
        
        // Clear all filters in filter bar
        const clearAllFiltersBtn = document.getElementById('clearAllFilters');
        if (clearAllFiltersBtn) {
            clearAllFiltersBtn.addEventListener('click', () => this.clearFilters());
        }
        
        // Toggle filters button in filter bar
        const toggleFiltersBtn = document.getElementById('toggleFilters');
        if (toggleFiltersBtn) {
            toggleFiltersBtn.addEventListener('click', () => {
                if (window.uiManager && typeof uiManager.toggleFiltersSidebar === 'function') {
                    uiManager.toggleFiltersSidebar();
                } else {
                    const filtersSidebar = document.getElementById('filtersSidebar');
                    if (filtersSidebar) {
                        filtersSidebar.classList.toggle('active');
                    }
                }
            });
        }
    }

    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: ${type === 'error' ? '#FF6B6B' : 'var(--blue-primary)'};
            color: white;
            padding: 12px 20px;
            border-radius: var(--radius-md);
            box-shadow: var(--shadow-lg);
            z-index: 9999;
            transform: translateX(100%);
            transition: transform 0.3s ease;
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 0.9rem;
        `;
        notification.innerHTML = `
            <i class="fas ${type === 'error' ? 'fa-exclamation-circle' : 'fa-check-circle'}"></i>
            ${message}
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 10);
        
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 2000);
    }
}

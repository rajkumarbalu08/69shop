class SearchManager {
    constructor(productManager) {
        this.productManager = productManager;
        this.searchInput = document.getElementById('searchInput');
        this.searchResults = document.getElementById('searchResults');
        this.searchTimeout = null;
        this.allProducts = [];
        this.allProviders = [];
        this.popularQueries = ['mobile phone', 'headphones', 'laptop', 'fashion', 'home decor', 'electronics'];
        this.latestTerm = '';
        this.isSearchActive = false;
        this.searchHistory = this.loadSearchHistory();
        this.initializeSearch();

        if (this.productManager && typeof this.productManager.onProductsUpdated === 'function') {
            this.productManager.onProductsUpdated((products) => {
                this.allProducts = [...products];
            });
        }
    }
    
    // Search History Management
    loadSearchHistory() {
        try {
            return JSON.parse(localStorage.getItem('69shop_search_history') || '[]');
        } catch {
            return [];
        }
    }
    
    // Normalize word for better search matching (handles plurals/variations)
    normalizeWord(word) {
        if (!word || word.length < 3) return word;
        const w = word.toLowerCase();
        
        // Common plural/suffix rules
        const suffixes = [
            { pattern: /ies$/i, replacement: 'y' },     // batteries -> battery
            { pattern: /ves$/i, replacement: 'f' },     // leaves -> leaf
            { pattern: /oes$/i, replacement: 'o' },     // tomatoes -> tomato
            { pattern: /ses$/i, replacement: 's' },     // glasses -> glass
            { pattern: /xes$/i, replacement: 'x' },     // boxes -> box
            { pattern: /ches$/i, replacement: 'ch' },   // watches -> watch
            { pattern: /shes$/i, replacement: 'sh' },   // brushes -> brush
            { pattern: /ing$/i, replacement: '' },      // running -> runn (close enough)
            { pattern: /ed$/i, replacement: '' },       // planted -> plant
            { pattern: /s$/i, replacement: '' }         // plants -> plant
        ];
        
        for (const { pattern, replacement } of suffixes) {
            if (pattern.test(w)) {
                return w.replace(pattern, replacement);
            }
        }
        return w;
    }
    
    // ADVANCED SEARCH: Synonym dictionary for common product terms
    getSynonyms(word) {
        const w = word.toLowerCase();
        const synonymMap = {
            // Footwear
            'sneakers': ['shoes', 'footwear', 'trainers', 'kicks', 'running shoes', 'sports shoes', 'athletic shoes'],
            'shoes': ['sneakers', 'footwear', 'trainers', 'boots', 'sandals', 'loafers'],
            'boots': ['shoes', 'footwear', 'ankle boots', 'hiking boots'],
            'sandals': ['shoes', 'footwear', 'flip flops', 'slippers'],
            'slippers': ['footwear', 'sandals', 'home shoes'],
            
            // Electronics
            'phone': ['mobile', 'smartphone', 'cellphone', 'handset', 'iphone', 'android'],
            'mobile': ['phone', 'smartphone', 'cellphone'],
            'smartphone': ['phone', 'mobile', 'cellphone'],
            'laptop': ['notebook', 'computer', 'macbook', 'chromebook', 'pc'],
            'computer': ['laptop', 'pc', 'desktop', 'notebook'],
            'headphones': ['earphones', 'earbuds', 'headset', 'audio', 'airpods', 'wireless earbuds'],
            'earphones': ['headphones', 'earbuds', 'airpods'],
            'earbuds': ['headphones', 'earphones', 'airpods', 'wireless earbuds'],
            'tv': ['television', 'smart tv', 'led tv', 'oled'],
            'television': ['tv', 'smart tv'],
            'speaker': ['speakers', 'bluetooth speaker', 'soundbar', 'audio'],
            'watch': ['smartwatch', 'timepiece', 'wristwatch', 'fitness tracker'],
            'smartwatch': ['watch', 'fitness band', 'fitness tracker', 'wearable'],
            'camera': ['dslr', 'mirrorless', 'photography', 'gopro'],
            'tablet': ['ipad', 'tab', 'android tablet'],
            
            // Clothing
            'shirt': ['tshirt', 't-shirt', 'top', 'blouse', 'polo'],
            'tshirt': ['shirt', 't-shirt', 'top', 'tee'],
            't-shirt': ['shirt', 'tshirt', 'top', 'tee'],
            'pants': ['trousers', 'jeans', 'bottoms', 'chinos'],
            'jeans': ['pants', 'denim', 'trousers'],
            'dress': ['gown', 'frock', 'outfit'],
            'jacket': ['coat', 'blazer', 'hoodie', 'sweater'],
            'hoodie': ['jacket', 'sweatshirt', 'pullover'],
            
            // Home
            'sofa': ['couch', 'settee', 'loveseat', 'furniture'],
            'couch': ['sofa', 'settee', 'furniture'],
            'bed': ['mattress', 'cot', 'bedroom'],
            'mattress': ['bed', 'foam mattress', 'spring mattress'],
            'chair': ['seat', 'stool', 'armchair', 'office chair'],
            'table': ['desk', 'dining table', 'coffee table'],
            'lamp': ['light', 'lighting', 'bulb', 'led light'],
            'curtains': ['drapes', 'blinds', 'window covering'],
            
            // Beauty
            'makeup': ['cosmetics', 'beauty', 'lipstick', 'foundation'],
            'cosmetics': ['makeup', 'beauty products'],
            'skincare': ['skin care', 'face cream', 'moisturizer', 'serum'],
            'perfume': ['fragrance', 'cologne', 'scent', 'deodorant'],
            
            // Sports
            'gym': ['fitness', 'workout', 'exercise', 'training'],
            'fitness': ['gym', 'workout', 'exercise', 'sports'],
            'yoga': ['mat', 'exercise', 'fitness'],
            'cricket': ['bat', 'ball', 'sports'],
            'football': ['soccer', 'sports', 'ball'],
            
            // General
            'bag': ['backpack', 'handbag', 'purse', 'luggage', 'suitcase'],
            'backpack': ['bag', 'rucksack', 'school bag'],
            'wallet': ['purse', 'money clip', 'card holder'],
            'glasses': ['spectacles', 'eyewear', 'sunglasses', 'eyeglasses'],
            'sunglasses': ['shades', 'glasses', 'eyewear'],
            'charger': ['charging', 'power adapter', 'cable'],
            'cable': ['wire', 'cord', 'charger', 'usb'],
            'cover': ['case', 'protector', 'sleeve'],
            'case': ['cover', 'protector', 'pouch'],
            
            // Kids/Toys
            'toys': ['games', 'playset', 'action figure', 'doll'],
            'games': ['toys', 'board game', 'video game', 'puzzle'],
            
            // Books
            'book': ['books', 'novel', 'ebook', 'textbook', 'reading'],
            'novel': ['book', 'fiction', 'story']
        };
        
        // Check direct match
        if (synonymMap[w]) {
            return synonymMap[w];
        }
        
        // Check if word appears in any synonym list (reverse lookup)
        for (const [key, values] of Object.entries(synonymMap)) {
            if (values.includes(w)) {
                return [key, ...values.filter(v => v !== w)];
            }
        }
        
        return [];
    }
    
    // ADVANCED SEARCH: Fuzzy matching using Levenshtein distance
    levenshteinDistance(str1, str2) {
        const m = str1.length;
        const n = str2.length;
        const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
        
        for (let i = 0; i <= m; i++) dp[i][0] = i;
        for (let j = 0; j <= n; j++) dp[0][j] = j;
        
        for (let i = 1; i <= m; i++) {
            for (let j = 1; j <= n; j++) {
                if (str1[i-1] === str2[j-1]) {
                    dp[i][j] = dp[i-1][j-1];
                } else {
                    dp[i][j] = 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
                }
            }
        }
        return dp[m][n];
    }
    
    // Check if two words are similar (fuzzy match)
    isFuzzyMatch(word1, word2, threshold = 2) {
        if (!word1 || !word2) return false;
        const w1 = word1.toLowerCase();
        const w2 = word2.toLowerCase();
        
        // Exact match
        if (w1 === w2) return true;
        
        // Contains match
        if (w1.includes(w2) || w2.includes(w1)) return true;
        
        // Length difference too large
        if (Math.abs(w1.length - w2.length) > threshold) return false;
        
        // For short words, require closer match
        const maxDistance = Math.min(threshold, Math.floor(Math.max(w1.length, w2.length) / 3));
        
        return this.levenshteinDistance(w1, w2) <= maxDistance;
    }
    
    // Get all search variants including synonyms and normalized forms
    getAdvancedSearchVariants(word) {
        const variants = new Set();
        const w = word.toLowerCase();
        
        // Original word
        variants.add(w);
        
        // Normalized (stemmed) word
        const normalized = this.normalizeWord(w);
        if (normalized) variants.add(normalized);
        
        // Plural form
        if (w.length >= 3) variants.add(w + 's');
        
        // Synonyms
        const synonyms = this.getSynonyms(w);
        synonyms.forEach(syn => variants.add(syn.toLowerCase()));
        
        // Also get synonyms for normalized form
        const normSynonyms = this.getSynonyms(normalized);
        normSynonyms.forEach(syn => variants.add(syn.toLowerCase()));
        
        return [...variants];
    }
    
    saveSearchHistory() {
        localStorage.setItem('69shop_search_history', JSON.stringify(this.searchHistory.slice(0, 10)));
    }
    
    addToSearchHistory(query) {
        if (!query || query.length < 2) return;
        // Remove if exists already
        this.searchHistory = this.searchHistory.filter(h => h.toLowerCase() !== query.toLowerCase());
        // Add to beginning
        this.searchHistory.unshift(query);
        // Keep only last 10
        this.searchHistory = this.searchHistory.slice(0, 10);
        this.saveSearchHistory();
    }
    
    removeFromSearchHistory(query) {
        this.searchHistory = this.searchHistory.filter(h => h.toLowerCase() !== query.toLowerCase());
        this.saveSearchHistory();
    }
    
    clearSearchHistory() {
        this.searchHistory = [];
        this.saveSearchHistory();
        this.showEmptySearchState();
    }

    async initializeSearch() {
        await this.loadAllData();

        this.searchInput.addEventListener('input', (event) => this.handleSearch(event));
        this.searchInput.addEventListener('focus', () => {
            if (this.searchInput.value.trim()) {
                this.showSearchResults();
            } else {
                this.showEmptySearchState();
            }
        });
        this.searchInput.addEventListener('blur', () => {
            setTimeout(() => this.hideSearchResults(), 200);
        });
        
        // Keyboard navigation for search
        this.selectedIndex = -1;
        this.searchInput.addEventListener('keydown', (event) => {
            const items = this.searchResults.querySelectorAll('.search-result-item, .search-suggestion, .search-quick-chip');
            
            if (event.key === 'ArrowDown') {
                event.preventDefault();
                this.selectedIndex = Math.min(this.selectedIndex + 1, items.length - 1);
                this.updateSelectedItem(items);
            } else if (event.key === 'ArrowUp') {
                event.preventDefault();
                this.selectedIndex = Math.max(this.selectedIndex - 1, -1);
                this.updateSelectedItem(items);
            } else if (event.key === 'Enter') {
                event.preventDefault();
                if (this.selectedIndex >= 0 && items[this.selectedIndex]) {
                    // Trigger click on selected item
                    items[this.selectedIndex].click();
                } else if (this.searchInput.value.trim()) {
                    this.executeFullSearch(this.searchInput.value.trim());
                    // Blur input on mobile to close keyboard and hide suggestions
                    this.searchInput.blur();
                }
            } else if (event.key === 'Escape') {
                this.hideSearchResults();
                this.searchInput.blur();
                this.selectedIndex = -1;
            }
        });

        document.addEventListener('click', (event) => {
            if (!this.searchInput.contains(event.target) && !this.searchResults.contains(event.target)) {
                this.hideSearchResults();
            }
        });
    }

    async loadAllData() {
        if (this.productManager?.readyPromise) {
            await this.productManager.readyPromise;
        }
        this.allProducts = this.productManager?.products ? [...this.productManager.products] : [];
        this.allProviders = [
            { name: 'Rajesh Mehta', category: 'Home Services', type: 'provider' },
            { name: 'Priya Sharma', category: 'Beauty & Wellness', type: 'provider' },
            { name: 'Anjali Verma', category: 'Tutoring & Education', type: 'provider' },
            { name: 'Suresh Kumar', category: 'Electronics Repair', type: 'provider' }
        ];
    }

    handleSearch(event) {
        const rawTerm = event.target.value || '';
        const normalizedTerm = rawTerm.trim().toLowerCase();
        this.latestTerm = rawTerm;

        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }

        if (!normalizedTerm) {
            this.hideSearchResults();
            // Reset to grid view if search is cleared
            if (this.isSearchActive) {
                this.isSearchActive = false;
                this.productManager?.setViewMode('grid');
                this.productManager?.filterBySearch('');
            }
            return;
        }

        this.searchTimeout = setTimeout(() => {
            this.performSearch(normalizedTerm, rawTerm.trim());
        }, 250);
    }

    performSearch(normalizedTerm, originalTerm = normalizedTerm) {
        if (!normalizedTerm) {
            this.hideSearchResults();
            return;
        }
        
        // Parse filters from search term
        const { baseQuery, filters } = this.parseSearchFilters(normalizedTerm);
        
        // If filters were found, apply them and show products matching those filters
        if (Object.keys(filters).length > 0) {
            // Apply filters to product manager
            this.applyExtractedFilters(filters, baseQuery);
            
            // Get filtered products
            const matches = this.getFilteredProductMatches(baseQuery, filters);
            
            // Show only the matching products, no suggestions
            this.displaySearchResults(matches, originalTerm, []);
        } else {
            // No filters found, show normal suggestions
            const matches = this.buildSearchMatches(normalizedTerm);
            const suggestions = this.generateSmartSuggestions(normalizedTerm);
            this.displaySearchResults(matches, originalTerm, suggestions);
        }
        
        this.showSearchResults();
    }
    
    // Parse search term and extract filters
    parseSearchFilters(searchTerm) {
        let baseQuery = searchTerm;
        const filters = {};
        
        // Check for "under XXXX" price filter
        const underMatch = searchTerm.match(/under\s+(\d+)/i);
        if (underMatch) {
            const priceLimit = parseInt(underMatch[1]);
            filters.maxPrice = priceLimit;
            baseQuery = baseQuery.replace(/\s*under\s+\d+\s*/i, ' ').trim();
        }
        
        // Check for "best" sorting filter
        if (searchTerm.toLowerCase().includes('best')) {
            filters.sortBy = 'rating';
            baseQuery = baseQuery.replace(/\s*best\s*/i, ' ').trim();
        }
        
        // Check for "fast delivery" or "1 day" filter
        if (searchTerm.toLowerCase().includes('fast delivery') || searchTerm.toLowerCase().includes('1 day')) {
            filters.delivery = '1day';
            baseQuery = baseQuery.replace(/\s*(fast\s*delivery|1\s*day)\s*/i, ' ').trim();
        }
        
        return { baseQuery, filters };
    }
    
    // Apply extracted filters to productManager
    applyExtractedFilters(filters, baseQuery) {
        if (!this.productManager) return;
        
        // Create fresh filter state
        this.productManager.currentFilters = {
            category: 'all',
            maxPrice: filters.maxPrice || 50000,
            sortBy: filters.sortBy || 'featured',
            seller: 'all',
            delivery: filters.delivery || 'any',
            searchTerm: baseQuery
        };
        
        // Update price range UI if max price was set
        if (filters.maxPrice) {
            const priceRange = document.getElementById('priceRange');
            const maxPriceValue = document.getElementById('maxPriceValue');
            if (priceRange) priceRange.value = filters.maxPrice;
            if (maxPriceValue) maxPriceValue.textContent = `₹${filters.maxPrice.toLocaleString()}`;
        }
    }
    
    // Get products that match the base query and filters (for dropdown preview)
    getFilteredProductMatches(baseQuery, filters) {
        const results = [];
        const termWords = baseQuery.toLowerCase().split(/\s+/).filter(w => w.length > 1);
        
        this.allProducts.forEach(product => {
            const productName = product.name.toLowerCase();
            const productDescription = product.description.toLowerCase();
            const productCategory = product.category.toLowerCase();
            const productBrand = (product.brand || '').toLowerCase();
            const productTags = (product.tags || []).map(t => t.toLowerCase());
            const productPrice = product.price || 0;
            let score = 0;
            
            // Check price filter first
            if (filters.maxPrice && productPrice > filters.maxPrice) {
                return; // Skip if exceeds price limit
            }
            
            // Check base query match
            if (termWords.length === 0) {
                score = 1; // Basic match - just price filter
            } else {
                // Check if product matches the query (name, description, category, brand, or tags)
                const matchesQuery = termWords.some(word => 
                    productName.includes(word) || 
                    productDescription.includes(word) ||
                    productCategory.includes(word) ||
                    productBrand.includes(word) ||
                    productTags.some(tag => tag.includes(word))
                );
                
                if (!matchesQuery) return; // Skip if doesn't match
                
                // Score based on relevance
                if (productName.includes(baseQuery)) score += 15;
                if (productBrand.includes(baseQuery)) score += 12;
                termWords.forEach(word => {
                    if (productName.includes(word)) score += 8;
                    if (productBrand.includes(word)) score += 7;
                    productTags.forEach(tag => {
                        if (tag.includes(word)) score += 6;
                    });
                    if (productDescription.includes(word)) score += 4;
                    if (productCategory.includes(word)) score += 3;
                });
            }
            
            if (score > 0) {
                results.push({ ...product, type: 'product', relevance: score });
            }
        });
        
        // Sort and return top results
        return results.sort((a, b) => b.relevance - a.relevance).slice(0, 8);
    }
    
    // Execute full search and switch to list view
    executeFullSearch(searchTerm, openSearchPage = false) {
        this.hideSearchResults();
        
        // Save to search history
        this.addToSearchHistory(searchTerm);
        
        // Option to open dedicated search page for comprehensive results
        if (openSearchPage) {
            window.location.href = `/search.html?q=${encodeURIComponent(searchTerm)}`;
            return;
        }
        
        this.isSearchActive = true;
        
        // Parse filters from search term
        const { baseQuery, filters } = this.parseSearchFilters(searchTerm.toLowerCase());
        
        // Apply filters if any were found
        if (Object.keys(filters).length > 0) {
            this.applyExtractedFilters(filters, baseQuery);
            if (this.productManager) {
                this.productManager.currentFilters.searchTerm = baseQuery;
                this.productManager.viewMode = 'list';
                this.productManager.renderProducts();
                this.productManager.updateFilterBar();
            }
        } else {
            // No filters found, just search normally
            this.productManager?.setViewMode('list');
            this.productManager?.filterBySearch(searchTerm);
        }
        
        // Scroll to products section
        const productsGrid = document.getElementById('productsGrid');
        if (productsGrid) {
            productsGrid.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        
        this.showNotification(`Showing results for "${searchTerm}"`);
    }
    
    // Open dedicated search page for a brand
    searchBrand(brand) {
        window.location.href = `/search.html?brand=${encodeURIComponent(brand)}`;
    }
    
    // Open dedicated search page for a category
    searchCategory(category) {
        window.location.href = `/search.html?category=${encodeURIComponent(category)}`;
    }

    buildSearchMatches(searchTerm) {
        const results = [];
        const termWords = searchTerm.split(/\s+/).filter(w => w.length > 1);
        
        // ADVANCED SEARCH: Get all variants including synonyms
        const termVariants = termWords.flatMap(w => this.getAdvancedSearchVariants(w));
        const searchVariants = this.getAdvancedSearchVariants(searchTerm);
        
        // Also keep original term for exact matching
        searchVariants.push(searchTerm);
        
        this.allProducts.forEach(product => {
            const productName = product.name.toLowerCase();
            const productDescription = product.description.toLowerCase();
            const productCategory = product.category.toLowerCase();
            const productSeller = product.seller.toLowerCase();
            const productBrand = (product.brand || '').toLowerCase();
            const productTags = (product.tags || []).map(t => t.toLowerCase());
            const normalizedTags = productTags.map(t => this.normalizeWord(t));
            
            // Combine all searchable text for fuzzy matching
            const allProductText = [productName, productBrand, ...productTags, productCategory].join(' ');
            
            let score = 0;
            
            // PRIORITY 1: Exact name match (highest score)
            if (productName.includes(searchTerm)) score += 25;
            
            // PRIORITY 2: Exact tag match
            if (productTags.includes(searchTerm)) score += 20;
            
            // PRIORITY 3: Check all search variants (including synonyms)
            searchVariants.forEach(variant => {
                if (productName.includes(variant)) score += 15;
                if (productBrand.includes(variant)) score += 12;
                if (productTags.some(t => t === variant)) score += 12;
                if (productTags.some(t => t.includes(variant))) score += 10;
                if (normalizedTags.some(t => t === variant || t.includes(variant))) score += 8;
            });
            
            // PRIORITY 4: Word-by-word matching with synonyms
            termVariants.forEach(word => {
                if (productName.includes(word)) score += 8;
                if (productBrand.includes(word)) score += 7;
                productTags.forEach((tag, idx) => {
                    if (tag.includes(word) || normalizedTags[idx]?.includes(word)) score += 6;
                });
                if (productDescription.includes(word)) score += 4;
                if (productCategory.includes(word)) score += 3;
                if (productSeller.includes(word)) score += 2;
            });
            
            // PRIORITY 5: Fuzzy matching for typos (only if no exact matches)
            if (score === 0 && searchTerm.length >= 4) {
                const searchWords = searchTerm.split(/\s+/);
                searchWords.forEach(searchWord => {
                    if (searchWord.length < 3) return;
                    
                    // Check fuzzy match against name words
                    const nameWords = productName.split(/\s+/);
                    nameWords.forEach(nameWord => {
                        if (this.isFuzzyMatch(searchWord, nameWord)) score += 5;
                    });
                    
                    // Check fuzzy match against tags
                    productTags.forEach(tag => {
                        if (this.isFuzzyMatch(searchWord, tag)) score += 4;
                    });
                    
                    // Check fuzzy match against brand
                    if (this.isFuzzyMatch(searchWord, productBrand)) score += 4;
                });
            }
            
            if (score > 0) {
                results.push({ ...product, type: 'product', relevance: score });
            }
        });

        this.allProviders.forEach(provider => {
            const providerName = provider.name.toLowerCase();
            const providerCategory = provider.category.toLowerCase();
            let score = 0;
            if (providerName.includes(searchTerm)) score += 10;
            if (providerCategory.includes(searchTerm)) score += 5;
            // Check synonyms for providers too
            searchVariants.forEach(variant => {
                if (providerCategory.includes(variant)) score += 3;
            });
            if (score > 0) {
                results.push({ ...provider, type: 'provider', relevance: score });
            }
        });

        return results.sort((a, b) => b.relevance - a.relevance).slice(0, 10);
    }

    generateSmartSuggestions(searchTerm) {
        if (!searchTerm) return [];
        const termDisplay = searchTerm.charAt(0).toUpperCase() + searchTerm.slice(1);
        const suggestions = [];
        
        // ADVANCED: Get synonyms for suggesting related searches
        const synonyms = this.getSynonyms(searchTerm);
        
        // Find matching products using advanced search (includes synonyms)
        const searchVariants = this.getAdvancedSearchVariants(searchTerm);
        const matchingProducts = this.allProducts.filter(p => {
            const name = p.name.toLowerCase();
            const tags = (p.tags || []).map(t => t.toLowerCase());
            const category = p.category.toLowerCase();
            const brand = (p.brand || '').toLowerCase();
            
            return searchVariants.some(variant =>
                name.includes(variant) || 
                category.includes(variant) ||
                brand.includes(variant) ||
                tags.some(t => t.includes(variant) || variant.includes(t))
            );
        });
        
        // Determine price ranges based on matching products
        const prices = matchingProducts.map(p => p.price);
        const minPrice = Math.min(...prices) || 500;
        const maxProductPrice = Math.max(...prices) || 50000;
        
        // Smart price suggestions based on actual product range
        const smartPriceRanges = [];
        if (maxProductPrice > 1000) smartPriceRanges.push({ price: 1000, label: 'Budget' });
        if (maxProductPrice > 5000) smartPriceRanges.push({ price: 5000, label: 'Mid-range' });
        if (maxProductPrice > 10000) smartPriceRanges.push({ price: 10000, label: 'Premium' });
        if (maxProductPrice > 25000) smartPriceRanges.push({ price: 25000, label: 'High-end' });
        
        // Base search suggestion
        suggestions.push({
            icon: 'fa-search',
            label: termDisplay,
            sublabel: `${matchingProducts.length} products found`,
            query: searchTerm,
            type: 'search'
        });
        
        // Smart price-based suggestions (only show relevant ones)
        smartPriceRanges.slice(0, 3).forEach(range => {
            const count = matchingProducts.filter(p => p.price <= range.price).length;
            if (count > 0) {
                suggestions.push({
                    icon: 'fa-rupee-sign',
                    label: `${termDisplay} under ₹${range.price.toLocaleString()}`,
                    sublabel: `${count} ${range.label.toLowerCase()} options`,
                    query: `${searchTerm} under ${range.price}`,
                    type: 'price',
                    maxPrice: range.price
                });
            }
        });
        
        // Extract unique brands from matching products
        const brands = [...new Set(matchingProducts.map(p => p.brand).filter(Boolean))].slice(0, 2);
        brands.forEach(brand => {
            const brandCount = matchingProducts.filter(p => p.brand === brand).length;
            suggestions.push({
                icon: 'fa-star',
                label: `${brand} ${termDisplay}`,
                sublabel: `${brandCount} products from ${brand}`,
                query: `${brand} ${searchTerm}`,
                type: 'brand'
            });
        });
        
        // Extract unique tags from matching products for feature filters
        const allTags = matchingProducts.flatMap(p => p.tags || []);
        const tagCounts = {};
        allTags.forEach(tag => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
        const popularTags = Object.entries(tagCounts)
            .filter(([tag]) => !tag.includes('under') && tag !== searchTerm && tag.length > 2)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 2);
        
        popularTags.forEach(([tag, count]) => {
            suggestions.push({
                icon: 'fa-tag',
                label: `${termDisplay} - ${tag}`,
                sublabel: `${count} products with this feature`,
                query: `${searchTerm} ${tag}`,
                type: 'feature'
            });
        });
        
        // Top rated suggestion
        const highRated = matchingProducts.filter(p => p.rating >= 4.5).length;
        if (highRated > 0) {
            suggestions.push({
                icon: 'fa-fire',
                label: `Best rated ${termDisplay}`,
                sublabel: `${highRated} top-rated products`,
                query: `best ${searchTerm}`,
                type: 'trending'
            });
        }

        return suggestions.slice(0, 8);
    }

    displaySearchResults(results, originalTerm, suggestions = []) {
        if (!results.length && !suggestions.length) {
            this.renderEmptyState(originalTerm);
            return;
        }

        const markup = [];
        
        // Suggestions section (Amazon/Flipkart style)
        if (suggestions.length) {
            markup.push(`
                <div class="search-suggestions-block">
                    <div class="search-suggestion-list">
                        ${suggestions.map(suggestion => `
                            <button type="button" class="search-suggestion" 
                                    data-search-suggestion="${suggestion.query}"
                                    data-suggestion-type="${suggestion.type}"
                                    ${suggestion.maxPrice ? `data-max-price="${suggestion.maxPrice}"` : ''}
                                    ${suggestion.category ? `data-category="${suggestion.category}"` : ''}>
                                <i class="fas ${suggestion.icon}"></i>
                                <div class="suggestion-text">
                                    <span class="suggestion-label">${suggestion.label}</span>
                                    <span class="suggestion-sublabel">${suggestion.sublabel}</span>
                                </div>
                                <i class="fas fa-arrow-right suggestion-arrow"></i>
                            </button>
                        `).join('')}
                    </div>
                </div>
            `);
        }

        // Product results preview
        if (results.length) {
            markup.push(`
                <div class="search-results-header">
                    <span>Products</span>
                    <button type="button" class="view-all-btn" data-search-term="${originalTerm}">
                        View all ${results.length}+ results <i class="fas fa-chevron-right"></i>
                    </button>
                </div>
            `);
            markup.push('<div class="search-results-list">');
            markup.push(results.slice(0, 5).map(item => `
                <div class="search-result-item" data-id="${item.id || item.name}" data-type="${item.type}" data-query="${item.name}">
                    <div class="search-result-image">
                        <img src="${item.image || 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80'}" alt="${item.name}">
                    </div>
                    <div class="search-result-info">
                        <div class="search-result-name">${item.name}</div>
                        ${item.price ? `<div class="search-result-price">₹${item.price.toLocaleString()}</div>` : ''}
                        <div class="search-result-category">
                            ${item.type === 'product' ? `<i class="fas fa-tag"></i> ${item.category}` : `<i class="fas fa-user"></i> Service Provider`}
                            ${item.rating ? `<span class="search-result-rating"><i class="fas fa-star"></i> ${item.rating.toFixed(1)}</span>` : ''}
                        </div>
                    </div>
                    <i class="fas fa-chevron-right" style="color: var(--text-light);"></i>
                </div>
            `).join(''));
            markup.push('</div>');
        }

        this.searchResults.innerHTML = markup.join('');
        this.attachSearchResultHandlers();
    }

    renderEmptyState(searchTerm) {
        this.searchResults.innerHTML = `
            <div class="search-no-results">
                <i class="fas fa-search" style="font-size: 2rem; margin-bottom: 10px; opacity: 0.5;"></i>
                <p>No results found for "${searchTerm}"</p>
                <p style="font-size: 0.9rem; color: var(--text-light); margin-top: 8px;">Try different keywords or explore popular searches</p>
                <div class="search-quick-chips">
                    ${this.popularQueries.map(query => `
                        <button type="button" class="search-quick-chip" data-search-suggestion="${query}">
                            <i class="fas fa-fire"></i>
                            <span>${query}</span>
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
        this.attachSearchResultHandlers();
    }

    attachSearchResultHandlers() {
        // Product click handlers - use mousedown to prevent blur from hiding dropdown
        this.searchResults.querySelectorAll('.search-result-item').forEach((item) => {
            item.style.cursor = 'pointer';
            item.addEventListener('mousedown', (event) => {
                event.preventDefault(); // Keep dropdown visible
                event.stopPropagation();
                const { id, type, query } = item.dataset;
                this.handleSearchResultClick({ id, type, query });
            });
        });

        // Suggestion click handlers with enhanced functionality - use mousedown to prevent blur
        this.searchResults.querySelectorAll('[data-search-suggestion]').forEach((button) => {
            button.style.cursor = 'pointer';
            button.addEventListener('mousedown', (event) => {
                event.preventDefault();
                event.stopPropagation();
                const query = button.dataset.searchSuggestion;
                const type = button.dataset.suggestionType;
                const maxPrice = button.dataset.maxPrice;
                const category = button.dataset.category;
                
                this.handleSuggestionClick({ query, type, maxPrice, category });
            });
        });
        
        // View all results button - redirects to dedicated search page
        this.searchResults.querySelectorAll('.view-all-btn').forEach((btn) => {
            btn.addEventListener('mousedown', (event) => {
                event.preventDefault();
                const searchTerm = btn.dataset.searchTerm;
                // Open dedicated search page for comprehensive results
                this.executeFullSearch(searchTerm, true);
            });
        });
    }
    
    handleSuggestionClick({ query, type, maxPrice, category }) {
        this.hideSearchResults();
        this.isSearchActive = true;
        
        // Extract base search term (remove filter words)
        const baseQuery = query.split(' ').filter(w => 
            !['under', 'best', 'fast', 'delivery', 'with'].includes(w.toLowerCase()) &&
            !/^\d+$/.test(w) // Remove standalone numbers like "1000", "5000"
        ).join(' ').trim();
        
        // Reset filters without rendering (we'll render at the end)
        if (this.productManager) {
            // Manually reset the filters object
            this.productManager.currentFilters = {
                category: 'all',
                maxPrice: 50000,
                sortBy: 'featured',
                seller: 'all',
                delivery: 'any',
                searchTerm: baseQuery
            };
            
            // Apply specific filters based on suggestion type
            if (type === 'price' && maxPrice) {
                const priceValue = parseInt(maxPrice);
                this.productManager.currentFilters.maxPrice = priceValue;
                // Update UI slider
                const priceRange = document.getElementById('priceRange');
                const maxPriceValue = document.getElementById('maxPriceValue');
                if (priceRange) priceRange.value = priceValue;
                if (maxPriceValue) maxPriceValue.textContent = `₹${priceValue.toLocaleString()}`;
                console.log('Price filter set to:', priceValue);
            }
            if (type === 'category' && category) {
                this.productManager.currentFilters.category = category;
            }
            if (type === 'delivery') {
                this.productManager.currentFilters.delivery = '1day';
            }
            if (type === 'trending') {
                this.productManager.currentFilters.sortBy = 'rating';
            }
            
            // Set view mode and render once
            this.productManager.viewMode = 'list';
            this.productManager.renderProducts();
            this.productManager.updateFilterBar();
        }
        
        this.searchInput.value = query;
        console.log('Search applied - term:', baseQuery, 'type:', type, 'maxPrice:', maxPrice, 'currentFilters:', this.productManager?.currentFilters);
        
        // Scroll to products
        const productsGrid = document.getElementById('productsGrid');
        if (productsGrid) {
            productsGrid.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        
        this.showNotification(`Showing results for "${query}"`);
    }

    handleSearchResultClick({ id, type, query }) {
        if (type === 'product') {
            this.isSearchActive = true;
            this.productManager?.setViewMode('list');
            this.navigateToProduct(id, query);
        } else if (type === 'provider') {
            const providersSection = document.querySelector('.service-providers-section');
            if (providersSection) {
                providersSection.scrollIntoView({ behavior: 'smooth' });
                this.showNotification(`Connecting you with ${query}`);
            }
        }
        this.searchInput.value = '';
        this.hideSearchResults();
    }

    navigateToProduct(productId, fallbackQuery = '') {
        const productCard = document.querySelector(`.product-card[data-id="${productId}"], .product-list-item[data-id="${productId}"]`);
        if (productCard) {
            this.highlightProductInGrid(productCard);
            return;
        }

        const matchingProduct = this.allProducts.find(product => product.id === productId);
        const term = matchingProduct?.name || fallbackQuery || '';
        if (term) {
            this.productManager?.filterBySearch(term);
            setTimeout(() => {
                const refreshedCard = document.querySelector(`.product-card[data-id="${productId}"], .product-list-item[data-id="${productId}"]`);
                if (refreshedCard) {
                    this.highlightProductInGrid(refreshedCard);
                }
            }, 350);
        }
    }

    applySuggestion(query) {
        this.searchInput.value = query;
        this.searchInput.focus();
        this.performSearch(query.toLowerCase(), query);
    }

    highlightProductInGrid(productCard) {
        // Scroll to the product
        productCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Add highlight animation
        productCard.style.animation = 'highlightPulse 2s ease-in-out';
        setTimeout(() => {
            productCard.style.animation = '';
        }, 2000);
        
        const nameEl = productCard.querySelector('.product-name, .product-list-name');
        if (nameEl) {
            this.showNotification(`Found: ${nameEl.textContent}`);
        }
    }

    updateSelectedItem(items) {
        // Remove highlight from all items
        items.forEach(item => item.classList.remove('keyboard-selected'));
        
        // Add highlight to selected item
        if (this.selectedIndex >= 0 && items[this.selectedIndex]) {
            items[this.selectedIndex].classList.add('keyboard-selected');
            items[this.selectedIndex].scrollIntoView({ block: 'nearest' });
        }
    }

    showSearchResults() {
        this.searchResults.classList.add('active');
        this.selectedIndex = -1; // Reset selection when showing results
    }

    hideSearchResults() {
        this.searchResults.classList.remove('active');
    }
    
    showEmptySearchState() {
        const hasHistory = this.searchHistory.length > 0;
        
        let html = '<div class="search-empty-state">';
        
        // Recent Searches
        if (hasHistory) {
            html += `
                <div class="search-history-section">
                    <div class="search-section-header">
                        <span><i class="fas fa-clock"></i> Recent Searches</span>
                        <button class="clear-history-btn" onmousedown="event.preventDefault(); window.shopSearch.clearSearchHistory()">Clear All</button>
                    </div>
                    <div class="search-history-items">
                        ${this.searchHistory.slice(0, 5).map(term => `
                            <div class="search-history-item">
                                <span onmousedown="event.preventDefault(); window.shopSearch.applySuggestion('${term}')">${term}</span>
                                <button class="remove-history-btn" onmousedown="event.preventDefault(); event.stopPropagation(); window.shopSearch.removeFromSearchHistory('${term}'); window.shopSearch.showEmptySearchState();">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }
        
        // Popular/Trending Searches
        html += `
            <div class="search-popular-section">
                <div class="search-section-header">
                    <span><i class="fas fa-fire"></i> Trending Searches</span>
                </div>
                <div class="search-popular-chips">
                    ${this.popularQueries.map(q => `
                        <button class="search-popular-chip" onmousedown="event.preventDefault(); window.shopSearch.applySuggestion('${q}')">
                            ${q}
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
        
        html += '</div>';
        
        this.searchResults.innerHTML = html;
        this.showSearchResults();
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: var(--blue-primary);
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
            <i class="fas fa-check-circle"></i>
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

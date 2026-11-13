/**
 * STACKLY - LUXURY FASHION BOUTIQUE
 * Core JavaScript Application
 * Vanilla JS, Fetch API with Async/Await, LocalStorage, Modals, Cart & Wishlist
 */

(function () {
  'use strict';

  // State Management
  const state = {
    allProducts: [],
    filteredProducts: [],
    displayedProducts: [],
    pageSize: 8,
    currentPage: 1,
    selectedCategory: 'all',
    searchQuery: '',
    sortBy: 'default',
    cart: [],
    wishlist: [],
    discountCode: null,
    discountRate: 0,
    currentModalProduct: null,
    heroSlideIndex: 0,
    heroInterval: null,
  };

  // Valid Coupons
  const COUPONS = {
    'STACKLY20': { rate: 0.20, label: '20% Off Spring Collection' },
    'GOLD15': { rate: 0.15, label: '15% Off VIP Chic' },
    'FIRST10': { rate: 0.10, label: '10% Welcome Discount' }
  };

  // API Endpoints
  const API_URL = 'https://dummyjson.com/products?limit=100';

  // DOM Elements
  const DOM = {
    productsGrid: document.getElementById('products-grid'),
    newArrivalsGrid: document.getElementById('new-arrivals-grid'),
    trendingGrid: document.getElementById('trending-grid'),
    bestSellersGrid: document.getElementById('best-sellers-grid'),
    searchInput: document.getElementById('product-search-input'),
    searchClearBtn: document.getElementById('search-clear-btn'),
    categoryFilter: document.getElementById('category-filter'),
    sortFilter: document.getElementById('sort-filter'),
    categoryPills: document.getElementById('category-pills'),
    loadMoreBtn: document.getElementById('load-more-btn'),
    loadMoreContainer: document.getElementById('load-more-container'),
    cartCountBadge: document.getElementById('cart-count-badge'),
    wishlistCountBadge: document.getElementById('wishlist-count-badge'),
    wishlistDrawer: document.getElementById('wishlist-drawer'),
    wishlistBackdrop: document.getElementById('wishlist-backdrop'),
    wishlistCloseBtn: document.getElementById('wishlist-close-btn'),
    wishlistToggleHeader: document.getElementById('wishlist-toggle-header'),
    wishlistItemsList: document.getElementById('wishlist-items-list'),
    cartDrawer: document.getElementById('cart-drawer'),
    cartBackdrop: document.getElementById('cart-backdrop'),
    cartCloseBtn: document.getElementById('cart-close-btn'),
    cartToggleBtn: document.getElementById('cart-toggle-btn'),
    cartItemsList: document.getElementById('cart-items-list'),
    cartSubtotal: document.getElementById('cart-subtotal'),
    cartDiscountRow: document.getElementById('cart-discount-row'),
    cartDiscountAmount: document.getElementById('cart-discount-amount'),
    cartTotal: document.getElementById('cart-total'),
    couponInput: document.getElementById('coupon-input'),
    applyCouponBtn: document.getElementById('apply-coupon-btn'),
    checkoutBtn: document.getElementById('checkout-btn'),
    productModalOverlay: document.getElementById('product-modal-overlay'),
    productModalContainer: document.getElementById('product-modal-container'),
    productModalCloseBtn: document.getElementById('product-modal-close-btn'),
    orderModalOverlay: document.getElementById('order-modal-overlay'),
    orderModalCloseBtn: document.getElementById('order-modal-close-btn'),
    orderIdDisplay: document.getElementById('order-id-display'),
    orderTotalDisplay: document.getElementById('order-total-display'),
    mobileNavToggle: document.getElementById('mobile-nav-toggle'),
    mobileNav: document.getElementById('mobile-nav'),
    mobileNavClose: document.getElementById('mobile-nav-close'),
    mobileNavBackdrop: document.getElementById('mobile-nav-backdrop'),
    newsletterForm: document.getElementById('newsletter-form'),
    toastContainer: document.getElementById('toast-container'),
    backToTopBtn: document.getElementById('back-to-top-btn'),
    heroSlides: document.querySelectorAll('.hero-slide'),
    heroDots: document.querySelectorAll('.hero-dot'),
    heroPrevBtn: document.getElementById('hero-prev-btn'),
    heroNextBtn: document.getElementById('hero-next-btn'),
  };

  /* ==========================================================================
     INITIALIZATION
     ========================================================================== */
  async function init() {
    loadLocalStorage();
    setupEventListeners();
    setupHeroSlider();
    renderSkeletonLoaders();
    await fetchProducts();
    updateCartUI();
    updateWishlistUI();
    
    // Initialize AOS if loaded
    if (typeof AOS !== 'undefined') {
      AOS.init({
        duration: 800,
        once: true,
        offset: 50,
      });
    }
  }

  /* ==========================================================================
     LOCAL STORAGE PERSISTENCE
     ========================================================================== */
  function loadLocalStorage() {
    try {
      const savedCart = localStorage.getItem('stackly_cart');
      if (savedCart) state.cart = JSON.parse(savedCart);

      const savedWishlist = localStorage.getItem('stackly_wishlist');
      if (savedWishlist) state.wishlist = JSON.parse(savedWishlist);

      const savedCoupon = localStorage.getItem('stackly_coupon');
      if (savedCoupon && COUPONS[savedCoupon]) {
        state.discountCode = savedCoupon;
        state.discountRate = COUPONS[savedCoupon].rate;
      }
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }

  function saveCart() {
    localStorage.setItem('stackly_cart', JSON.stringify(state.cart));
    if (state.discountCode) {
      localStorage.setItem('stackly_coupon', state.discountCode);
    } else {
      localStorage.removeItem('stackly_coupon');
    }
    updateCartUI();
  }

  function saveWishlist() {
    localStorage.setItem('stackly_wishlist', JSON.stringify(state.wishlist));
    updateWishlistUI();
    renderAllProductGrids();
  }

  /* ==========================================================================
     API DATA FETCHING WITH ERROR HANDLING & FALLBACK
     ========================================================================== */
  async function fetchProducts() {
    try {
      // Primary: Fetch live from DummyJSON
      const response = await fetch(API_URL);
      if (!response.ok) {
        throw new Error(`API response status: ${response.status}`);
      }
      const data = await response.json();
      
      // Filter for fashion-relevant categories or fashion boutique inventory
      const fashionSlugs = [
        'womens-dresses', 'womens-shoes', 'womens-jewellery', 'womens-bags', 
        'mens-shirts', 'mens-shoes', 'mens-watches', 'sunglasses', 'fragrances', 'tops', 'beauty'
      ];
      
      let fashionList = (data.products || []).filter(p => fashionSlugs.includes(p.category));
      
      // If DummyJSON category names shifted or too few returned, take top 40 fashion items
      if (fashionList.length < 20) {
        fashionList = data.products.slice(0, 32);
      }
      
      // Enhance product images with local webp cache if available
      fashionList = fashionList.map(p => {
        const localImg = `assets/images/products/prod_${p.id}.webp`;
        return {
          ...p,
          displayImage: localImg,
          fallbackImage: p.thumbnail || (p.images && p.images[0]) || ''
        };
      });

      state.allProducts = fashionList;
      showToast('Fashion catalog loaded from DummyJSON', 'info');
    } catch (err) {
      console.warn('Primary DummyJSON fetch failed, loading local baseline:', err);
      // Fallback to local curated JSON
      try {
        const fallbackResp = await fetch('assets/js/products-data.json');
        const fallbackData = await fallbackResp.json();
        state.allProducts = fallbackData.map(p => ({
          ...p,
          displayImage: p.local_image || p.thumbnail,
          fallbackImage: p.thumbnail
        }));
        showToast('Loaded curated offline luxury collection', 'info');
      } catch (localErr) {
        console.error('All product fetch methods failed:', localErr);
        renderErrorState();
        return;
      }
    }

    // Populate category dropdown and pills
    populateCategories();
    applyFilters();
    renderFeaturedShowcases();
  }

  function populateCategories() {
    const categories = ['all', ...new Set(state.allProducts.map(p => p.category))];
    
    // Category select options
    if (DOM.categoryFilter) {
      DOM.categoryFilter.innerHTML = categories.map(cat => {
        const label = formatCategoryLabel(cat);
        return `<option value="${cat}">${label}</option>`;
      }).join('');
    }

    // Category pills
    if (DOM.categoryPills) {
      DOM.categoryPills.innerHTML = categories.slice(0, 7).map((cat, idx) => {
        const label = formatCategoryLabel(cat);
        const isActive = (cat === 'all') ? 'active' : '';
        return `<button class="category-pill ${isActive}" data-category="${cat}">${label}</button>`;
      }).join('');

      DOM.categoryPills.querySelectorAll('.category-pill').forEach(btn => {
        btn.addEventListener('click', () => {
          DOM.categoryPills.querySelectorAll('.category-pill').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          state.selectedCategory = btn.dataset.category;
          if (DOM.categoryFilter) DOM.categoryFilter.value = state.selectedCategory;
          state.currentPage = 1;
          applyFilters();
        });
      });
    }
  }

  function formatCategoryLabel(slug) {
    if (slug === 'all') return 'All Categories';
    return slug
      .split('-')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }

  /* ==========================================================================
     SKELETON & ERROR RENDERING
     ========================================================================== */
  function renderSkeletonLoaders() {
    const skeletonCard = `
      <div class="skeleton-card">
        <div class="skeleton skeleton-img"></div>
        <div class="skeleton skeleton-text" style="width: 40%;"></div>
        <div class="skeleton skeleton-text-lg"></div>
        <div class="skeleton skeleton-text" style="width: 60%;"></div>
        <div class="skeleton skeleton-btn"></div>
      </div>
    `;
    const count = 8;
    if (DOM.productsGrid) DOM.productsGrid.innerHTML = Array(count).fill(skeletonCard).join('');
    if (DOM.newArrivalsGrid) DOM.newArrivalsGrid.innerHTML = Array(4).fill(skeletonCard).join('');
    if (DOM.trendingGrid) DOM.trendingGrid.innerHTML = Array(4).fill(skeletonCard).join('');
    if (DOM.bestSellersGrid) DOM.bestSellersGrid.innerHTML = Array(4).fill(skeletonCard).join('');
  }

  function renderErrorState() {
    if (DOM.productsGrid) {
      DOM.productsGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem;">
          <i class="fa-solid fa-triangle-exclamation" style="font-size: 3rem; color: var(--color-danger); margin-bottom: 1rem;"></i>
          <h3 style="font-family: var(--font-serif); margin-bottom: 0.5rem;">Unable to Load Products</h3>
          <p style="color: var(--color-text-muted); margin-bottom: 1.5rem;">Please check your connection or reload the page.</p>
          <button class="btn btn-primary" onclick="window.location.reload()">Retry Connection</button>
        </div>
      `;
    }
  }

  /* ==========================================================================
     FILTER, SEARCH & SORT LOGIC
     ========================================================================== */
  function applyFilters() {
    let result = [...state.allProducts];

    // Category filter
    if (state.selectedCategory && state.selectedCategory !== 'all') {
      result = result.filter(p => p.category === state.selectedCategory);
    }

    // Search query filter
    if (state.searchQuery.trim()) {
      const q = state.searchQuery.toLowerCase().trim();
      result = result.filter(p => 
        p.title.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        (p.brand && p.brand.toLowerCase().includes(q))
      );
    }

    // Sorting functionality
    switch (state.sortBy) {
      case 'price-asc':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'rating-desc':
        result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'rating-asc':
        result.sort((a, b) => (a.rating || 0) - (b.rating || 0));
        break;
      case 'name-asc':
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
      default:
        // natural API order
        break;
    }

    state.filteredProducts = result;
    state.displayedProducts = result.slice(0, state.pageSize * state.currentPage);

    renderCatalogGrid();
    updateLoadMoreButton();
  }

  function updateLoadMoreButton() {
    if (!DOM.loadMoreContainer) return;
    if (state.displayedProducts.length >= state.filteredProducts.length) {
      DOM.loadMoreContainer.style.display = 'none';
    } else {
      DOM.loadMoreContainer.style.display = 'block';
    }
  }

  /* ==========================================================================
     PRODUCT CARD HTML GENERATOR
     ========================================================================== */
  function createProductCardHTML(product, badgeText = '', badgeClass = '') {
    const isWishlisted = state.wishlist.some(id => id === product.id);
    const originalPrice = (product.price * (1 + (product.discountPercentage || 15) / 100)).toFixed(2);
    const ratingStars = renderStars(product.rating || 4.5);
    const displayImg = product.displayImage || product.thumbnail;

    // Badges
    let badgeHTML = '';
    if (badgeText) {
      badgeHTML = `<span class="badge ${badgeClass}">${badgeText}</span>`;
    } else if (product.discountPercentage && product.discountPercentage > 10) {
      badgeHTML = `<span class="badge badge-sale">-${Math.round(product.discountPercentage)}%</span>`;
    }

    return `
      <article class="product-card" data-product-id="${product.id}" data-aos="fade-up">
        <div class="product-media" onclick="window.StacklyApp.openProductModal(${product.id})">
          <img 
            src="${displayImg}" 
            alt="${escapeHTML(product.title)}" 
            class="product-img" 
            loading="lazy"
            onerror="this.onerror=null; this.src='${product.fallbackImage || product.thumbnail}';"
          />
          <div class="product-badge-group">
            ${badgeHTML}
          </div>
          <div class="product-action-btns" onclick="event.stopPropagation()">
            <button 
              class="btn-card-action btn-wishlist-toggle ${isWishlisted ? 'wishlist-active' : ''}" 
              title="Add to Wishlist" 
              onclick="window.StacklyApp.toggleWishlist(${product.id})"
            >
              <i class="${isWishlisted ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
            </button>
          </div>
          <button class="btn-quick-view" onclick="event.stopPropagation(); window.StacklyApp.openProductModal(${product.id})">
            <i class="fa-regular fa-eye"></i> Quick View
          </button>
        </div>
        <div class="product-info">
          <span class="product-category-meta">${formatCategoryLabel(product.category || 'Atelier')}</span>
          <h3 class="product-title" onclick="window.StacklyApp.openProductModal(${product.id})" title="${escapeHTML(product.title)}">
            ${escapeHTML(product.title)}
          </h3>
          <div class="product-rating">
            <div class="rating-stars">${ratingStars}</div>
            <span class="rating-number">${(product.rating || 4.5).toFixed(1)}</span>
            <span class="rating-count">(${product.reviews ? product.reviews.length : 18})</span>
          </div>
          <div class="product-pricing-wrap">
            <span class="price-current">$${product.price.toFixed(2)}</span>
            <span class="price-original">$${originalPrice}</span>
            <span class="price-discount">Save ${(product.discountPercentage || 15).toFixed(0)}%</span>
          </div>
          <button class="btn-add-to-cart" onclick="window.StacklyApp.addToCart(${product.id})">
            <i class="fa-solid fa-bag-shopping"></i> Add to Cart
          </button>
        </div>
      </article>
    `;
  }

  function renderStars(rating) {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.4;
    let stars = '';
    for (let i = 0; i < fullStars; i++) stars += '<i class="fa-solid fa-star"></i>';
    if (halfStar) stars += '<i class="fa-solid fa-star-half-stroke"></i>';
    const emptyCount = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyCount; i++) stars += '<i class="fa-regular fa-star"></i>';
    return stars;
  }

  /* ==========================================================================
     RENDER PRODUCT GRIDS
     ========================================================================== */
  function renderCatalogGrid() {
    if (!DOM.productsGrid) return;
    if (state.displayedProducts.length === 0) {
      DOM.productsGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem;">
          <i class="fa-solid fa-magnifying-glass" style="font-size: 3rem; color: var(--color-accent-gold); margin-bottom: 1rem;"></i>
          <h3 style="font-family: var(--font-serif); margin-bottom: 0.5rem;">No Products Found</h3>
          <p style="color: var(--color-text-muted); margin-bottom: 1.5rem;">Try adjusting your filters or search keywords.</p>
          <button class="btn btn-outline" onclick="window.StacklyApp.resetFilters()">Clear Filters</button>
        </div>
      `;
      return;
    }

    DOM.productsGrid.innerHTML = state.displayedProducts.map(p => createProductCardHTML(p)).join('');
  }

  function renderFeaturedShowcases() {
    // 1. New Arrivals (top 4 products)
    if (DOM.newArrivalsGrid) {
      const arrivals = state.allProducts.slice(0, 4);
      DOM.newArrivalsGrid.innerHTML = arrivals.map(p => createProductCardHTML(p, 'New Season', 'badge-new')).join('');
    }

    // 2. Trending Products (products with high rating or discount)
    if (DOM.trendingGrid) {
      const trending = [...state.allProducts]
        .sort((a, b) => (b.rating || 0) - (a.rating || 0))
        .slice(0, 4);
      DOM.trendingGrid.innerHTML = trending.map(p => createProductCardHTML(p, 'Trending', 'badge-trending')).join('');
    }

    // 3. Best Sellers (popular items)
    if (DOM.bestSellersGrid) {
      const bestSellers = [...state.allProducts]
        .slice(8, 12);
      DOM.bestSellersGrid.innerHTML = bestSellers.map(p => createProductCardHTML(p, 'Best Seller', 'badge-sale')).join('');
    }
  }

  function renderAllProductGrids() {
    renderCatalogGrid();
    renderFeaturedShowcases();
  }

  /* ==========================================================================
     SHOPPING CART FUNCTIONALITY
     ========================================================================== */
  function addToCart(productId, quantity = 1) {
    const product = state.allProducts.find(p => p.id === productId);
    if (!product) return;

    const existingIndex = state.cart.findIndex(item => item.id === productId);
    if (existingIndex > -1) {
      state.cart[existingIndex].quantity += quantity;
    } else {
      state.cart.push({
        id: product.id,
        title: product.title,
        price: product.price,
        image: product.displayImage || product.thumbnail,
        quantity: quantity
      });
    }

    saveCart();
    showToast(`Added "${product.title}" to cart`, 'success');
    openCart();
  }

  function updateCartQuantity(productId, delta) {
    const itemIndex = state.cart.findIndex(item => item.id === productId);
    if (itemIndex === -1) return;

    state.cart[itemIndex].quantity += delta;
    if (state.cart[itemIndex].quantity <= 0) {
      state.cart.splice(itemIndex, 1);
      showToast('Item removed from cart', 'info');
    }
    saveCart();
  }

  function removeFromCart(productId) {
    state.cart = state.cart.filter(item => item.id !== productId);
    saveCart();
    showToast('Item removed from cart', 'info');
  }

  function copyCoupon(code, btnElement) {
    if (!code) return;
    const cleanCode = code.toUpperCase().trim();

    const doSuccess = () => {
      showToast(`Coupon "${cleanCode}" copied to clipboard!`, 'success');
      if (btnElement) {
        const icon = btnElement.querySelector('i');
        if (icon) {
          const originalClass = icon.className;
          icon.className = 'fa-solid fa-check';
          setTimeout(() => {
            icon.className = originalClass;
          }, 2000);
        }
      }
    };

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(cleanCode).then(doSuccess).catch(() => {
        fallbackCopyText(cleanCode, doSuccess);
      });
    } else {
      fallbackCopyText(cleanCode, doSuccess);
    }
  }

  function fallbackCopyText(text, callback) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.top = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    try {
      document.execCommand('copy');
      if (callback) callback();
    } catch (err) {
      showToast(`Coupon code is ${text}`, 'info');
    }
    document.body.removeChild(textarea);
  }

  function applyCoupon(code) {
    const cleanCode = (code || '').toUpperCase().trim();
    if (!cleanCode) {
      showToast('Please enter a coupon code', 'error');
      return;
    }

    if (COUPONS[cleanCode]) {
      state.discountCode = cleanCode;
      state.discountRate = COUPONS[cleanCode].rate;
      saveCart();
      showToast(`Coupon "${cleanCode}" applied: ${COUPONS[cleanCode].label}!`, 'success');
    } else {
      showToast('Invalid coupon code. Try STACKLY20 or GOLD15', 'error');
    }
  }

  function calculateCartTotals() {
    const subtotal = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discount = subtotal * state.discountRate;
    const total = Math.max(0, subtotal - discount);
    return { subtotal, discount, total };
  }

  function updateCartUI() {
    const totalItems = state.cart.reduce((sum, item) => sum + item.quantity, 0);
    if (DOM.cartCountBadge) {
      DOM.cartCountBadge.textContent = totalItems;
      DOM.cartCountBadge.style.display = totalItems > 0 ? 'flex' : 'none';
    }

    if (!DOM.cartItemsList) return;

    if (state.cart.length === 0) {
      DOM.cartItemsList.innerHTML = `
        <div class="cart-empty-state">
          <i class="fa-solid fa-bag-shopping"></i>
          <h4>Your Cart is Empty</h4>
          <p>Discover our curated haute couture pieces and add them to your collection.</p>
        </div>
      `;
      if (DOM.cartSubtotal) DOM.cartSubtotal.textContent = '$0.00';
      if (DOM.cartTotal) DOM.cartTotal.textContent = '$0.00';
      if (DOM.cartDiscountRow) DOM.cartDiscountRow.style.display = 'none';
      return;
    }

    const { subtotal, discount, total } = calculateCartTotals();

    DOM.cartItemsList.innerHTML = state.cart.map(item => `
      <div class="cart-item">
        <img 
          src="${item.image}" 
          alt="${escapeHTML(item.title)}" 
          class="cart-item-img" 
          onerror="this.onerror=null; this.src='assets/images/products/prod_${item.id}.webp';"
        />
        <div class="cart-item-details">
          <h4 class="cart-item-title">${escapeHTML(item.title)}</h4>
          <span class="cart-item-price">$${item.price.toFixed(2)}</span>
          <div class="cart-item-bottom">
            <div class="quantity-control">
              <button class="qty-btn" onclick="window.StacklyApp.updateCartQty(${item.id}, -1)">-</button>
              <input type="text" readonly class="qty-input" value="${item.quantity}" />
              <button class="qty-btn" onclick="window.StacklyApp.updateCartQty(${item.id}, 1)">+</button>
            </div>
            <button class="cart-item-remove" onclick="window.StacklyApp.removeFromCart(${item.id})" title="Remove item">
              <i class="fa-regular fa-trash-can"></i>
            </button>
          </div>
        </div>
      </div>
    `).join('');

    if (DOM.cartSubtotal) DOM.cartSubtotal.textContent = `$${subtotal.toFixed(2)}`;
    if (DOM.cartTotal) DOM.cartTotal.textContent = `$${total.toFixed(2)}`;

    if (DOM.cartDiscountRow && DOM.cartDiscountAmount) {
      if (state.discountRate > 0) {
        DOM.cartDiscountRow.style.display = 'flex';
        DOM.cartDiscountAmount.textContent = `-$${discount.toFixed(2)} (${(state.discountRate * 100).toFixed(0)}%)`;
      } else {
        DOM.cartDiscountRow.style.display = 'none';
      }
    }
  }

  function openCart() {
    if (DOM.cartDrawer) DOM.cartDrawer.classList.add('open');
    if (DOM.cartBackdrop) DOM.cartBackdrop.classList.add('active');
    document.body.classList.add('modal-open');
  }

  function closeCart() {
    if (DOM.cartDrawer) DOM.cartDrawer.classList.remove('open');
    if (DOM.cartBackdrop) DOM.cartBackdrop.classList.remove('active');
    document.body.classList.remove('modal-open');
  }

  /* ==========================================================================
     WISHLIST FUNCTIONALITY
     ========================================================================== */
  function toggleWishlist(productId) {
    const index = state.wishlist.indexOf(productId);
    const product = state.allProducts.find(p => p.id === productId);
    const title = product ? product.title : 'Product';

    if (index > -1) {
      state.wishlist.splice(index, 1);
      showToast(`Removed "${title}" from Wishlist`, 'info');
    } else {
      state.wishlist.push(productId);
      showToast(`Saved "${title}" to Wishlist!`, 'success');
    }
    saveWishlist();
  }

  function updateWishlistUI() {
    const count = state.wishlist.length;
    if (DOM.wishlistCountBadge) {
      DOM.wishlistCountBadge.textContent = count;
      DOM.wishlistCountBadge.style.display = count > 0 ? 'flex' : 'none';
    }

    if (!DOM.wishlistItemsList) return;

    if (state.wishlist.length === 0) {
      DOM.wishlistItemsList.innerHTML = `
        <div class="wishlist-empty-state">
          <i class="fa-regular fa-heart"></i>
          <h4>Your Wishlist is Empty</h4>
          <p>Tap the heart icon on any piece to save your favorite couture designs here.</p>
        </div>
      `;
      return;
    }

    const wishlistedProducts = state.allProducts.filter(p => state.wishlist.includes(p.id));

    DOM.wishlistItemsList.innerHTML = wishlistedProducts.map(product => {
      const displayImg = product.displayImage || `assets/images/products/prod_${product.id}.webp`;
      const fallbackImg = product.fallbackImage || product.thumbnail || '';
      return `
        <div class="wishlist-item">
          <img 
            src="${displayImg}" 
            alt="${escapeHTML(product.title)}" 
            class="wishlist-item-img" 
            onerror="this.onerror=null; this.src='${fallbackImg}';"
            onclick="window.StacklyApp.closeWishlist(); window.StacklyApp.openProductModal(${product.id})"
          />
          <div class="wishlist-item-details">
            <h4 class="wishlist-item-title" onclick="window.StacklyApp.closeWishlist(); window.StacklyApp.openProductModal(${product.id})">
              ${escapeHTML(product.title)}
            </h4>
            <span class="wishlist-item-price">$${product.price.toFixed(2)}</span>
            <div class="wishlist-item-actions">
              <a href="404.html" class="wishlist-btn-add">
                <i class="fa-solid fa-bag-shopping"></i> Add to Bag
              </a>
              <button class="wishlist-item-remove" onclick="window.StacklyApp.toggleWishlist(${product.id})" title="Remove from Wishlist">
                <i class="fa-solid fa-trash-can"></i>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  function openWishlist() {
    if (DOM.wishlistDrawer) DOM.wishlistDrawer.classList.add('open');
    if (DOM.wishlistBackdrop) DOM.wishlistBackdrop.classList.add('active');
    document.body.classList.add('modal-open');
  }

  function closeWishlist() {
    if (DOM.wishlistDrawer) DOM.wishlistDrawer.classList.remove('open');
    if (DOM.wishlistBackdrop) DOM.wishlistBackdrop.classList.remove('active');
    document.body.classList.remove('modal-open');
  }

  /* ==========================================================================
     PRODUCT DETAILS MODAL
     ========================================================================== */
  function openProductModal(productId) {
    const product = state.allProducts.find(p => p.id === productId);
    if (!product || !DOM.productModalContainer) return;

    state.currentModalProduct = product;
    const isWishlisted = state.wishlist.includes(product.id);
    const originalPrice = (product.price * (1 + (product.discountPercentage || 15) / 100)).toFixed(2);
    const displayImg = product.displayImage || product.thumbnail;
    const stars = renderStars(product.rating || 4.5);

    // Gallery images
    const images = (product.images && product.images.length > 0) ? product.images.slice(0, 4) : [displayImg];

    DOM.productModalContainer.innerHTML = `
      <div class="modal-product-layout">
        <div class="modal-gallery">
          <div class="modal-main-img-wrap">
            <img id="modal-main-image" src="${displayImg}" alt="${escapeHTML(product.title)}" class="modal-main-img" />
          </div>
          <div class="modal-gallery-thumbs">
            ${images.map((imgUrl, i) => `
              <img 
                src="${imgUrl}" 
                alt="thumb-${i}" 
                class="thumb-img ${i === 0 ? 'active' : ''}" 
                onclick="document.getElementById('modal-main-image').src='${imgUrl}'; document.querySelectorAll('.thumb-img').forEach(t=>t.classList.remove('active')); this.classList.add('active');" 
              />
            `).join('')}
          </div>
        </div>
        <div class="modal-product-info">
          <div class="modal-badge-row">
            <span class="badge badge-new">${formatCategoryLabel(product.category || 'Luxury')}</span>
            <span class="badge ${product.stock > 5 ? 'badge-trending' : 'badge-sale'}">
              ${product.stock > 5 ? 'In Stock (' + product.stock + ')' : 'Low Stock (' + product.stock + ')'}
            </span>
          </div>
          <h2 class="modal-product-title">${escapeHTML(product.title)}</h2>
          <div class="product-rating" style="margin-bottom: 1rem;">
            <div class="rating-stars">${stars}</div>
            <span class="rating-number">${(product.rating || 4.5).toFixed(1)}</span>
            <span class="rating-count">(${product.reviews ? product.reviews.length : 24} customer reviews)</span>
          </div>
          <div class="modal-pricing-wrap">
            <span class="price-current" style="font-size: 1.6rem;">$${product.price.toFixed(2)}</span>
            <span class="price-original" style="font-size: 1.1rem;">$${originalPrice}</span>
            <span class="price-discount">Save ${(product.discountPercentage || 15).toFixed(0)}%</span>
          </div>
          <p class="modal-desc">${escapeHTML(product.description || 'Artisanal tailoring with luxurious drapery and meticulous attention to detail.')}</p>
          
          <div class="modal-specs-grid">
            <div class="spec-item">
              <span>Brand</span>
              <span>${escapeHTML(product.brand || 'Stackly')}</span>
            </div>
            <div class="spec-item">
              <span>SKU</span>
              <span>${escapeHTML(product.sku || 'LUM-' + product.id + '02')}</span>
            </div>
            <div class="spec-item">
              <span>Availability</span>
              <span>${escapeHTML(product.availabilityStatus || 'Ready to Ship')}</span>
            </div>
            <div class="spec-item">
              <span>Warranty</span>
              <span>${escapeHTML(product.warrantyInformation || '1-Year Atelier Warranty')}</span>
            </div>
          </div>

          <div style="display: flex; gap: 1rem; align-items: center; margin-top: auto;">
            <div class="quantity-control" style="height: 46px;">
              <button class="qty-btn" id="modal-qty-minus">-</button>
              <input type="text" readonly id="modal-qty-input" class="qty-input" value="1" />
              <button class="qty-btn" id="modal-qty-plus">+</button>
            </div>
            <button class="btn btn-primary" style="flex: 1; height: 46px;" id="modal-add-cart-btn">
              <i class="fa-solid fa-bag-shopping"></i> Add to Bag
            </button>
            <button 
              class="btn-card-action ${isWishlisted ? 'wishlist-active' : ''}" 
              style="width: 46px; height: 46px; border: 1px solid var(--color-border);" 
              id="modal-wishlist-btn"
              title="Add to Wishlist"
            >
              <i class="${isWishlisted ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
            </button>
          </div>
        </div>
      </div>
    `;

    // Hook quantity buttons inside modal
    let modalQty = 1;
    const qtyInput = document.getElementById('modal-qty-input');
    document.getElementById('modal-qty-minus').addEventListener('click', () => {
      if (modalQty > 1) {
        modalQty--;
        qtyInput.value = modalQty;
      }
    });
    document.getElementById('modal-qty-plus').addEventListener('click', () => {
      modalQty++;
      qtyInput.value = modalQty;
    });

    document.getElementById('modal-add-cart-btn').addEventListener('click', () => {
      addToCart(product.id, modalQty);
      closeProductModal();
    });

    const modalWishBtn = document.getElementById('modal-wishlist-btn');
    modalWishBtn.addEventListener('click', () => {
      toggleWishlist(product.id);
      const isNowWish = state.wishlist.includes(product.id);
      modalWishBtn.classList.toggle('wishlist-active', isNowWish);
      modalWishBtn.querySelector('i').className = `${isNowWish ? 'fa-solid' : 'fa-regular'} fa-heart`;
    });

    if (DOM.productModalOverlay) {
      DOM.productModalOverlay.classList.add('active');
      document.body.classList.add('modal-open');
    }
  }

  function closeProductModal() {
    if (DOM.productModalOverlay) {
      DOM.productModalOverlay.classList.remove('active');
      document.body.classList.remove('modal-open');
    }
  }

  /* ==========================================================================
     CHECKOUT & ORDER CONFIRMATION MODAL
     ========================================================================== */
  function handleCheckout() {
    if (state.cart.length === 0) {
      showToast('Your cart is empty', 'error');
      return;
    }

    const { total } = calculateCartTotals();
    const orderId = 'LM-' + Math.floor(100000 + Math.random() * 900000);

    // Save order in localStorage history
    const orderRecord = {
      orderId,
      date: new Date().toISOString(),
      items: [...state.cart],
      total: total.toFixed(2),
      discountCode: state.discountCode
    };

    const previousOrders = JSON.parse(localStorage.getItem('stackly_orders') || '[]');
    previousOrders.push(orderRecord);
    localStorage.setItem('stackly_orders', JSON.stringify(previousOrders));

    // Clear active cart
    state.cart = [];
    state.discountCode = null;
    state.discountRate = 0;
    saveCart();
    closeCart();

    // Show confirmation
    if (DOM.orderIdDisplay) DOM.orderIdDisplay.textContent = orderId;
    if (DOM.orderTotalDisplay) DOM.orderTotalDisplay.textContent = `$${total.toFixed(2)}`;
    if (DOM.orderModalOverlay) {
      DOM.orderModalOverlay.classList.add('active');
      document.body.classList.add('modal-open');
    }
  }

  function closeOrderModal() {
    if (DOM.orderModalOverlay) {
      DOM.orderModalOverlay.classList.remove('active');
      document.body.classList.remove('modal-open');
    }
  }

  /* ==========================================================================
     HERO SLIDER
     ========================================================================== */
  function setupHeroSlider() {
    const slides = DOM.heroSlides;
    const dots = DOM.heroDots;
    if (!slides || slides.length === 0) return;

    function showSlide(index) {
      slides.forEach((slide, i) => {
        slide.classList.toggle('active', i === index);
      });
      dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === index);
      });
      state.heroSlideIndex = index;
    }

    function nextSlide() {
      const next = (state.heroSlideIndex + 1) % slides.length;
      showSlide(next);
    }

    function prevSlide() {
      const prev = (state.heroSlideIndex - 1 + slides.length) % slides.length;
      showSlide(prev);
    }

    if (DOM.heroNextBtn) DOM.heroNextBtn.addEventListener('click', nextSlide);
    if (DOM.heroPrevBtn) DOM.heroPrevBtn.addEventListener('click', prevSlide);

    dots.forEach((dot, idx) => {
      dot.addEventListener('click', () => showSlide(idx));
    });

    state.heroInterval = setInterval(nextSlide, 6500);
  }

  /* ==========================================================================
     TOAST NOTIFICATIONS
     ========================================================================== */
  function showToast(message, type = 'info') {
    if (!DOM.toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let iconClass = 'fa-circle-info';
    if (type === 'success') iconClass = 'fa-circle-check';
    if (type === 'error') iconClass = 'fa-circle-exclamation';

    toast.innerHTML = `
      <i class="fa-solid ${iconClass}"></i>
      <span>${escapeHTML(message)}</span>
    `;

    DOM.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  function escapeHTML(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /* ==========================================================================
     EVENT LISTENERS & BINDINGS
     ========================================================================== */
  function setupEventListeners() {
    // Pricing Billing Switch (Monthly / Annual)
    const billingSwitch = document.getElementById('billing-switch');
    const monthlyLabel = document.getElementById('billing-monthly-label');
    const annualLabel = document.getElementById('billing-annual-label');

    if (billingSwitch) {
      let isAnnual = false;
      const toggleBilling = () => {
        isAnnual = !isAnnual;
        billingSwitch.classList.toggle('annual', isAnnual);
        if (monthlyLabel) monthlyLabel.classList.toggle('active', !isAnnual);
        if (annualLabel) annualLabel.classList.toggle('active', isAnnual);

        document.querySelectorAll('.price-val').forEach(el => {
          const targetPrice = isAnnual ? el.dataset.annual : el.dataset.monthly;
          if (targetPrice) el.textContent = targetPrice;
        });

        document.querySelectorAll('.price-cycle').forEach(el => {
          el.textContent = isAnnual ? '/month (billed annually)' : '/month';
        });
      };

      billingSwitch.addEventListener('click', toggleBilling);
      if (monthlyLabel) monthlyLabel.addEventListener('click', () => { if (isAnnual) toggleBilling(); });
      if (annualLabel) annualLabel.addEventListener('click', () => { if (!isAnnual) toggleBilling(); });
    }

    // Search input
    if (DOM.searchInput) {
      DOM.searchInput.addEventListener('input', (e) => {
        state.searchQuery = e.target.value;
        if (DOM.searchClearBtn) {
          DOM.searchClearBtn.classList.toggle('visible', state.searchQuery.length > 0);
        }
        state.currentPage = 1;
        applyFilters();
      });
    }

    if (DOM.searchClearBtn) {
      DOM.searchClearBtn.addEventListener('click', () => {
        if (DOM.searchInput) DOM.searchInput.value = '';
        state.searchQuery = '';
        DOM.searchClearBtn.classList.remove('visible');
        state.currentPage = 1;
        applyFilters();
      });
    }

    // Category filter select
    if (DOM.categoryFilter) {
      DOM.categoryFilter.addEventListener('change', (e) => {
        state.selectedCategory = e.target.value;
        // sync pills
        if (DOM.categoryPills) {
          DOM.categoryPills.querySelectorAll('.category-pill').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.category === state.selectedCategory);
          });
        }
        state.currentPage = 1;
        applyFilters();
      });
    }

    // Sort filter select
    if (DOM.sortFilter) {
      DOM.sortFilter.addEventListener('change', (e) => {
        state.sortBy = e.target.value;
        applyFilters();
      });
    }

    // Load More button
    if (DOM.loadMoreBtn) {
      DOM.loadMoreBtn.addEventListener('click', () => {
        state.currentPage++;
        state.displayedProducts = state.filteredProducts.slice(0, state.pageSize * state.currentPage);
        renderCatalogGrid();
        updateLoadMoreButton();
      });
    }

    // Wishlist Drawer Toggle
    if (DOM.wishlistToggleHeader) DOM.wishlistToggleHeader.addEventListener('click', openWishlist);
    if (DOM.wishlistCloseBtn) DOM.wishlistCloseBtn.addEventListener('click', closeWishlist);
    if (DOM.wishlistBackdrop) DOM.wishlistBackdrop.addEventListener('click', closeWishlist);

    // Cart Drawer Toggle
    if (DOM.cartToggleBtn) DOM.cartToggleBtn.addEventListener('click', openCart);
    if (DOM.cartCloseBtn) DOM.cartCloseBtn.addEventListener('click', closeCart);
    if (DOM.cartBackdrop) DOM.cartBackdrop.addEventListener('click', closeCart);

    // Apply Coupon Button
    if (DOM.applyCouponBtn && DOM.couponInput) {
      DOM.applyCouponBtn.addEventListener('click', () => {
        applyCoupon(DOM.couponInput.value);
        DOM.couponInput.value = '';
      });
    }

    // Checkout Button
    if (DOM.checkoutBtn) {
      DOM.checkoutBtn.addEventListener('click', handleCheckout);
    }

    // Modals Close
    if (DOM.productModalCloseBtn) DOM.productModalCloseBtn.addEventListener('click', closeProductModal);
    if (DOM.productModalOverlay) {
      DOM.productModalOverlay.addEventListener('click', (e) => {
        if (e.target === DOM.productModalOverlay) closeProductModal();
      });
    }

    if (DOM.orderModalCloseBtn) DOM.orderModalCloseBtn.addEventListener('click', closeOrderModal);
    if (DOM.orderModalOverlay) {
      DOM.orderModalOverlay.addEventListener('click', (e) => {
        if (e.target === DOM.orderModalOverlay) closeOrderModal();
      });
    }

    // Mobile Navigation Drawer
    if (DOM.mobileNavToggle && DOM.mobileNav) {
      DOM.mobileNavToggle.addEventListener('click', () => {
        DOM.mobileNav.classList.add('open');
        if (DOM.mobileNavBackdrop) DOM.mobileNavBackdrop.classList.add('active');
        document.body.classList.add('modal-open');
      });
    }

    function closeMobileNav() {
      if (DOM.mobileNav) DOM.mobileNav.classList.remove('open');
      if (DOM.mobileNavBackdrop) DOM.mobileNavBackdrop.classList.remove('active');
      document.body.classList.remove('modal-open');
    }

    if (DOM.mobileNavClose) DOM.mobileNavClose.addEventListener('click', closeMobileNav);
    if (DOM.mobileNavBackdrop) DOM.mobileNavBackdrop.addEventListener('click', closeMobileNav);
    document.querySelectorAll('.mobile-nav-links a').forEach(link => {
      link.addEventListener('click', closeMobileNav);
    });

    // Newsletter Form
    if (DOM.newsletterForm) {
      DOM.newsletterForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const emailInput = DOM.newsletterForm.querySelector('input[type="email"]');
        if (emailInput && emailInput.value.trim()) {
          emailInput.value = '';
          window.location.href = '404.html';
        }
      });
    }

    // Reset email input when navigating back / page becomes visible
    window.addEventListener('pageshow', () => {
      if (DOM.newsletterForm) {
        DOM.newsletterForm.reset();
        const emailInput = DOM.newsletterForm.querySelector('input[type="email"]');
        if (emailInput) emailInput.value = '';
      }
    });

    // Sticky Header & Back to top
    window.addEventListener('scroll', () => {
      const header = document.querySelector('.header');
      if (header) {
        header.classList.toggle('scrolled', window.scrollY > 40);
      }
      if (DOM.backToTopBtn) {
        DOM.backToTopBtn.classList.toggle('visible', window.scrollY > 500);
      }
    });

    if (DOM.backToTopBtn) {
      DOM.backToTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    // ESC key closes modals
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeProductModal();
        closeOrderModal();
        closeCart();
        closeWishlist();
        closeMobileNav();
      }
    });
  }

  // Global API exposed for inline button handlers
  window.StacklyApp = {
    addToCart,
    removeFromCart,
    updateCartQty: updateCartQuantity,
    toggleWishlist,
    openProductModal,
    closeProductModal,
    openCart,
    closeCart,
    openWishlist,
    closeWishlist,
    applyCoupon,
    copyCoupon,
    selectMembership: (tierName, price) => {
      showToast(`Selected "${tierName}" Membership ($${price}/mo). Welcome to Stackly Society!`, 'success');
      const checkoutEl = document.getElementById('pricing');
      if (checkoutEl) checkoutEl.scrollIntoView({ behavior: 'smooth' });
    },
    resetFilters: () => {
      state.searchQuery = '';
      state.selectedCategory = 'all';
      state.sortBy = 'default';
      if (DOM.searchInput) DOM.searchInput.value = '';
      if (DOM.categoryFilter) DOM.categoryFilter.value = 'all';
      if (DOM.sortFilter) DOM.sortFilter.value = 'default';
      if (DOM.categoryPills) {
        DOM.categoryPills.querySelectorAll('.category-pill').forEach(b => {
          b.classList.toggle('active', b.dataset.category === 'all');
        });
      }
      state.currentPage = 1;
      applyFilters();
    },
    filterByCategory: (category) => {
      state.selectedCategory = category;
      if (DOM.categoryFilter) DOM.categoryFilter.value = category;
      if (DOM.categoryPills) {
        DOM.categoryPills.querySelectorAll('.category-pill').forEach(b => {
          b.classList.toggle('active', b.dataset.category === category);
        });
      }
      state.currentPage = 1;
      applyFilters();
      const catalogEl = document.getElementById('catalog-section');
      if (catalogEl) catalogEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Launch on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();


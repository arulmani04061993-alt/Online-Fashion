# LUMIÈRE ATELIER — Luxury Fashion & Clothing Boutique

> **A premium, high-performance haute couture online boutique built with pure HTML5, CSS3, and modern Vanilla JavaScript, dynamically powered by the DummyJSON Products REST API.**

---

## 🌟 Live Demo & Deployment
- **Local Preview:** Open `index.html` directly in any modern browser or run a local static server.
- **Repository:** Ready for GitHub repository publishing (`git init` committed).
- **Deployment:** Zero build step needed; effortlessly deployable to GitHub Pages, Netlify, Vercel, or Cloudflare Pages.

---

## 👗 Key Features & Technical Overview

### 1. Mandatory Homepage Sections
1. **Header and Navigation**: Sticky glassmorphism header, brand mark with golden accent, navigation anchor links, search jump, wishlist indicator, cart counter, and responsive mobile drawer.
2. **Hero Section with Fashion Banner**: Editorial slider featuring high-fashion typography, auto-play progression, manual navigation controls, indicator dots, and call-to-actions.
3. **Featured Categories**: 6 curated fashion departments (*Couture Dresses, Men's Tailoring, Artisanal Shoes, Haute Horlogerie, Designer Bags, Rare Fragrances*) with direct 1-click catalog filtering.
4. **Dynamic Catalog with API Integration**:
   - Live query from `https://dummyjson.com/products`.
   - Real-time search by name, brand, or description.
   - Filter by category pills or select dropdown.
   - Sort by Price (Low to High, High to Low), Rating (Highest, Lowest), and Alphabetical.
   - Fallback offline data cache if API is offline.
5. **New Arrivals**: The freshest runway creations.
6. **Trending Products**: Highest-rated styles favored by editorial stylists.
7. **Best Sellers**: Iconic pieces with 5-star customer reviews.
8. **Special Offers**: 3 promotional banners with interactive coupon code copy & apply buttons (`LUMIERE20`, `GOLD15`, `FIRST10`).
9. **Customer Testimonials**: Discerning client quotes with star ratings and verified buyer avatars.
10. **Newsletter Subscription**: VIP Lumière Society invitation with interactive submission and instant toast notification.
11. **Footer**: Paris flagship address, concierge contacts, social links, collection links, and payment provider badges.
12. **404 Page**: Custom standalone `404.html` error page matching luxury aesthetics.

---

### 2. Interactive Modals & E-Commerce Flow
- **Product Details Modal**: High-resolution gallery preview, thumbnails, stock status, ratings, full specifications (Brand, SKU, Availability, Warranty), quantity adjustment, and Add to Bag.
- **Shopping Cart Drawer**: Slideout bag showing thumbnail, title, price, quantity increment/decrement, item deletion, live subtotal, discount deductions, and complimentary shipping calculation.
- **Promotional Coupons**: Supports `LUMIERE20` (20% off), `GOLD15` (15% off), and `FIRST10` (10% off).
- **Wishlist Functionality**: One-click heart toggle on cards and modal with state persisted across sessions.
- **Order Confirmation Modal**: Full checkout process with order code generation and order history logging.
- **LocalStorage Persistence**: Cart items, active coupons, wishlisted products, and completed orders are saved in browser `localStorage`.
- **Toast Notifications**: Smooth toast popups for additions, deletions, coupons, and errors.

---

### 3. Image Optimization (< 90 KB WebP)
- **All images** (hero slides, category tiles, promotional banners, product thumbnails, and testimonials) have been downloaded and compressed into modern **WebP** format.
- Every single image strictly complies with the **< 90 KB** requirement (ranging between 4 KB and 86 KB).

---

## 📁 Project Folder Structure

```
online Fashion/
├── index.html                           # Main boutique landing page
├── 404.html                             # Custom 404 error page
├── README.md                            # Documentation & overview
├── assets/
│   ├── css/
│   │   └── styles.css                   # Custom responsive styling & design system
│   ├── js/
│   │   ├── main.js                      # Vanilla JavaScript app logic & state
│   │   └── products-data.json           # Cached fashion products baseline
│   └── images/
│       ├── hero/                        # Hero slider banners (WebP < 90KB)
│       ├── categories/                  # Category covers (WebP < 90KB)
│       ├── banners/                     # Special offer banners (WebP < 90KB)
│       ├── testimonials/                # Client avatars (WebP < 90KB)
│       └── products/                    # DummyJSON product photos (WebP < 90KB)
└── scripts/
    ├── download_products.py             # Image download & WebP optimization script
    ├── download_editorial_images.py     # Editorial asset optimization script
    └── validate.js                      # Automated component & syntax validator
```

---

## 🚀 How to Run Locally

1. Simply double-click `index.html` to open in any web browser.
2. Alternatively, serve using any HTTP server:
   ```bash
   npx serve .
   # or
   python -m http.server 8000
   ```
3. Open `http://localhost:8000` in your browser.

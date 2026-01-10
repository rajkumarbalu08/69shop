# 69Shop.in Codebase Guide

## Architecture Overview
This is a static HTML-based e-commerce marketplace using Firebase for backend services. The site consists of multiple standalone HTML pages with client-side JavaScript integration.

**Key Components:**
- `Home.html`: Landing page with marketplace overview and navigation
- `Login.html`: User authentication interface (login/signup)
- `shop.html`: Main shopping interface with product listings
- `shop 1.html`: Alternative shop page variant (similar to shop.html but with different title/metadata)

**Data Flow:**
- User authentication handled via Firebase Auth
- Product and user data stored in Firestore
- All pages are static HTML with inline CSS/JS - no server-side rendering

## Firebase Integration
Firebase is initialized in `shop.html` with the following config:
```javascript
const firebaseConfig = {
    apiKey: "AIzaSyCJGhxrc-0LKxOEhvGnmcZlr0ignTC6SQI",
    authDomain: "shop69-1.firebaseapp.com",
    projectId: "shop69-1",
    storageBucket: "shop69-1.firebasestorage.app",
    messagingSenderId: "493886821318",
    appId: "1:493886821318:web:e5c011deeab1f3700dd8c7",
    measurementId: "G-7Q8JSJV0QJ"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
```

**Usage Pattern:** Access `auth` for authentication operations and `db` for Firestore database queries.

## Styling Conventions
All pages use a consistent design system defined via CSS custom properties:

**Color Palette (from :root):**
- Primary: `--blue-primary: #0066ff`
- Blacks: `--primary-black: #1A1A1A`, `--secondary-black: #2D2D2D`
- Grays: `--dark-grey: #404040`, `--medium-grey: #666666`, `--light-grey: #F8F8F8`

**Typography:**
- Body font: `'Inter', sans-serif`
- Headings: `'Poppins', sans-serif` (font-weight: 600)
- Icons: FontAwesome 6.4.0 via CDN

**Layout Patterns:**
- Container max-width: 1280px with 24px padding
- Box shadows: `--shadow-sm` to `--shadow-xl` for depth
- Border radius: `--radius-sm` (6px) to `--radius-xl` (24px)
- Transitions: `--transition-fast` (0.2s) to `--transition-slow` (0.5s)

**Example:** When adding new sections, use `.container` class and reference CSS variables instead of hardcoded values.

## Development Workflow
- **No build process required** - edit HTML files directly
- **Testing:** Open files in browser (e.g., `file://c:/Users/Rajkumar/Downloads/69shop/Home.html`)
- **Adding features:** Modify existing HTML structure or add new pages following the established patterns
- **Firebase changes:** Update config in `shop.html` if needed, but keep consistent across pages

## Key Files to Reference
- [Home.html](Home.html): Exemplifies full page structure with header, hero, features, footer
- [shop.html](shop.html): Shows Firebase integration and shopping UI patterns
- [Login.html](Login.html): Demonstrates form styling and authentication UI

## Adding New Features
When extending the site:
1. Maintain consistent CSS variable usage for theming
2. Include Firebase scripts only where needed (currently in shop pages)
3. Follow the header/footer structure from existing pages
4. Use semantic HTML with ARIA attributes for accessibility</content>
<parameter name="filePath">c:\Users\Rajkumar\Downloads\69shop\.github\copilot-instructions.md
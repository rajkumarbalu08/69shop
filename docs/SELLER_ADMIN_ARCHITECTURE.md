# Seller & Admin Experience Architecture

## Overview
The seller and admin surfaces share a static HTML delivery model with client-side rendering powered by Firebase Auth + Firestore. Each page bootstraps the same Firebase compat SDKs and delegates shared chrome responsibilities (shell UI, notifications, status chips) to reusable helpers:

- **SellerShell (`/js/seller-shell.js`)** drives avatar initials, verification badges, and pending order badges whenever a seller session is active.
- **AdminShell (`/js/admin-shell.js`)** keeps the admin sidebar, quick metrics, and in-app notifications in sync across all admin tools.
- **NotificationFeed (`/js/notifications.js`)** renders the slide-in notification tray for both personas with audience-specific queries.

All privileged actions are persisted to Firestore collections guarded by `firestore.rules`. Client code never bypasses these rules—writes require verified seller IDs or admin entitlements.

## Shared Infrastructure
| Layer | Responsibilities |
| --- | --- |
| Firebase Auth | Session state + ID token propagation for security rules. |
| Firestore | Data source for sellers, admins, products, services, settings, and audit trails. |
| Storage | Handles seller asset uploads (logos, product images). |
| Shell Scripts | Normalize UI identity elements without duplicating logic per page. |
| NotificationFeed | Streams relevant notifications via Firestore queries + badge indicators. |

## Seller Experience
1. **Access Control**: Every seller page validates Auth state, ensures a seller document exists, and syncs SellerShell before rendering the main UI.
2. **Products (`seller-products.html`)**:
   - Verifies sellers against both `sellers` + `sellerVerification` docs plus SellerShell state before enabling catalog actions.
   - Blocks add/edit/delete for unverified accounts and scrolls them to verification CTA.
3. **Services (`seller-services.html`)**:
   - Loads `sellerServices/{sellerId}` to hydrate category/option toggles.
   - New debounced auto-save layer batches rapid toggle/price edits and surfaces a status pill (“Unsaved → Saving → Saved”).
   - Manual “Save All” button flushes immediately via the same persistence path.
4. **Settings (`seller-settings.html`)**:
   - Populates business profile + notification toggles from the seller doc.
   - Notification switches now auto-save with a header status indicator, while the rest of the form continues to save on submit.
5. **Verification Awareness**: SellerShell + page-specific checks keep verification banners, CTA disablement, and profile chips aligned.
6. **Service Verification Queue**:
   - `seller-services.html` now routes every “Add category/option” action through the `serviceVerifications` collection.
   - Sellers can monitor pending/approved/rejected submissions in a dedicated card without those services leaking into live data until approved.

## Admin Experience
1. **Dashboard (`admin-dashboard.html`)**:
   - Aggregates Firestore reads for users, products, orders, and seller verification queue.
   - Revenue chart and quick filters update from cached order data.
   - Toggle widgets (revenue range filters) mutate in-memory state only; no persistence required.
2. **Settings (`admin-settings.html`)**:
   - Presents admin management (Lead Admin only), platform toggles, notification switches, and audit feed.
   - Debounced auto-save for platform + notification switches writes to `platformSettings/global` with change diffs logged under `adminActivity`.
3. **Security Rules Alignment**: Admin pages rely on `isAdmin()` / `isLeadAdmin()` helpers to guard Firestore writes, ensuring UI affordances match backend enforcement.
4. **Service Review Queue**: Admin dashboard streams pending `serviceVerifications` via Firestore listeners, enabling inline approve/reject controls that merge approved payloads into each seller’s `sellerServices` doc with reviewer metadata.

## Service Verification Workflow
1. **Submission**: Sellers trigger `submitServiceForReview` with structured payloads (category metadata or option details + delivery tags). Each submission stores seller identifiers, status `pending`, and timestamps.
2. **Seller Visibility**: A pending list surfaces the latest five submissions with live status pills so sellers know when to expect action or revise rejected entries.
3. **Admin Review**: The admin dashboard card (`Service Review Queue`) listens for pending submissions. Approve merges the payload into `sellerServices/{sellerId}` (creating categories/options as-needed) and stamps reviewer info; reject captures an optional admin note.
4. **Auditability**: Submission docs retain `status`, `adminNote`, `reviewerEmail`, and `reviewedAt`, giving both personas a shared source of truth for compliance reviews.

## Auto-save & Toggle Handling
| Page | Mechanism | Notes |
| --- | --- | --- |
| seller-services | `queueServiceAutoSave` debounces DOM snapshot → Firestore writes and reuses manual save path. | Prevents write storms when toggling multiple service options. |
| seller-settings (notifications) | `queueNotificationSave` focuses on `notifications` field only, updates status pill, retries queued saves. | Keeps long business form flows unaffected. |
| admin-settings | Existing debounced saver now mirrored on seller side for consistent UX. | Writes log change diff to `adminActivity`. |

## Testing & Monitoring
- **Playwright smoke tests** (`tests/e2e/public-navigation.spec.js`) hit the deployed hosting target to ensure public navigation stays functional.
- Additional persona-specific tests can extend the same harness once service accounts or test credentials are available (hooks already support `E2E_BASE_URL`).
- Manual checklist: verify Firebase Auth redirect flows, ensure SellerShell badges, and test Firestore writes via staging project before promoting rules.

## Future Enhancements
1. Add credentialed Playwright specs to exercise seller/service toggles end-to-end (env-driven secrets to avoid leaking accounts).
2. Mirror the seller notification status pill approach for other async actions (e.g., payouts, withdrawals) for consistent feedback.
3. Expand architecture doc with sequence diagrams once backend workflows (Cloud Functions, scripts) are formalized.
4. Consider persisting service category definitions in Firestore and rendering purely from data instead of static markup for easier A/B iterations.

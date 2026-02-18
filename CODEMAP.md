# CODEMAP — huzz (high-level annotated reference)

Last updated: 2026-02-02

This document maps the repository's important files and explains what each logical block does, how it works, and which UI/pages or APIs are affected. Use this as a quick on-ramp for debugging, reviews, and handoffs.

---

## Project overview
- Stack: Node (Express) + MySQL (mysql2) backend; React + Vite frontend (TypeScript/TSX); MUI for UI.
- Dev servers: backend default http://localhost:5000, frontend default http://localhost:5173
- Key goals implemented: service admin-approval workflow, provider-visible approval_status, uploaded image handling (absolute URLs), Settings (profile update, password-change, theme toggle).
- Current test status: integration tests mostly green, 3 failing tests focused on vendor-profile auth and password-change handling.

---

## Top-level files
- `README.md` — project summary and local dev instructions.
- `package.json` (root & server/) — dependency and script definitions.
- `vite.config.ts`, `index.html` — frontend bootstrapping.

---

## Backend (server/)

### server/server.js
- Purpose: main Express app — routes, middleware, file uploads, auth, and API surface.
- Major blocks:
  - Configuration & init (lines ~1–80): loads env, sets up Express, static serving (`public/`), ensures `public/uploads/` exists, initializes DB. Affects server startup.
  - CORS & JSON parsing (lines ~80–140): origin policy for dev/ngrok and request body parsing. Affects all API requests.
  - `verifyToken` middleware (lines ~140–200): extracts & verifies JWT, populates `req.userId` and `req.userRole`. Used by all protected endpoints (dashboard, settings, vendor admin endpoints).
  - Multer upload config (lines ~200–320): disk storage to `public/uploads`, filename strategy, mime-type whitelist. Used by upload endpoints (vendor/service uploads, profile image).
  - Auth endpoints (`/api/auth/register`, `/api/auth/login`) (lines ~320–520): register and login flows; call into `db.js` helpers; return JWT + user. Affects signup/login UI and tests.
  - Dashboard endpoints (mocked) and admin routes (lines ~520–900): provider/organizer/admin dashboards, user management. Affects dashboard pages and admin UIs.
  - Service endpoints (create/update/list/approved) (mid-file): handles vendor service creation, persists `approval_status` (`pending|approved|declined`), normalizes image URLs to absolute for client consumption. Critical for Browse Vendors and Vendor Services pages.
  - Settings endpoints (`/api/settings/profile`, `/api/settings/notifications`) (lines ~850+): profile updates, password-change flow (verifies current password synchronously then hashes new one). Affects `Settings` page and auth tests.
  - Admin approval endpoints (`/api/admin/services/:id/approve`, decline) (lower file): enforces server-side approval and updates `approval_status`. Affects AdminServiceApproval and public visibility.
- Notes/known issues: password-change path was hardened recently — some test coverage still failing (see integration tests).

### server/db.js
- Purpose: MySQL connection pool and DB helper functions used by `server.js`.
- Major blocks:
  - Pool initialization & helpers (`getPool`, `initializeDatabase`) — creates tables if missing and exposes query helpers.
  - User helpers (`registerUser`, `loginUser`) — handle hashing (bcryptjs) and JWT creation. Used by auth routes.
  - Service helpers (`createService`, `getApprovedServices`, `getVendorServices`) — implement DB-level filtering by `approval_status` and ensure image paths are stored/returned consistently.
  - Migration-safe utility code for seeding and idempotent schema changes.
- Affects: all persistent behavior (auth, services visibility, seeding scripts, and tests).

### server/database-init.js & seed scripts
- Purpose: schema initialization, adding `approval_status` enum, creating indexes, and seeding demo/admin/vendor data.
- Major blocks:
  - Table DDL for `users`, `services`, `bookings`, etc.
  - Seed data for admin/vendor accounts (bcryptjs hashed passwords).
- Affects: first-time setup and CI; includes helpful SQL that documents schema changes (e.g., `services.approval_status`).

### server/test-api-integration.js
- Purpose: end-to-end HTTP smoke tests that exercise auth, dashboards, services, and settings (password-change edge cases included).
- Major blocks:
  - Health/auth/service/profile/password-change tests.
  - Setup: uses a running server at `http://localhost:5000/api` and test accounts created on the fly.
- Affects: CI gating and local validation. Current failing tests point to vendor-profile auth expectation and password-change error handling.

---

## Frontend (src/)

High-level: React + Vite + TypeScript, ThemeContext persists theme to localStorage, `src/api.js` centralizes axios calls and base URL.

### src/main.tsx, src/index.css, App.tsx
- Purpose: app bootstrap, theme provider, route definitions (`/`, `/browse`, `/vendor-services`, `/settings`, etc.).
- Affects: global app behavior and route layout.

### src/api.js
- Purpose: axios instance with baseURL and JSON helpers; attaches Authorization header from localStorage in client code.
- Affects: every API call from the frontend.

### src/themes/ThemeContext.tsx
- Purpose: provide light/dark theme, `toggleTheme`, and persist preference to `localStorage`.
- Affects: `Settings` page theme toggle and global appearance.

### Key pages/components (priority)
- `src/pages/BrowseVendors.tsx` — consumes `/approved-services`, normalizes image URLs (converts `/uploads/...` → absolute URL), maps services to vendor cards. Affected UI: public listing, image display on cards, booking flow.
  - Important block: image normalization and fallback avatar generation.
- `src/pages/VendorServices.tsx` — vendor-side service creation and list; shows `approval_status` chip and 'pending' messaging. Affected UI: provider management, upload preview, and create/update flows.
- `src/pages/VendorProfile.tsx` — provider profile view/edit; uses `/vendor/profile` API (protected). Affected UI: provider details and profile image.
- `src/pages/Settings.tsx` — profile update, profile-image upload, password-change form, and theme toggle wired to `ThemeContext`. Affected UI: account management and appearance settings.
- `src/components/ProtectedRoute.tsx` — route guard that checks auth token and redirects to SignIn.

### Other UI pieces
- `src/components/DashboardSidebar.tsx`, `DashboardComponents.tsx` — navigation and dashboard widgets used by provider/admin/organizer dashboards.
- `src/pages/dashboards/*` — role-specific dashboards (AdminDashboard, ProviderDashboard, OrganizerDashboard).

---

## Public/static
- `public/uploads/` — user- and service-uploaded images (served statically).
- Some sample images and pravatar fallbacks are used client-side when `service.image` is missing.

---

## Tests & CI notes
- Integration tests: `server/test-api-integration.js` — exercise critical flows (auth, services, settings). Current failures:
  - `Get Vendor Profile` — test updated to expect authenticated provider access; server previously allowed unauthenticated access (or vice-versa).
  - Password-change: incorrect-current-password flow and successful-change path show inconsistent responses (401 vs 500). Likely regression in synchronous password verification or error handling.
- Recommended quick fixes: add clearer error logging in `/api/settings/profile` (done) and ensure bcryptjs is imported consistently (done).

---

## Where to look for the failing tests (P0)
1. `server/server.js` — `/api/vendor/profile` handler and `verifyToken` usage (auth mismatch).
2. `server/server.js` — `/api/settings/profile` password-change branch (500 on success indicates an exception in the update path or DB callback).
3. `server/test-api-integration.js` — the tests have been updated to reflect the intended behavior; align the server to the tests or vice-versa.

---

## Recommended next steps (short, prioritized)
1. Fix vendor-profile auth mismatch and ensure `/vendor/profile` requires a valid provider token (or update tests if public). (P0)
2. Fix the password-change success 500: inspect DB query callback and ensure errors are caught and returned as 4xx/5xx intentionally. Add unit tests for the path. (P0)
3. Normalize any remaining relative image paths in DB by adding a migration or normalizer endpoint. (P1)
4. Add decline-reason and provider notification on approval/decline (UX). (P2)

---

## Quick reference: important symbols & where they are used
- approval_status (DB: `services.approval_status`) — used by `GET /approved-services`, admin approve/decline, provider UI chips.
- `/api/vendor/services` — create/update vendor services (server.js + VendorServices.tsx).
- `/api/approved-services` — public listing used by `BrowseVendors.tsx`.
- `/api/settings/profile` — profile update & password-change (server.js + Settings.tsx).
- `ThemeContext.toggleTheme()` — used by `Settings.tsx` and persisted to `localStorage`.

---

## Appendix — where to find important blocks quickly
- Auth: `server/server.js` (routes) + `server/db.js` (registerUser/loginUser)
- Services: `server/server.js` + `server/db.js` + `src/pages/VendorServices.tsx` + `src/pages/BrowseVendors.tsx`
- Settings/password: `server/server.js` + `src/pages/Settings.tsx` + `server/test-api-integration.js`

---

If you want, I can now:
- Create inline comment blocks for the backend files listed (safe, non-functional comments) and run the integration tests (recommended). (I will start with backend files.)
- Or, generate a full per-file inline-comment PR (larger change).

Reply: `annotate-backend` to add inline comments to backend files now, or `annotate-all` to annotate the priority frontend files next.
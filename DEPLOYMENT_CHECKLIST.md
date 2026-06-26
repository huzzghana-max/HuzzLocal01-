# Supabase + Vercel Deployment Checklist

A structured plan to migrate and deploy the HUZZ app with Supabase backend and Vercel frontend hosting.

---

## Phase 1: Project Audit & Planning

### 1.1 Inventory Current Architecture
- [ ] Review `server/db.js` — document current database schema (tables, columns, relationships)
- [ ] Review `server/server.js` — list all API endpoints and their functions
- [ ] Review `server/middleware.js` — document auth and middleware logic
- [ ] Identify all file upload locations in code (images, videos, documents)
- [ ] List all external dependencies / APIs (payments, email, etc.)
- [ ] Document current user roles and permission model (`organizer`, `provider`, `admin`)
- [ ] Confirm build & run commands work locally (`npm run dev`, `npm run build`)

### 1.2 Define Deployment Architecture
- [ ] Decide backend approach:
  - [ ] Option A: Frontend-only (Supabase client + RLS policies)
  - [ ] Option B: Supabase + Edge Functions for business logic
  - [ ] Option C: Minimal Express + Supabase (hybrid)
- [ ] Document choice and reasoning
- [ ] List any server-side logic that must remain (e.g., payments, webhooks)

---

## Phase 2: Supabase Setup

### 2.1 Create & Configure Supabase Project
- [ ] Create a new Supabase project at https://supabase.com
- [ ] Note project URL and API keys
- [ ] Enable email/password auth in **Authentication > Providers**
- [ ] Configure SMTP or use Supabase's built-in email (for password reset, verification)

### 2.2 Configure Supabase Authentication
- [ ] Set up email/password sign-in
- [ ] Enable user metadata fields for storing role (`organizer`, `provider`, `admin`)
- [ ] Configure redirect URLs for auth callbacks (will add Vercel URL later)
- [ ] Set up password reset and email verification templates

### 2.3 Define PostgreSQL Schema
- [ ] Create `users` table (or extend Supabase auth.users):
  - [ ] user_id (UUID, references auth.users)
  - [ ] email
  - [ ] role (enum: organizer, provider, admin)
  - [ ] name, profile_picture_url
  - [ ] created_at, updated_at
- [ ] Create `events` table:
  - [ ] event_id (UUID, primary key)
  - [ ] organizer_id (FK to users)
  - [ ] title, description, image_url
  - [ ] date, time, location
  - [ ] ticket_info (JSON or separate table)
  - [ ] created_at, updated_at
- [ ] Create `service_providers` table:
  - [ ] provider_id (UUID, primary key)
  - [ ] user_id (FK to users)
  - [ ] services (JSONB or separate services table)
  - [ ] availability, portfolio_url
  - [ ] created_at, updated_at
- [ ] Create `bookings` table:
  - [ ] booking_id (UUID, primary key)
  - [ ] event_id (FK to events)
  - [ ] provider_id (FK to service_providers)
  - [ ] status (enum: pending, confirmed, completed, cancelled)
  - [ ] payment_info (if applicable)
  - [ ] created_at, updated_at
- [ ] Create any lookup/reference tables (support categories, etc.)
- [ ] Run migration SQL to populate schema

### 2.4 Set Up Storage
- [ ] Create Supabase Storage bucket `uploads` (for event/vendor images)
- [ ] Create bucket `documents` (if storing files)
- [ ] Configure bucket privacy (public vs. private)
- [ ] Set up appropriate CORS policy for frontend access

### 2.5 Configure Row Level Security (RLS)
- [ ] Enable RLS on all tables
- [ ] Define policies for `users` table:
  - [ ] Users can read their own profile
  - [ ] Users can update their own profile
- [ ] Define policies for `events` table:
  - [ ] Everyone can read published events
  - [ ] Organizers can create/edit their own events
- [ ] Define policies for `service_providers` table:
  - [ ] Everyone can read approved providers
  - [ ] Providers can edit their own profile
- [ ] Define policies for `bookings` table:
  - [ ] Users can view their own bookings
  - [ ] Admins can view all bookings
- [ ] Test policies with both authenticated and unauthenticated requests

---

## Phase 3: Frontend Migration

### 3.1 Prepare Codebase
- [ ] Create a new branch: `git checkout -b feature/supabase-migration`
- [ ] Install Supabase SDK:
  ```bash
  npm install @supabase/supabase-js
  ```
- [ ] Create `src/lib/supabaseClient.ts`:
  ```typescript
  import { createClient } from '@supabase/supabase-js'
  
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
  
  export const supabase = createClient(supabaseUrl, supabaseAnonKey)
  ```

### 3.2 Update Environment Variables
- [ ] Create `.env.local` (for local development):
  ```
  VITE_SUPABASE_URL=<your-supabase-url>
  VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>
  ```
- [ ] Add `.env.local` to `.gitignore`
- [ ] Document env var names for Vercel setup (Phase 4)

### 3.3 Migrate Authentication
- [ ] Update `src/contexts/AuthContext.tsx` to use Supabase Auth:
  - [ ] Replace login endpoint with `supabase.auth.signInWithPassword()`
  - [ ] Replace register endpoint with `supabase.auth.signUp()`
  - [ ] Replace logout with `supabase.auth.signOut()`
  - [ ] Use `supabase.auth.onAuthStateChange()` to listen for session updates
- [ ] Store user role in Supabase metadata or query from `users` table
- [ ] Update `ProtectedRoute.tsx` to check Supabase session instead of localStorage
- [ ] Test sign-up, sign-in, and sign-out flows locally

### 3.4 Migrate CRUD Operations
- [ ] Replace event listing API call with Supabase query:
  ```typescript
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('status', 'published')
  ```
- [ ] Replace event creation with Supabase insert
- [ ] Replace service provider listing/search with Supabase query
- [ ] Replace booking creation/status updates with Supabase operations
- [ ] Update all pages that fetch or modify data
- [ ] Test each CRUD flow locally

### 3.5 Migrate File Uploads
- [ ] Update file upload components to use Supabase Storage:
  ```typescript
  const { data, error } = await supabase.storage
    .from('uploads')
    .upload(`${folder}/${filename}`, file)
  ```
- [ ] Replace image src URLs to use Supabase Storage public URLs
- [ ] Test upload and display flows locally

### 3.6 Remove Server Dependencies
- [ ] Comment out or remove localhost:5000 API calls in axios config
- [ ] Ensure all data access goes through Supabase
- [ ] Remove `src/api.js` references if no longer needed
- [ ] Check for any remaining hardcoded API endpoints

### 3.7 Local Testing
- [ ] Run `npm run dev` and test full user flow:
  - [ ] Sign up as new user
  - [ ] View events
  - [ ] Create event (if organizer)
  - [ ] Upload image
  - [ ] View dashboard
  - [ ] Sign out
- [ ] Test admin workflows if applicable
- [ ] Verify no console errors

### 3.8 Build & Validate
- [ ] Run `npm run build` — confirm no TypeScript errors
- [ ] Run `npm run preview` — test production build locally
- [ ] Verify environment variables are properly read in build

---

## Phase 4: Vercel Deployment

### 4.1 Prepare Repository
- [ ] Commit all frontend changes:
  ```bash
  git add -A
  git commit -m "feat: migrate to Supabase backend"
  ```
- [ ] Push branch to GitHub:
  ```bash
  git push origin feature/supabase-migration
  ```

### 4.2 Create Vercel Project
- [ ] Go to https://vercel.com and sign in / create account
- [ ] Create a new project or import existing GitHub repo
- [ ] Select the repository and branch (`feature/supabase-migration` or `main`)
- [ ] Vercel will auto-detect build settings (Vite)
- [ ] Confirm build command: `npm run build`
- [ ] Confirm output directory: `dist`

### 4.3 Configure Environment Variables in Vercel
- [ ] In Vercel project settings, go to **Environment Variables**
- [ ] Add:
  - [ ] `VITE_SUPABASE_URL=<your-supabase-url>`
  - [ ] `VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>`
- [ ] Apply to all environments (Preview, Production, Development)

### 4.4 Update Supabase Auth Redirect URLs
- [ ] In Supabase, go to **Authentication > URL Configuration**
- [ ] Add Vercel preview URL: `https://<project>.vercel.app`
- [ ] Add Vercel production URL: `https://<custom-domain>.com` (if using custom domain)
- [ ] Save

### 4.5 Update CORS Settings (if applicable)
- [ ] In Supabase project settings, configure CORS for Vercel domain:
  - [ ] `https://<project>.vercel.app`
  - [ ] `https://<custom-domain>.com`
- [ ] Verify Supabase Storage buckets allow access from these origins

### 4.6 Deploy to Vercel
- [ ] Click **Deploy** in Vercel (or trigger via GitHub push)
- [ ] Wait for build to complete
- [ ] Check build logs for errors
- [ ] Verify deployed app at `https://<project>.vercel.app`

### 4.7 Test Deployed App
- [ ] Sign up as new user from deployed URL
- [ ] Verify email confirmation works
- [ ] Browse events/services
- [ ] Create/edit content (if applicable)
- [ ] Upload and view images
- [ ] Verify admin dashboard (if applicable)
- [ ] Check console for any JavaScript errors

### 4.8 Set Up Custom Domain (Optional)
- [ ] In Vercel, add custom domain to project
- [ ] Update DNS records at domain registrar
- [ ] Wait for DNS propagation
- [ ] Test custom domain URL

---

## Phase 5: Optimize & Monitor

### 5.1 Performance
- [ ] Test page load times and Lighthouse scores
- [ ] Optimize image sizes and formats
- [ ] Enable gzip/compression in Vercel (usually default)
- [ ] Consider image CDN or Supabase image optimization

### 5.2 Security
- [ ] Audit Supabase RLS policies — ensure no unauthorized access
- [ ] Review Supabase Storage bucket permissions
- [ ] Verify API keys are not exposed in frontend code
- [ ] Enable Supabase two-factor authentication
- [ ] Document API key rotation process

### 5.3 Monitoring & Logging
- [ ] Set up Supabase project monitoring
- [ ] Enable Vercel Analytics for performance insights
- [ ] Configure error tracking (e.g., Sentry) if needed
- [ ] Monitor Supabase database usage and costs

### 5.4 Backups
- [ ] Enable automated Supabase backups
- [ ] Document backup retention policy
- [ ] Test backup restore procedure

---

## Phase 6: Post-Deployment Tasks

### 6.1 Documentation
- [ ] Document Supabase schema and API endpoints
- [ ] Document Vercel deployment process for team
- [ ] Create runbook for common tasks (adding users, resetting data, etc.)
- [ ] Document environment variables and secrets

### 6.2 Team Onboarding
- [ ] Brief team on new architecture
- [ ] Share Supabase and Vercel project access
- [ ] Document login credentials (password manager recommended)

### 6.3 Deprecation
- [ ] Archive or remove old MySQL server
- [ ] Update any internal documentation referencing old URLs
- [ ] Consider keeping old server as backup for 1-2 weeks

### 6.4 Staging Environment
- [ ] Create a separate Supabase project for staging/testing
- [ ] Create a staging Vercel deployment (different branch)
- [ ] Document how to deploy to staging vs. production

---

## Phase 7: Optional Enhancements

### 7.1 Supabase Edge Functions
- [ ] If complex logic needed, create Edge Functions for:
  - [ ] Payment processing webhooks
  - [ ] Email notifications
  - [ ] Complex validations
- [ ] Deploy via Supabase CLI

### 7.2 Real-time Features
- [ ] If needed, implement Supabase Realtime subscriptions:
  - [ ] Live notifications for bookings
  - [ ] Live event updates
- [ ] Test WebSocket connections from Vercel

### 7.3 Analytics
- [ ] Set up Supabase analytics for user behavior
- [ ] Connect to analytics tool (Mixpanel, Plausible, etc.)

---

## Rollback Plan

If issues arise post-deployment:

- [ ] Keep old server running for 1-2 weeks as fallback
- [ ] If critical bugs found, immediately roll back Vercel to previous commit
- [ ] Notify team and users of any data inconsistencies
- [ ] Identify root cause and fix in a hotfix branch
- [ ] Re-deploy after testing

---

## Summary Checklist (Quick Reference)

### Must-Do Items
- [ ] Supabase project created and schema migrated
- [ ] Frontend uses `@supabase/supabase-js` for all data access
- [ ] AuthContext updated to use Supabase Auth
- [ ] Environment variables configured in Vercel
- [ ] Auth redirect URLs configured in Supabase
- [ ] App deployed to Vercel and all major flows tested
- [ ] RLS policies enable correct access control

### Nice-to-Have
- [ ] Custom domain configured
- [ ] Staging environment set up
- [ ] Edge Functions for advanced logic
- [ ] Real-time subscriptions enabled
- [ ] Analytics integrated
- [ ] Monitoring & alerting configured

---

**Last Updated:** 2026-06-26  
**Status:** Ready for execution

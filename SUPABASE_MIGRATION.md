# HUZZ Supabase + Vercel Migration Strategy

This plan uses a pragmatic hybrid architecture:

- Frontend: Vite/React deployed to Vercel
- Backend: existing Express API deployed to Render or another Node host
- Database: Supabase Postgres
- Storage: keep current upload flow initially, then migrate uploads to Supabase Storage in a controlled follow-up

The first deployment goal is stability, not a full rewrite. Supabase Auth, direct frontend database access, RLS-heavy policies, and Edge Functions should be treated as later phases after the current app is live on hosted infrastructure.

---

## 1. Architecture Decision

### Chosen Path: Express API + Supabase Postgres

The current application has substantial server-side behavior:

- Custom JWT login/register flow
- Role-based dashboards for organizers, providers, and admins
- Service booking logic
- Ticket creation, sales, QR validation, and refunds
- Paystack and Stripe payment integrations
- Payment webhooks
- Email notifications
- SMS verification
- Support tickets and admin support workflows
- Payout requests
- Multipart image uploads

Because of this, a frontend-only Supabase client migration would require rewriting most of the application. The safer migration is to preserve the backend API contract and move the database from local/MySQL-style infrastructure to Supabase Postgres.

### What This Means

- The frontend should continue using `src/api.js`.
- The frontend should use `VITE_API_BASE_URL`, not `VITE_SUPABASE_URL`.
- The backend should connect to Supabase using `SUPABASE_DB_URL`.
- Supabase Auth is not part of this first migration.
- Row Level Security is not required for app behavior while the Express backend is the only database client.

---

## 2. Migration Principles

1. Keep the public API contract stable.
2. Move one infrastructure layer at a time.
3. Preserve server-side ownership of sensitive flows: payments, webhooks, email, SMS, admin actions, and payouts.
4. Do not expose service-role credentials or database credentials to the browser.
5. Deploy backend first, then frontend.
6. Validate with real smoke tests before changing DNS or production traffic.

---

## 3. Phase 0: Pre-Migration Audit

### Backend API Inventory

Document the existing API surface from `server/server.js`, `server/payment-routes.js`, and `server/ticket-management-routes.js`.

Group endpoints by domain:

- Auth
- Users and settings
- Events
- Tickets and attendance
- Vendor services
- Bookings
- Messaging
- Payments
- Payouts
- Support and FAQ
- Admin

For each group, identify:

- Auth requirements
- Tables touched
- External services used
- File upload behavior
- Critical validation/business rules

### Data Inventory

Confirm which data must be preserved:

- Users
- Events
- Services
- Bookings
- Ticket sales
- Payments
- Reviews
- Messages
- Support tickets
- Payout requests
- Uploaded files

If production data exists, plan a real migration. If not, seed fresh Supabase data and skip import complexity.

---

## 4. Phase 1: Supabase Database Setup

### Create Supabase Project

1. Create the Supabase project.
2. Save the Postgres connection string.
3. Restrict access to project credentials.
4. Do not place database credentials in frontend env vars.

### Apply Schema

Preferred repeatable command:

```text
cd server
npm run supabase:schema
```

This command reads:

```text
SUPABASE_DB_URL
```

and applies `server/sql/supabase_schema.sql`.

You can also run the SQL file manually in Supabase SQL Editor if needed.

Then verify:

- Tables exist.
- Foreign keys are valid.
- Seeded support categories and FAQs exist.
- Identity columns are working.
- Enum-like `CHECK` constraints match the backend code.

### Bootstrap First Admin

For a fresh Supabase database, create the first admin intentionally:

```text
cd server
npm run supabase:bootstrap-admin
```

Required env vars:

```text
ADMIN_BOOTSTRAP_EMAIL=<admin-email>
ADMIN_BOOTSTRAP_PASSWORD=<strong-temporary-password>
ADMIN_BOOTSTRAP_NAME=<display-name>
```

After first login, rotate the password.

### RLS Decision

For the hybrid architecture, the backend owns authorization. Direct browser access to Supabase tables is not used.

Recommended first-pass policy:

- Do not expose Supabase anon database access to the frontend.
- Keep frontend traffic routed through Express.
- If RLS is enabled later, design policies table by table after the app is stable.

---

## 5. Phase 2: Backend Migration

### Backend Environment Variables

Set these on the backend host:

```text
NODE_ENV=production
PORT=5000
SUPABASE_DB_URL=postgresql://postgres.<project-ref>:<password>@aws-1-eu-central-1.pooler.supabase.com:6543/postgres
JWT_SECRET=<strong-random-secret>
PUBLIC_BASE_URL=https://<backend-domain>
CORS_ORIGIN=https://<vercel-domain>,https://<custom-domain>
```

Optional but required for related features:

```text
MAIL_HOST=
MAIL_PORT=
MAIL_SECURE=
MAIL_USER=
MAIL_PASS=
MAIL_FROM=
ADMIN_EMAIL=

PAYSTACK_SECRET_KEY=
PAYSTACK_CURRENCY=
STRIPE_SECRET_KEY=

MNOTIFY_API_KEY=
MNOTIFY_SENDER_ID=
```

### Backend Compatibility Checks

Before deployment, verify the backend supports Postgres correctly:

- `server/db.js` selects Supabase/Postgres when `SUPABASE_DB_URL` is present.
- SQL syntax is valid for Postgres.
- Insert id handling works with Postgres `RETURNING id`, or the db adapter normalizes it.
- MySQL-only statements are either removed or isolated from the Supabase path.
- Password hashing and JWT creation still work.
- Middleware attaches user id and role consistently.

### Backend Deployment

1. Deploy the server directory to Render or another Node host.
2. Set env vars.
3. Run the backend start command.
4. Confirm:

```text
GET /api/health
```

5. Confirm CORS allows the Vercel preview and production origins.

---

## 6. Phase 3: Frontend Deployment

### Frontend Environment Variables

Set this in Vercel:

```text
VITE_API_BASE_URL=https://<backend-domain>/api
```

Do not add Supabase browser keys unless the frontend is intentionally using `@supabase/supabase-js`.

### Build Settings

Vercel should use:

```text
npm run build
dist
```

### Frontend Verification

Run locally before deployment:

```text
npm run build
npm run preview
```

Then deploy to Vercel and verify that requests go to the hosted backend, not `/api` on Vercel.

### API Smoke Test

After the backend is deployed:

```text
cd server
npm run smoke:api
```

Set this when testing a hosted backend:

```text
SMOKE_API_BASE_URL=https://<backend-domain>/api
```

---

## 7. Phase 4: Data Migration

Only run this phase if existing production data must be preserved.

### Export Source Data

Export data from the current database in a FK-safe order:

1. `users`
2. `events`
3. `service_providers`
4. `services`
5. `bookings`
6. `service_bookings`
7. `tickets`
8. `ticket_sales`
9. `event_registrations`
10. `event_attendees`
11. `reviews`
12. `messages`
13. `support_tickets`
14. `support_messages`
15. `payout_requests`
16. `payments`

### Import Into Supabase

After import, reset identity sequences:

```sql
SELECT setval(pg_get_serial_sequence('users', 'id'), COALESCE(MAX(id), 1), true) FROM users;
```

Repeat for every identity table.

### File Uploads

Current uploads are stored under `public/uploads`.

Initial migration options:

- Short term: keep backend-hosted uploads and ensure the backend host persists uploaded files.
- Better production option: migrate uploads to Supabase Storage or another object store.

Do not rely on ephemeral server disk for long-term production uploads.

---

## 8. Phase 5: Smoke Test Matrix

Run these against the deployed backend and frontend.

### Public Flows

- View public events
- View event detail
- View approved vendor services
- Submit contact form
- View FAQs

### Auth Flows

- Register organizer
- Register provider
- Login
- Logout
- Token expiry handling
- Invalid login handling

### Organizer Flows

- Create event with image
- Edit event
- Delete event
- Create ticket
- View registrants
- Validate attendee or ticket
- Request payout

### Provider Flows

- Create vendor service with image
- Edit vendor service
- Update availability
- View provider bookings
- Confirm/reject booking
- Request payout

### Admin Flows

- View users
- Change user roles
- Approve/decline services
- View all events
- Update event status
- View support analytics
- Process payout requests

### Payment Flows

- Initialize Paystack payment
- Verify Paystack payment
- Confirm ticket purchase
- Confirm webhook signature handling
- Confirm failed payment behavior

### Support Flows

- Create support ticket
- Add support message
- Admin reply
- Change ticket status
- Search/filter tickets

---

## 9. Phase 6: Production Readiness

### Security

- Rotate default JWT secret.
- Remove fallback secrets from production paths.
- Confirm CORS is not wildcard in production.
- Confirm no database credentials are present in frontend code.
- Confirm payment webhook signature verification is enabled.
- Confirm admin-only routes enforce admin role, not just login.

### Reliability

- Add backend health check.
- Add error logging.
- Monitor failed payment verifications.
- Monitor email/SMS failures.
- Confirm database connection pooling is appropriate for the host.

### Backups

- Enable Supabase backups.
- Document restore process.
- Export schema and seed files into version control.

---

## 10. Rollback Plan

Keep the previous environment available until the hosted stack is proven stable.

Rollback options:

1. Repoint frontend `VITE_API_BASE_URL` to the old backend.
2. Roll back Vercel to the previous deployment.
3. Roll back backend deployment to the previous release.
4. If data was migrated, freeze writes before switching traffic back to avoid split-brain data.

---

## 11. Later Migration: Supabase-Native Architecture

After the hybrid deployment is stable, decide whether to move deeper into Supabase.

Possible future phases:

- Move uploaded files to Supabase Storage.
- Replace custom auth with Supabase Auth.
- Convert user ids from `BIGINT` to `UUID` linked to `auth.users`.
- Add RLS policies.
- Move selected backend logic to Supabase Edge Functions.
- Add Supabase Realtime for messaging or booking notifications.

These should be handled as separate projects because they change app identity, authorization, and data access patterns.

---

## Current Status

Status: Hybrid migration strategy selected. Ready for detailed endpoint audit and backend compatibility testing.

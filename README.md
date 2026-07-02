# HUZZ � Event Operations & Vendor Marketplace

**Project Overview**
HUZZ is a full-stack event operations platform that helps organizers plan and run events, book service providers, manage tickets and public registrations, and coordinate vendors from a single dashboard. It includes guest flows for attendance and booking, provider dashboards, admin approvals, messaging, payouts, and integrated payments.

**Key Features**
- Organizer, provider, and admin roles with dashboards
- Event creation, publishing, and public listings
- Ticketing with QR codes and validation
- Public event registration (no signup required)
- Guest ticket purchase (no signup required)
- Guest service booking with email verification
- Provider marketplace with approvals and reviews
- In-app messaging and support tickets
- Payout requests and reporting
- Paystack payments and optional Stripe support

**Tech Stack**
- Frontend: React 19, TypeScript, Vite, MUI
- Backend: Node.js, Express, MySQL
- Auth: JWT
- Payments: Paystack, optional Stripe
- Email: SMTP via Nodemailer

**Architecture**
- `src/` is the React frontend (Vite)
- `server/` is the Express API + MySQL schema initialization
- Shared auth uses JWT in the `Authorization: Bearer <token>` header

**Project Structure**
- `src/` Frontend pages, components, context, and theme
- `server/` Express server, DB schema init, mailer, and payment routes
- `public/` Static assets and uploads directory
- `.env` Runtime configuration

**Prerequisites**
1. Node.js 18+ (or newer)
2. MySQL 8+ running locally

**Environment Variables**
Copy `.env.example` to `.env` and fill in real values.

Required variables (core):
- `VITE_API_BASE_URL` Base URL for the backend API
- `MYSQL_HOST` MySQL host (if not local)
- `MYSQL_USER` MySQL user
- `MYSQL_PASSWORD` MySQL password
- `MYSQL_PORT` MySQL port
- `MYSQL_DATABASE` Database name
- `JWT_SECRET` Secret for JWT signing

Email (guest registration, tickets, booking verification):
- `MAIL_HOST`
- `MAIL_PORT`
- `MAIL_SECURE`
- `MAIL_USER`
- `MAIL_PASS`
- `MAIL_FROM`

Payments (optional but supported):
- `VITE_PAYSTACK_PUBLIC_KEY`
- `PAYSTACK_SECRET_KEY`
- `PAYSTACK_PUBLIC_KEY`
- `PAYSTACK_CURRENCY`
- `STRIPE_SECRET_KEY` (optional)

SMS Notifications (Frog or mNotify):
- `FROG_API_KEY`
- `FROG_USERNAME`
- `FROG_SENDER_ID`
- `MNOTIFY_API_KEY`
- `MNOTIFY_SENDER_ID`

**Running the App (Local)**
1. Install frontend dependencies:
   - `npm install`
2. Install backend dependencies:
   - `cd server`
   - `npm install`
3. Start the backend:
   - `npm run dev` (in `server/`)
4. Start the frontend:
   - `npm run dev` (in project root)

**Database Initialization**
The backend auto-initializes schema on startup. You can also run:
- `npm run db:init` (from `server/`)

Seed scripts (optional):
- `npm run db:seed`
- `npm run db:seed-vendors`
- `npm run db:seed-all`

**Core User Flows**
**Organizer**
- Create events and tickets
- View registrants and ticket sales
- Book providers

**Provider**
- Manage services and availability
- Accept or decline bookings
- Request payouts

**Admin**
- Approve services
- View all events, attendees, and ticket sales

**Guest Flows (No Signup)**
- Public event registration (`/api/events/:eventId/attend` without ticket)
- Guest ticket purchase (`/api/events/:eventId/attend` with ticket)
- Guest provider booking (`/api/service-bookings`) with email verification

**Guest Booking Verification**
1. Client requests code: `POST /api/service-bookings/verify-email`
2. Server emails a 6-digit code (10 min expiry)
3. Guest submits booking with `verification_code`

**Payments**
- Paystack popup on the frontend
- Server verifies Paystack transactions
- Stripe endpoints exist for payment intents if `STRIPE_SECRET_KEY` is set

**Uploads**
- Uploaded images are stored under `public/uploads/`
- Multer handles image uploads in the backend

**API Overview (High-Level)**
Auth
- `POST /api/auth/register`
- `POST /api/auth/login`

Events
- `GET /api/events/public`
- `GET /api/events/:eventId`
- `POST /api/events/:eventId/attend` (public register or ticket purchase)
- `GET /api/events/:eventId/tickets`
- `POST /api/events/:eventId/tickets` (organizer)

Service Bookings
- `POST /api/service-bookings` (auth or guest)
- `POST /api/service-bookings/verify-email` (guest)
- `GET /api/my-bookings`
- `GET /api/provider-bookings`

Vendor Services
- `GET /api/approved-services`
- `POST /api/vendor/services`

Messaging
- `GET /api/conversations`
- `GET /api/messages/:userId`
- `POST /api/messages`

Payouts
- `GET /api/payouts/summary`
- `GET /api/payouts/my-requests`
- `POST /api/payouts/request`

Admin
- `GET /api/admin/events`
- `GET /api/admin/events/:eventId/attendees`
- `GET /api/admin/ticket-sales`

Support
- `GET /api/support/categories`
- `GET /api/support/faqs`

**Scripts**
Frontend
- `npm run dev`
- `npm run build`
- `npm run preview`
- `npm run lint`

Backend (from `server/`)
- `npm run start`
- `npm run dev`
- `npm run db:init`
- `npm run db:seed`
- `npm run db:seed-vendors`
- `npm run db:seed-all`

**Troubleshooting**
- If auth fails, verify MySQL connection and JWT secret.
- If emails do not send, check SMTP credentials and `MAIL_*` values.
- If Paystack fails, verify keys and currency settings.

**Notes**
- API routes are defined in `server/server.js` and `server/payment-routes.js`.
- Database schema and migrations are in `server/db.js`.

---

If you want, I can also generate a separate `docs/` folder with API reference tables, sequence diagrams, and a deployment guide.

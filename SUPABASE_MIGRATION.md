# Supabase Migration Runbook

## 1) Apply schema
1. Open Supabase SQL Editor.
2. Run:
- `server/sql/supabase_schema.sql`

## 2) Configure backend env (Render)
Set in Render service:
- `NODE_ENV=production`
- `SUPABASE_DB_URL=postgresql://postgres:<password>@<host>:5432/postgres`
- `JWT_SECRET=<strong-random-secret>`
- `PUBLIC_BASE_URL=https://<your-backend>.onrender.com`
- `CORS_ORIGIN=https://<your-vercel-app>.vercel.app,https://*.vercel.app`

Optional:
- `MAIL_HOST`, `MAIL_PORT`, `MAIL_SECURE`, `MAIL_USER`, `MAIL_PASS`, `MAIL_FROM`, `ADMIN_EMAIL`
- `PAYSTACK_SECRET_KEY`, `PAYSTACK_CURRENCY`
- `STRIPE_SECRET_KEY`

## 3) Configure frontend env (Vercel)
- `VITE_API_BASE_URL=https://<your-backend>.onrender.com/api`

## 4) Deploy order
1. Deploy backend on Render.
2. Confirm health: `GET /api/health`
3. Deploy frontend on Vercel.

## 5) Smoke tests
1. Register + login
2. Create event + list public events
3. Vendor service create/update
4. Booking flow
5. Ticket create/purchase/validate
6. Support ticket create/message
7. Admin pending services + payouts

## 6) Data migration (if existing MySQL data must be preserved)
1. Export MySQL tables as CSV.
2. Import to Supabase tables in FK-safe order:
- `users`
- `events`, `services`, `tickets`
- `bookings`, `service_bookings`, `ticket_sales`
- `event_registrations`, `event_attendees`, `messages`, `reviews`
3. Reset identity sequences after import:
```sql
SELECT setval(pg_get_serial_sequence('users', 'id'), COALESCE(MAX(id), 1), true) FROM users;
```
Repeat for all identity tables.

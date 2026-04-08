# Deploy Backend on Render + Supabase Postgres

## 1) Deploy with Blueprint (recommended)
1. Push this repo to GitHub.
2. In Render: `New` -> `Blueprint`.
3. Select your repo and confirm `render.yaml`.
4. Render will create:
- `huzz-backend` web service (root: `server`)

## 2) Prepare Supabase database schema
1. Open Supabase SQL Editor.
2. Run:
- `server/sql/supabase_schema.sql`

## 3) Set required backend env vars (Render service -> Environment)
Set these after first deploy:
- `SUPABASE_DB_URL=postgresql://postgres:<password>@<host>:5432/postgres`
- `PUBLIC_BASE_URL=https://<your-backend-name>.onrender.com`
- `CORS_ORIGIN=https://<your-vercel-app>.vercel.app,https://*.vercel.app`

Set these if you use the features:
- `MAIL_HOST`
- `MAIL_PORT`
- `MAIL_SECURE`
- `MAIL_USER`
- `MAIL_PASS`
- `MAIL_FROM`
- `ADMIN_EMAIL`
- `PAYSTACK_SECRET_KEY`
- `PAYSTACK_CURRENCY`
- `STRIPE_SECRET_KEY`

`JWT_SECRET` is provisioned by the blueprint.

## 4) Verify backend
Check:
- `GET https://<your-backend-name>.onrender.com/api/health`

If healthy, backend is ready.

## 5) Connect frontend (Vercel)
In Vercel project environment variables, set:
- `VITE_API_BASE_URL=https://<your-backend-name>.onrender.com/api`

Redeploy Vercel.

## 6) Post-deploy checks
1. Sign in/up
2. Vendor browse/listing
3. Image upload
4. Ticket purchase/registration
5. Admin/service approval flows

## Notes
- Render free/starter instances may cold-start after idle time.
- Current uploads are local filesystem-backed (`public/uploads`). For durable production storage, move to S3/Cloudinary/Supabase Storage.

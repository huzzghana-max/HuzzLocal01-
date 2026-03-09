# Deploy Backend + Database on Render

## 1) Deploy with Blueprint (recommended)
1. Push this repo to GitHub.
2. In Render: `New` -> `Blueprint`.
3. Select your repo and confirm `render.yaml`.
4. Render will create:
- `huzz-backend` web service (root: `server`)
- `huzz-mysql` MySQL database

## 2) Set required backend env vars (Render service -> Environment)
Set these after first deploy:
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

`JWT_SECRET` and `MYSQL_*` are provisioned by the blueprint.

## 3) Verify backend
Check:
- `GET https://<your-backend-name>.onrender.com/api/health`

If healthy, backend is ready.

## 4) Connect frontend (Vercel)
In Vercel project environment variables, set:
- `VITE_API_BASE_URL=https://<your-backend-name>.onrender.com/api`

Redeploy Vercel.

## 5) Post-deploy checks
1. Sign in/up
2. Vendor browse/listing
3. Image upload
4. Ticket purchase/registration
5. Admin/service approval flows

## Notes
- Render free/starter instances may cold-start after idle time.
- Current uploads are local filesystem-backed (`public/uploads`). For durable production storage, move to S3/Cloudinary/Supabase Storage.

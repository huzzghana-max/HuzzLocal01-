# Environment Variables Setup Guide

This guide helps you securely manage environment variables for Huzz deployment across different platforms.

## Table of Contents
- [Local Development](#local-development)
- [Render (Backend + Database)](#render)
- [Vercel (Frontend)](#vercel)
- [GitHub Actions (CI/CD)](#github-actions)
- [Secret Rotation](#secret-rotation)

---

## Local Development

1. **Create `.env` from the template:**
   ```bash
   cp .env.example .env
   ```

2. **Fill in your local values:**
   - `VITE_API_BASE_URL=http://localhost:5000/api`
   - `MYSQL_PASSWORD=your_local_mysql_password`
   - Other test API keys

3. **Never commit `.env`** — it's in `.gitignore`

---

## Render

Render hosts your backend API and database. Set environment variables in the Render dashboard.

### Steps:

1. **Go to your Render service** (Web Service)
2. **Settings → Environment**
3. **Add the following variables:**

#### Frontend-facing (if serving frontend from backend):
```
VITE_API_BASE_URL=https://your-app.onrender.com/api
VITE_PAYSTACK_PUBLIC_KEY=pk_live_xxxxx  (production key)
```

#### Backend Configuration:
```
NODE_ENV=production
JWT_SECRET=generate-a-long-random-string-here
PAYSTACK_SECRET_KEY=sk_live_xxxxx
RESEND_API_KEY=re_xxxxx
MAIL_HOST=sandbox.smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USER=xxxxx
MAIL_PASS=xxxxx
SUPABASE_DB_URL=postgresql://user:pass@host:port/db
```

**To generate a strong JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Database Variables:
If using Supabase Postgres on Render:
```
DATABASE_URL=postgresql://username:password@host:port/database
SUPABASE_DB_URL=postgresql://username:password@host:port/database
```

---

## Vercel

Vercel hosts your React frontend (if deployed separately).

### Steps:

1. **Go to your Vercel project dashboard**
2. **Settings → Environment Variables**
3. **Add the following:**

```
VITE_API_BASE_URL=https://your-api.onrender.com/api
VITE_PAYSTACK_PUBLIC_KEY=pk_live_xxxxx  (production key)
VITE_PAYSTACK_CURRENCY=GHS
VITE_APP_NAME=Huzz
VITE_APP_VERSION=1.0.0
```

### Configure for each environment:

- **Preview** (PR deployments): Use test keys
- **Production**: Use live/production keys
- **Development**: Use development keys

Example:
```
VITE_PAYSTACK_PUBLIC_KEY=pk_test_xxxxx  (Preview & Development)
VITE_PAYSTACK_PUBLIC_KEY=pk_live_xxxxx  (Production only)
```

---

## GitHub Actions (CI/CD)

Store secrets for automated deployments in GitHub.

### Steps:

1. **Go to GitHub repo → Settings → Secrets and variables → Actions**
2. **Click "New repository secret"**
3. **Add production secrets:**

| Secret Name | Value | Used By |
|---|---|---|
| `RENDER_DEPLOY_HOOK` | Your Render deploy webhook | Backend CI |
| `VERCEL_TOKEN` | Vercel API token | Frontend CI |
| `SUPABASE_DB_URL` | PostgreSQL connection string | Migrations |
| `PAYSTACK_SECRET_KEY` | Paystack live key | Backend tests |

### In your CI workflow (e.g., `.github/workflows/deploy.yml`):

```yaml
- name: Deploy to Render
  run: curl -X POST ${{ secrets.RENDER_DEPLOY_HOOK }}
  
- name: Deploy to Vercel
  run: vercel deploy --prod --token=${{ secrets.VERCEL_TOKEN }}
```

---

## Secret Rotation

### When to rotate secrets:
- Compromised keys (push to GitHub, exposed in logs)
- Team member departure
- Regular security audits (quarterly)
- After accidental commit to history

### How to rotate:

1. **Generate new secret:**
   ```bash
   # For JWT_SECRET
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. **Update in platform (Render/Vercel/GitHub)**

3. **Verify application works** with new secret

4. **Document rotation date** in your team wiki

5. **If accidentally committed:**
   ```bash
   # Revoke old credentials immediately in your service provider
   # Then regenerate new ones
   # Your repo is already cleaned (.gitignore prevents future commits)
   ```

---

## Environment Variables by Service

### Paystack (Payment Processing)
- **Test keys**: `pk_test_*` and `sk_test_*` (frontend & backend)
- **Live keys**: `pk_live_*` and `sk_live_*` (production only)
- **Where**: Frontend uses public key, backend uses secret key

### Supabase (Database)
- **Connection string**: `SUPABASE_DB_URL` (backend only)
- **Public key**: `SUPABASE_PUBLISHABLE_KEY` (frontend, optional)
- **Secret key**: NOT needed (was removed, see notes in codebase)
- **JWKS URL**: For auth validation (if using Supabase Auth in future)

### Email Services
- **Resend**: API key for transactional emails
- **Mailtrap**: SMTP credentials for development/testing
- Use **Resend for production**, Mailtrap for development

### JWT Secret
- Used for signing authentication tokens
- Keep confidential
- Rotate on suspected compromise
- Generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

---

## Checklist for Production Deployment

- [ ] All environment variables set in Render/Vercel dashboard
- [ ] Production API keys (not test keys) configured
- [ ] `.env` file is in `.gitignore` and not tracked
- [ ] Database URL is correct and database is initialized
- [ ] Email service is configured and tested
- [ ] JWT_SECRET is strong and unique
- [ ] API_BASE_URL points to production backend
- [ ] CORS settings allow frontend domain
- [ ] No secrets in logs (check deployment logs)
- [ ] Health check endpoint responds: `GET /api/health`
- [ ] Database migrations have run successfully

---

## Troubleshooting

### "Cannot connect to database"
- Check `SUPABASE_DB_URL` format
- Verify database is running and accessible
- Check firewall/network policies

### "Payment requests failing"
- Verify `PAYSTACK_SECRET_KEY` is correct
- Check if using test vs live keys
- Ensure correct currency (`VITE_PAYSTACK_CURRENCY`)

### "Emails not sending"
- Check `MAIL_HOST`, `MAIL_USER`, `MAIL_PASS` are correct
- Verify SMTP credentials in Mailtrap/Resend dashboard
- Test with `npm run test:email`

### "Login not working"
- Check `JWT_SECRET` is set (and consistent across deploys)
- Verify `VITE_API_BASE_URL` is correct
- Check backend logs for auth errors

---

## Quick Reference

### Local Dev Start:
```bash
# Terminal 1: Frontend
npm run dev

# Terminal 2: Backend
cd server && node server.js
```

### Build for Production:
```bash
npm run build  # Frontend
# Backend auto-deploys via Render webhook
```

### Check Environment:
```bash
# View only non-secret env vars
env | grep VITE_
```

# GitHub Secrets Setup Guide

GitHub Secrets securely store sensitive variables for CI/CD pipelines and GitHub Actions workflows.

## Quick Setup

### 1. Navigate to Repository Settings

Go to your repository on GitHub:
```
https://github.com/huzzghana-max/HuzzLocal01-/settings/secrets/actions
```

Or: **Repository → Settings → Secrets and variables → Actions**

### 2. Add Secrets

Click **"New repository secret"** and add each secret below:

---

## Required Secrets for Huzz

### Deployment Webhooks

| Secret | Value | Where to Get |
|--------|-------|------|
| `RENDER_DEPLOY_HOOK` | Your Render webhook URL | Render dashboard > Auto-deploy > Hook URL |
| `VERCEL_TOKEN` | Vercel API token | Vercel dashboard > Settings > Tokens |

**Steps to get Render hook:**
1. Go to Render dashboard > Your web service
2. Settings > Deploy hook
3. Copy the full URL
4. Add as secret `RENDER_DEPLOY_HOOK`

**Steps to get Vercel token:**
1. Go to Vercel dashboard > Settings > Tokens
2. Create new token (scope: full access)
3. Copy token
4. Add as secret `VERCEL_TOKEN`

---

### Production API Keys

These should be **live/production keys** (not test keys):

| Secret | Value | Where to Get |
|--------|-------|------|
| `PAYSTACK_SECRET_KEY` | Live Paystack secret key | Paystack > Settings > API Keys |
| `PAYSTACK_PUBLIC_KEY` | Live Paystack public key | Paystack > Settings > API Keys |
| `RESEND_API_KEY` | Resend API key | Resend dashboard > API Keys |
| `SUPABASE_DB_URL` | Production database URL | Supabase > Project > Database > Connection string |

---

### Email Configuration (Optional)

For automated email testing in CI:

| Secret | Value |
|--------|-------|
| `MAIL_HOST` | Your SMTP host |
| `MAIL_USER` | SMTP username |
| `MAIL_PASS` | SMTP password |
| `MAIL_FROM` | From email address |

---

## Using Secrets in GitHub Actions

### Example: Render Deployment Workflow

Create `.github/workflows/deploy-render.yml`:

```yaml
name: Deploy to Render

on:
  push:
    branches: [deploy_live]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Render deployment
        run: |
          curl -X POST ${{ secrets.RENDER_DEPLOY_HOOK }}
```

### Example: Backend Deployment with Environment Variables

```yaml
name: Backend Tests & Deploy

on:
  push:
    branches: [deploy_live]
    paths:
      - 'server/**'
      - '.github/workflows/backend.yml'

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          npm install
          cd server && npm install
      
      - name: Run tests
        env:
          SUPABASE_DB_URL: ${{ secrets.SUPABASE_DB_URL }}
          PAYSTACK_SECRET_KEY: ${{ secrets.PAYSTACK_SECRET_KEY }}
          JWT_SECRET: test-key-for-ci
          NODE_ENV: test
        run: |
          cd server && npm test
      
      - name: Trigger Render deploy
        if: success()
        run: |
          curl -X POST ${{ secrets.RENDER_DEPLOY_HOOK }}
```

### Example: Frontend Deployment to Vercel

```yaml
name: Deploy Frontend to Vercel

on:
  push:
    branches: [deploy_live]
    paths:
      - 'src/**'
      - '.github/workflows/frontend.yml'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Vercel
        uses: vercel/actions/build-and-deploy@v2
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          production: true
        env:
          VITE_PAYSTACK_PUBLIC_KEY: pk_live_xxxxx
```

---

## Security Best Practices

### ✅ DO:
- Rotate secrets **quarterly**
- Use **different secrets** for test vs production
- **Limit scope** of service accounts/tokens
- **Audit access** regularly
- **Revoke immediately** if compromised
- Use secrets **only in CI/CD** workflows, not in `.env`

### ❌ DON'T:
- Commit secrets to git (`.env` is in `.gitignore`)
- Share secrets in Slack/email
- Use generic names like `PASSWORD` (use `PAYSTACK_SECRET_KEY`)
- Store secrets for local dev (use `.env` file locally)
- Log secrets in workflow output (GitHub masks them, but verify)

---

## Masking Secrets in Logs

GitHub automatically masks secrets in workflow output, but verify with:

```yaml
- name: Verify secret is masked
  run: |
    echo "Paystack key: ${{ secrets.PAYSTACK_SECRET_KEY }}"
    # Output should show: Paystack key: ***
```

---

## Rotating Secrets

If a secret is compromised:

1. **Revoke immediately** in the source (Paystack, Resend, etc.)
2. **Generate new secret** in the source
3. **Update GitHub secret:**
   - Go to Settings > Secrets
   - Click the secret
   - Click "Update"
   - Paste new value
4. **Test deployment** with new secret
5. **Document the rotation** (date, reason, who)

---

## Troubleshooting

### Secret not available in workflow
**Problem:** `${{ secrets.PAYSTACK_SECRET_KEY }}` shows as empty

**Solutions:**
- Verify secret name is **exactly correct** (case-sensitive)
- Verify workflow is on the **correct branch** (can't use personal fork secrets)
- Check secret scope: **Repository** (not organization/environment-only)

### Workflow failing with "unauthorized"
**Problem:** API requests fail with 401/403

**Solutions:**
- Verify secret value is **correct** (copy-paste from source)
- Check secret hasn't **expired** or been revoked
- Verify **token has required scopes** (especially Vercel/Render tokens)

### Can't see secrets in settings
**Problem:** Secrets page is empty or shows no option to add

**Solutions:**
- Verify you have **admin access** to repository
- Check you're in **Repository** secrets (not Organization)
- Try incognito mode to clear cache

---

## Next Steps

1. **Add all secrets** to GitHub per the table above
2. **Create CI/CD workflows** (examples above)
3. **Test deployment** with one workflow
4. **Document your secrets** in team wiki (without values!)
5. **Set secret expiration** reminder (quarterly rotation)

---

## Environment Variable Reference

### What goes where:

| Variable | GitHub Secret | Render Env | Vercel Env | `.env` (Dev) |
|----------|---------------|-----------|-----------|------------|
| `PAYSTACK_SECRET_KEY` | ✅ (live) | ✅ (live) | ❌ | ✅ (test) |
| `VITE_PAYSTACK_PUBLIC_KEY` | ❌ | ✅ (live) | ✅ (live) | ✅ (test) |
| `SUPABASE_DB_URL` | ✅ | ✅ | ❌ | ✅ (local) |
| `JWT_SECRET` | ✅ | ✅ | ❌ | ✅ (dev) |
| `RESEND_API_KEY` | ✅ | ✅ | ❌ | ✅ (dev) |
| `VITE_API_BASE_URL` | ❌ | ❌ | ✅ | ✅ |

**Legend:**
- ✅ Should be stored here
- ❌ Not needed here
- (live) = production keys
- (test) = test/sandbox keys
- (local) = local development value

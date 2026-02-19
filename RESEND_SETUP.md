# Resend Email Setup for Contact Form

The contact form now uses **Resend** for reliable email delivery. Resend is a modern email service designed for transactional emails.

## Quick Start

### 1. Sign Up for Resend
Visit https://resend.com and create a free account. You get:
- 100 emails per day (free tier)
- Full production-ready email service
- Easy integration
- Delivery tracking and analytics

### 2. Get Your API Key
1. Log in to https://resend.com/dashboard
2. Go to **API Keys** section
3. Copy your API key (starts with `re_`)

### 3. Configure Environment Variables
Add your API key to `server/.env`:

```bash
RESEND_API_KEY=re_your_actual_api_key_here
RESEND_FROM_EMAIL=noreply@huzz.com
ADMIN_EMAIL=jonathandraft02@gmail.com
```

**Important:** Get your actual API key from Resend dashboard!

### 4. Restart the Server
```bash
# Kill the current server (if running)
taskkill /PID [processid] /F

# Restart
cd server
node server.js
```

## Testing the Setup

### Using the Contact Form (Frontend)
1. Open http://localhost:5174/contact
2. Fill in the form:
   - Name: Your Name
   - Email: your-email@example.com
   - Message: Test message
3. Click "Send Message"
4. Check your email for confirmation

### Using cURL (Command Line)
```bash
curl -X POST http://localhost:5000/api/contact \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "message": "This is a test message"
  }'
```

Expected successful response:
```json
{
  "message": "Thank you! Your message has been received. We will get back to you soon.",
  "emailSent": true,
  "timestamp": "2026-02-18T12:34:56.789Z"
}
```

## Email Sending Flow

When someone submits the contact form:

1. **Validation** - Checks name, email format, and message
2. **Admin Email** - Sends notification to admin with:
   - Sender's name and email
   - Full message content
   - Submission timestamp
3. **Confirmation Email** - Sends to user confirming:
   - Message was received
   - Their message content
   - Expectation of follow-up
4. **Response** - Frontend shows success message

## Troubleshooting

### ❌ "Email service is not configured"
**Problem:** `RESEND_API_KEY` not set in `.env`
**Solution:** 
1. Add your API key to `server/.env`:
   ```
   RESEND_API_KEY=re_your_key_here
   ```
2. Restart the server

### ❌ "Invalid API key"
**Problem:** API key is wrong or malformed
**Solution:**
1. Go to https://resend.com/dashboard
2. Copy the API key again (starts with `re_`)
3. Make sure there are no extra spaces
4. Update `.env` and restart server

### ❌ Emails not reaching inbox
**Problem:** Emails going to spam
**Solution:**
1. Check spam/junk folder
2. For production, use a real domain for `RESEND_FROM_EMAIL`
3. Contact Resend support if on free tier with delivery issues

### ❌ "Failed to send message"
**Problem:** General error
**Solution:**
1. Check server logs for detailed error message
2. Verify internet connection
3. Ensure `ADMIN_EMAIL` is valid
4. Try restarting the server

## Production Considerations

### Using a Custom Domain
1. In Resend dashboard, add your custom domain
2. Follow DNS verification steps
3. Update `.env`:
   ```
   RESEND_FROM_EMAIL=noreply@yourdomain.com
   ```

### Email Templates
The current implementation sends formatted HTML emails with:
- Forest Green branding (#0E3B26)
- Professional styling
- Clear call-to-action
- Mobile-responsive design

### Rate Limiting
- Free tier: 100 emails/day
- Pro tier: Unlimited emails
- Upgradable through Resend dashboard

## API Reference

**Endpoint:** `POST /api/contact`

**Request Body:**
```json
{
  "name": "string (required)",
  "email": "string (required, valid email)",
  "message": "string (required)"
}
```

**Success Response (201):**
```json
{
  "message": "Thank you! Your message has been received. We will get back to you soon.",
  "emailSent": true,
  "timestamp": "2026-02-18T12:34:56.789Z"
}
```

**Error Response (400/500):**
```json
{
  "message": "Error description"
}
```

## Next Steps

- ✅ Contact form fully functional with Resend
- 🔜 Add contact submission database logging
- 🔜 Implement admin dashboard for contact submissions
- 🔜 Add rich HTML email templates with custom branding


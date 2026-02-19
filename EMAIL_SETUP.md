# Contact Form Email Setup

The contact form on the Contact Us page now sends emails via the `/api/contact` endpoint. The system supports two email service providers with automatic fallback.

## Current Status

✅ **Backend Endpoint**: Fully implemented at `POST /api/contact`
✅ **Frontend Form**: Connected to backend with real API calls
✅ **Form Processing**: Working (messages are received)
⚠️ **Email Sending**: Currently unavailable (development mode)

## Email Service Configuration

### Option 1: Resend (Recommended for Production)

Resend is a modern email service perfect for transactional emails.

1. **Sign up at**: https://resend.com
2. **Get your API key**: Copy your API key from the dashboard
3. **Add to `.env` file** (create if doesn't exist in `server/` directory):
```bash
RESEND_API_KEY=re_your_api_key_here_from_resend
RESEND_FROM_EMAIL=noreply@yourdomain.com
ADMIN_EMAIL=admin@yourdomain.com
```

### Option 2: Gmail/SMTP

For testing with your personal Gmail account:

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password**:
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and "Windows Computer"
   - Copy the generated 16-character password

3. **Add to `.env` file** in `server/` directory:
```bash
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-character-app-password
ADMIN_EMAIL=your-email@gmail.com
```

### Option 3: Custom SMTP Server

For corporate or third-party email services:

```bash
SMTP_HOST=smtp.yourmailserver.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-username
SMTP_PASS=your-password
ADMIN_EMAIL=admin@yourdomain.com
```

## Testing the Setup

### Via cURL
```bash
curl -X POST http://localhost:5000/api/contact \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "message": "Test message"
  }'
```

### Via Frontend
1. Navigate to `/contact`
2. Fill in the form: Name, Email, Message
3. Click "Send Message"
4. Should see success confirmation
5. Check configured email account for confirmation emails

## What Happens When Form is Submitted

1. **User fills form** on Contact Us page
2. **Frontend sends POST** to `/api/contact` with form data
3. **Backend validates** email format and required fields
4. **Backend sends two emails**:
   - Email to **Admin**: Shows user message with contact info
   - Email to **User**: Confirms message was received
5. **Response sent** to frontend with success/error message
6. **User sees** success alert and form cleared

## Environment Variables Reference

| Variable | Purpose | Example |
|----------|---------|---------|
| `RESEND_API_KEY` | Resend service API key | `re_xxxxxxxxxxxx` |
| `RESEND_FROM_EMAIL` | Sender email address | `noreply@huzz.com` |
| `EMAIL_USER` | Gmail/SMTP username | `admin@gmail.com` |
| `EMAIL_PASSWORD` | Gmail app password or SMTP password | `xxxx xxxx xxxx xxxx` |
| `SMTP_HOST` | Custom SMTP server hostname | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP server port | `587` or `465` |
| `SMTP_SECURE` | Use TLS (false for 587, true for 465) | `false` |
| `SMTP_USER` | SMTP account username | `user@domain.com` |
| `SMTP_PASS` | SMTP account password | `password123` |
| `ADMIN_EMAIL` | Email to receive contact submissions | `admin@yourdomain.com` |

## Restart Server After Changes

After updating `.env` file, restart the Node.js server:

```bash
cd server
node server.js
```

## Troubleshooting

**Issue**: "Email service unavailable"
- **Solution**: Check if `.env` file has correct environment variables
- Make sure you restart the server after adding variables

**Issue**: "Missing API key"
- **Solution**: Add `RESEND_API_KEY` to `.env` or remove to use Nodemailer fallback

**Issue**: "Missing credentials for PLAIN"
- **Solution**: Configure either Resend API key OR Gmail/SMTP credentials in `.env`

**Issue**: Emails not delivering
- **Solution**: 
  - Check spam/junk folder
  - Verify recipient email is correct
  - For Gmail: ensure "Less secure app access" is enabled if not using app password
  - For custom SMTP: test credentials on mail server provider's website

## Frontend Behavior

The Contact Us page now includes:

✅ **Real-time validation** - Shows errors for invalid emails
✅ **Loading state** - Button shows spinner while sending
✅ **Error handling** - Displays server error messages to user
✅ **Success feedback** - Green alert confirms message sent
✅ **Auto-clear** - Form fields clear after successful submission
✅ **Disabled inputs** - Form fields disabled while sending

## Production Deployment

For production:

1. Use **Resend** (recommended) - Includes analytics and reliability
2. Set `ADMIN_EMAIL` to official contact email
3. Use professional domain for `RESEND_FROM_EMAIL`
4. Store `.env` in secure location (not in git)
5. Use environment secrets in deployment platform (Vercel, AWS, Heroku, etc.)


# Email Configuration Guide

The order management system can send confirmation emails to customers with thank-you messages and estimated delivery dates. Follow this guide to set up email functionality.

## Environment Variables

Create a `.env` file in the project root or set these environment variables:

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_SECURE=false
```

## Setup Instructions by Email Provider

### Option 1: Gmail (Recommended for Testing)

1. Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
2. You may need to enable 2-Factor Authentication first
3. Select "App passwords" → Choose "Mail" and "Windows Computer"
4. Google will generate a 16-character password
5. Copy this password and use it as `EMAIL_PASS`
6. In your `.env` file:
   ```env
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-gmail@gmail.com
   EMAIL_PASS=xxxx xxxx xxxx xxxx (the 16-char password)
   EMAIL_SECURE=false
   ```

### Option 2: Outlook/Hotmail

```env
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_USER=your-email@outlook.com
EMAIL_PASS=your-password
EMAIL_SECURE=false
```

### Option 3: Yahoo Mail

```env
EMAIL_HOST=smtp.mail.yahoo.com
EMAIL_PORT=587
EMAIL_USER=your-email@yahoo.com
EMAIL_PASS=your-app-password
EMAIL_SECURE=false
```

### Option 4: Custom SMTP Server

If you have your own SMTP server (from your hosting provider):

```env
EMAIL_HOST=mail.yourserver.com
EMAIL_PORT=587 (or 465 for secure)
EMAIL_USER=your-email@yourdomain.com
EMAIL_PASS=your-password
EMAIL_SECURE=true (if using port 465)
```

## Testing Without Full Email Setup

For testing purposes without configuring real email credentials, you can:

1. Use a temporary test email account
2. Set the EMAIL_USER and EMAIL_PASS to placeholder values
3. The server will attempt to send but will log errors gracefully

Emails will fail gracefully and show error messages in the admin panel, allowing you to test the order management UI.

## How It Works

When an admin:
1. Opens an order in the "Manage Orders" section
2. Clicks "Send Confirmation Email"
3. The system:
   - Calculates estimated delivery date (4 days from order date)
   - Composes a thank-you email with order details and delivery estimate
   - Sends via the configured email service
   - Records that the email was sent

## Troubleshooting

**Error: "Authentication failed"**
- Double-check EMAIL_USER and EMAIL_PASS
- For Gmail, ensure you're using an App Password, not your regular password
- Verify 2FA is enabled on Gmail

**Error: "SMTP connection failed"**
- Check that EMAIL_HOST and EMAIL_PORT are correct
- Verify your firewall/network allows SMTP connections
- Try disabling VPN if connected to one

**Emails not sending in production**
- If hosting on Render.com or similar, set environment variables in the platform's settings UI
- Do NOT commit `.env` to GitHub - it contains sensitive credentials

## Production Deployment

When deploying to Render.com or similar platforms:

1. **Do NOT** include `.env` in your git repository
2. Set environment variables in your platform's dashboard:
   - Go to your service settings
   - Add Environment Variables
   - Set EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS, EMAIL_SECURE
3. The app will automatically use these variables

## Security Notes

- Never commit your `.env` file or password to version control
- Use App Passwords instead of real passwords when possible
- Consider using a dedicated email service account for transactional emails
- For high-volume, consider using SendGrid, Mailgun, or Amazon SES APIs instead

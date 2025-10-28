# Email Notification Setup Guide

## Overview
FixFirst SEO includes a comprehensive email notification system that sends beautiful HTML emails to users when audits complete or fail, and welcomes new users.

---

## 🎨 Email Templates

### 1. **Audit Complete Email** ✅
Sent when an SEO audit finishes successfully.

**Includes:**
- Final score with color-coded badge (red/yellow/green)
- Grade (A-F)
- Website URL
- Completion timestamp
- Direct link to view full report

**Triggered when:**
- Audit status changes to `COMPLETED`
- User has `auditComplete` notifications enabled

---

### 2. **Audit Failed Email** ❌
Sent when an audit encounters an error.

**Includes:**
- Website URL
- Error message details
- "Try Again" button to dashboard
- Support contact information

**Triggered when:**
- Audit status changes to `FAILED`
- User has `auditFailed` notifications enabled

---

### 3. **Welcome Email** 🎉
Sent to new users upon registration.

**Includes:**
- Personal greeting
- Feature overview (Technical SEO, On-Page, Performance, etc.)
- "Go to Dashboard" CTA
- Support information

**Triggered when:**
- New user successfully registers

---

## 🔧 SMTP Configuration

### Required Environment Variables

Add these to your `.env` file in `apps/api/`:

```bash
# Email Configuration
SMTP_HOST=smtp.gmail.com          # Your SMTP server
SMTP_PORT=587                     # Port (587 for TLS, 465 for SSL)
SMTP_SECURE=false                 # true for port 465, false for other ports
SMTP_USER=your-email@gmail.com    # Your email address
SMTP_PASS=your-app-password       # Your email password or app password

# Frontend URL (for email links)
FRONTEND_URL=http://localhost:3005
```

---

## 📧 Supported Email Providers

### 1. **Gmail** (Recommended for Testing)

#### Setup Steps:
1. Go to https://myaccount.google.com/apppasswords
2. Generate an "App Password" for "Mail"
3. Use that password in `SMTP_PASS`

**Configuration:**
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=yourname@gmail.com
SMTP_PASS=your-app-password      # 16-character app password
```

---

### 2. **SendGrid** (Recommended for Production)

**Configuration:**
```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

---

### 3. **Mailgun**

**Configuration:**
```bash
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=postmaster@your-domain.mailgun.org
SMTP_PASS=your-mailgun-smtp-password
```

---

### 4. **AWS SES**

**Configuration:**
```bash
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-aws-access-key-id
SMTP_PASS=your-aws-secret-access-key
```

---

### 5. **Outlook/Office365**

**Configuration:**
```bash
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
```

---

## 🧪 Testing Email Configuration

### 1. **Check Service Status**

When you start the API server, you should see:
```
✅ Email service initialized
```

If not configured:
```
⚠️  Email service not configured. Emails will not be sent.
```

### 2. **Test Welcome Email**

Register a new user and check the email inbox:

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### 3. **Test Audit Notification**

1. Run an audit
2. Wait for completion
3. Check email for audit complete notification

### 4. **Check Logs**

Watch for these logs in the worker console:
```
✅ Email sent to user@example.com: <message-id>
❌ Failed to send email: <error>
📧 [MOCK] Email would be sent to... (if not configured)
```

---

## 🎛️ User Notification Preferences

Users can control their email preferences in **Settings > Notifications**:

```typescript
{
  "auditComplete": true,    // ✅ Enabled by default
  "auditFailed": true,      // ✅ Enabled by default
  "weeklyReport": false,    // ❌ Disabled (future feature)
  "marketing": false        // ❌ Disabled (future feature)
}
```

### How It Works:
1. User updates preferences in Settings page
2. Stored in `User.notificationPreferences` (JSON field)
3. Worker checks preferences before sending emails
4. Emails are only sent if preference is `true` (or not set, defaults to `true`)

---

## 🎨 Email Design

### Visual Features:
- 🌈 **Dark theme** matching the app UI
- 📱 **Responsive design** for mobile/desktop
- 🎨 **Gradient headers** with brand colors
- 🏷️ **Score badges** with semantic colors
- 🔗 **Clear CTAs** for user actions
- 📊 **Structured layout** for easy reading

### Technical Details:
- **HTML tables** for maximum email client compatibility
- **Inline CSS** (no external stylesheets)
- **Plain text fallback** auto-generated
- **600px width** for optimal rendering
- **Dark background** (#0a0e1a) with light text (#e2e8f0)

---

## 🔮 Future Enhancements

### Planned Email Types:
1. **Weekly Summary Report** 📊
   - Overview of all audits this week
   - Trend comparisons
   - Top issues found

2. **Critical Issue Alert** 🚨
   - Immediate notification for critical SEO issues
   - Recommended actions

3. **Monthly Report** 📈
   - Monthly performance overview
   - Improvement suggestions
   - Competitive analysis

4. **Account Activity** 🔐
   - Login from new device
   - Password changed
   - Plan upgraded/downgraded

5. **Marketing Emails** 📣
   - Feature announcements
   - Tips & tricks
   - Case studies

---

## 🐛 Troubleshooting

### Issue: Emails not sending
**Check:**
1. SMTP credentials are correct
2. "Less secure app access" enabled (Gmail)
3. App password used (not regular password)
4. Firewall not blocking port 587
5. API server logs for error messages

**Fix:**
- Test with a simple tool like `nodemailer` in Node REPL
- Check SMTP provider's documentation
- Verify email account is active

---

### Issue: Emails going to spam
**Fix:**
1. **Add SPF record** to your domain DNS
2. **Add DKIM signature** (provided by email service)
3. **Set up DMARC** policy
4. Use a **custom domain** instead of gmail.com
5. **Warm up** your sending domain gradually

---

### Issue: Gmail "Less secure apps" error
**Fix:**
- Use **App Passwords** instead:
  1. Enable 2FA on your Google account
  2. Go to https://myaccount.google.com/apppasswords
  3. Generate password for "Mail"
  4. Use this 16-character password in `SMTP_PASS`

---

### Issue: Email formatting broken
**Check:**
- Email client (some clients like Outlook have issues)
- HTML is properly escaped
- Tables are properly closed
- Inline styles used (no external CSS)

---

## 📊 Monitoring & Analytics (Future)

### Metrics to Track:
- **Delivery rate**: % of emails successfully delivered
- **Open rate**: % of emails opened by users
- **Click rate**: % of users clicking CTA buttons
- **Bounce rate**: % of emails that bounced
- **Unsubscribe rate**: % of users unsubscribing

### Tools:
- SendGrid Analytics
- Mailgun Statistics
- Custom event tracking with webhooks

---

## 🔐 Security Best Practices

1. **Never commit** SMTP credentials to Git
2. Use **environment variables** for all secrets
3. Use **app passwords** instead of main password
4. **Rotate passwords** regularly
5. **Monitor** for suspicious activity
6. Use **rate limiting** to prevent abuse
7. **Validate** email addresses before sending

---

## 💻 Code Implementation

### Email Service Location:
```
apps/api/src/services/email-service.ts
```

### Integration Points:
1. **Worker** (`apps/api/src/worker.ts`):
   - Sends audit complete/failed emails
   
2. **Auth Routes** (`apps/api/src/routes/auth.ts`):
   - Sends welcome email on registration

### Key Functions:
```typescript
emailService.sendAuditCompleteEmail(to, audit)
emailService.sendAuditFailedEmail(to, audit)
emailService.sendWelcomeEmail(to, name)
```

---

## 🎉 Quick Start

### 1. Configure Gmail (Testing)
```bash
cd apps/api
echo "SMTP_HOST=smtp.gmail.com" >> .env
echo "SMTP_PORT=587" >> .env
echo "SMTP_SECURE=false" >> .env
echo "SMTP_USER=your-email@gmail.com" >> .env
echo "SMTP_PASS=your-app-password" >> .env
echo "FRONTEND_URL=http://localhost:3005" >> .env
```

### 2. Restart Services
```powershell
# Restart API
cd apps/api
npm run dev

# Restart Worker
npm run worker
```

### 3. Test
- Register a new account → Check for welcome email
- Run an audit → Check for completion email

---

## 📞 Support

If you have issues with email setup:
1. Check the logs for error messages
2. Review your SMTP provider's documentation
3. Test with a simple nodemailer script
4. Contact your email provider's support

---

**Version**: 1.0.0  
**Last Updated**: October 26, 2025  
**Author**: Brayne Smart Solutions Corp.

---

© 2025 FixFirst SEO. Powered By Brayne Smart Solutions Corp.


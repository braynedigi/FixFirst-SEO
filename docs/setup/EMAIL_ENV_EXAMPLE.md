# Email Configuration Environment Variables

## Required Variables for Email Functionality

Add these to your `.env` file in the `apps/api/` directory:

```bash
# ========================================
# Email Configuration (Optional)
# ========================================
# If not configured, emails will be logged to console only

# Gmail (Recommended for Development/Testing)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-char-app-password

# SendGrid (Recommended for Production)
# SMTP_HOST=smtp.sendgrid.net
# SMTP_PORT=587
# SMTP_SECURE=false
# SMTP_USER=apikey
# SMTP_PASS=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Frontend URL (used in email links)
FRONTEND_URL=http://localhost:3005
```

---

## Quick Setup for Gmail

### Step 1: Enable App Passwords
1. Go to your Google Account: https://myaccount.google.com/
2. Navigate to **Security**
3. Enable **2-Step Verification** (if not already enabled)
4. Go to **App passwords**: https://myaccount.google.com/apppasswords
5. Select **Mail** and your device
6. Copy the 16-character password

### Step 2: Add to .env
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=yourname@gmail.com
SMTP_PASS=abcd efgh ijkl mnop    # Your 16-char app password
FRONTEND_URL=http://localhost:3005
```

### Step 3: Restart API & Worker
```powershell
# In one terminal
cd apps/api
npm run dev

# In another terminal  
cd apps/api
npm run worker
```

---

## Verification

### Check API Startup Logs
You should see:
```
✅ Email service initialized
```

If you see this instead, emails won't send (but won't break the app):
```
⚠️  Email service not configured. Emails will be logged only.
```

### Test Email Sending

#### 1. Register a New User
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```
👉 Check for welcome email

#### 2. Run an Audit
1. Go to http://localhost:3005
2. Login
3. Start a new audit
4. Wait for completion
👉 Check for audit complete email

---

## Email Types Sent

### 1. Welcome Email 🎉
- **Trigger**: New user registration
- **To**: Newly registered user
- **Subject**: "🎉 Welcome to FixFirst SEO!"
- **Contains**: Getting started guide, features overview

### 2. Audit Complete ✅
- **Trigger**: Audit finishes successfully
- **To**: User who started the audit
- **Subject**: "✅ Your SEO Audit is Complete - [URL] (Score: XX)"
- **Contains**: Final score, grade, link to full report
- **Preference**: Can be disabled in Settings > Notifications

### 3. Audit Failed ❌
- **Trigger**: Audit encounters an error
- **To**: User who started the audit
- **Subject**: "❌ SEO Audit Failed - [URL]"
- **Contains**: Error details, "Try Again" button
- **Preference**: Can be disabled in Settings > Notifications

---

## Production Setup (SendGrid)

### Why SendGrid?
- ✅ Free tier: 100 emails/day
- ✅ Better deliverability
- ✅ Analytics dashboard
- ✅ No "sent via gmail.com" footer
- ✅ Dedicated sending IP (paid plans)

### Setup Steps:
1. Sign up at https://sendgrid.com/
2. Create an API key with "Mail Send" permissions
3. Add to .env:
```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=SG.your_api_key_here
FRONTEND_URL=https://your-production-domain.com
```

---

## User Email Preferences

Users can control which emails they receive in **Settings > Notifications**:

```json
{
  "auditComplete": true,    // Receive audit completion emails
  "auditFailed": true,      // Receive audit failure emails
  "weeklyReport": false,    // (Future feature)
  "marketing": false        // (Future feature)
}
```

- **Default**: All notifications enabled
- **Location**: Settings page
- **Storage**: `User.notificationPreferences` (JSON field in database)

---

## Troubleshooting

### "Less secure app access" Error (Gmail)
❌ **Problem**: Gmail blocks login from nodemailer

✅ **Solution**: Use App Passwords (see Step 1 above)

---

### Emails Not Sending
**Check:**
1. ✅ SMTP credentials are correct
2. ✅ Port 587 is not blocked by firewall
3. ✅ Email account is active
4. ✅ API logs for error messages

**Debug:**
```bash
# Check logs in API terminal
# Look for:
✅ Email sent to...
# Or:
❌ Failed to send email...
```

---

### Emails Going to Spam
**Fixes:**
1. Use a custom domain (not gmail.com)
2. Set up SPF, DKIM, DMARC records
3. Use a professional email service (SendGrid, Mailgun)
4. Warm up your sending domain

---

## Testing Without Email Setup

If you don't want to set up emails, the app works perfectly fine!

**What happens:**
- ✅ Audits run normally
- ✅ All features work
- ⚠️ Emails are logged to console instead of being sent

**Console output:**
```
📧 [MOCK] Email would be sent to user@example.com: Subject Here
```

---

## Complete .env Example

```bash
# ========================================
# Core Configuration
# ========================================
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/seo_audit_tool"
REDIS_URL="redis://localhost:6380"
JWT_SECRET="change-this-to-something-secure-in-production"
PORT="3001"

# ========================================
# Google PageSpeed Insights
# ========================================
PSI_API_KEY="your-psi-api-key-here"

# ========================================
# Email Configuration (Optional)
# ========================================
# Gmail Setup (for Development)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="yourname@gmail.com"
SMTP_PASS="your-16-char-app-password"

# Frontend URL (for email links)
FRONTEND_URL="http://localhost:3005"
```

---

## Support

Need help setting up emails?
1. Check the API logs for error messages
2. Review `EMAIL_SETUP.md` for detailed guides
3. Test with Gmail first (easiest)
4. Move to SendGrid for production

---

**Remember**: Email configuration is **optional**. The app works without it!

---

© 2025 FixFirst SEO. Powered By Brayne Smart Solutions Corp.


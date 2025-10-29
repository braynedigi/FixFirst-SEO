# 🔧 Admin Panel API Settings - Complete Guide

## ✨ **Overview**

Manage all third-party API integrations through the admin panel UI - **no more editing code or .env files!**

**Location:** Admin Panel → AI & Integration Settings Tab

---

## 🤖 **OpenAI Integration**

### **Purpose:**
Powers AI-generated SEO recommendations with detailed analysis and solutions.

### **Setup:**
1. Go to Admin Panel → AI & Integration Settings
2. Click "Add API Key" or "Update Key"
3. Paste your OpenAI API key (starts with `sk-`)
4. Click "Test Connection" to verify
5. Click "Save API Key"

### **Get API Key:**
- Visit: https://platform.openai.com/api-keys
- Create new secret key
- Copy and paste into admin panel

### **Cost:**
- ~$0.02-0.05 per audit
- ~$5-15/month for 100 audits
- GPT-4 model for best quality

---

## 🔍 **Google Search Console (GSC)**

### **Purpose:**
Enables keyword tracking and position monitoring integration.

### **Setup:**
1. **Create OAuth Credentials:**
   - Go to Google Cloud Console
   - Navigate to APIs & Services → Credentials
   - Create OAuth 2.0 Client ID (Web application)
   - Add authorized redirect URI: `http://localhost:3001/api/gsc/callback`
   - Copy Client ID and Client Secret

2. **Configure in Admin Panel:**
   - Go to Admin Panel → AI & Integration Settings
   - Scroll to "Google Search Console" section
   - Click "Add Credentials" or "Update Credentials"
   - Paste Client ID
   - Paste Client Secret
   - Verify Redirect URI matches your setup
   - Click "Save Credentials"

3. **Restart API Server:**
   - Settings are loaded on server startup
   - Restart required for changes to take effect

### **Important:**
- For production, update Redirect URI to your domain
- Add test users in OAuth consent screen (testing mode)
- Enable Google Search Console API

**Detailed Guide:** See `docs/GSC_SETUP_GUIDE.md`

---

## 💳 **PayPal Billing Integration**

### **Purpose:**
Enables subscription billing for PRO and ENTERPRISE tiers.

### **Setup:**
1. **Get PayPal Credentials:**
   - Go to PayPal Developer Dashboard
   - Create new app or use existing
   - Copy Client ID and Client Secret
   - Note: Use Sandbox credentials for testing

2. **Create Subscription Plans:**
   - In PayPal Dashboard, create subscription plans
   - PRO Plan: $29/month
   - ENTERPRISE Plan: $99/month
   - Copy Plan IDs (format: `P-XXXXXXXXXXXX`)

3. **Configure in Admin Panel:**
   - Go to Admin Panel → AI & Integration Settings
   - Scroll to "PayPal Integration" section
   - Select Mode (Sandbox or Live)
   - Paste Client ID
   - Paste Client Secret
   - Paste PRO Plan ID (optional)
   - Paste ENTERPRISE Plan ID (optional)
   - Click "Save Credentials"

4. **Restart API Server:**
   - Settings are loaded on server startup
   - Restart required for changes to take effect

### **Modes:**
- **Sandbox:** For testing (use sandbox credentials)
- **Live:** For production (use live credentials)

### **Important:**
- Always test in Sandbox mode first
- Switch to Live mode only when ready for production
- Plan IDs are optional (can add later)

**Detailed Guide:** See `docs/PAYPAL_BILLING_SETUP.md`

---

## 🔐 **Security Features**

### **Secret Masking:**
- Sensitive values are masked in the UI (shown as `••••••••`)
- Only stored in encrypted database
- Never exposed in API responses

### **Access Control:**
- Only ADMIN role can access settings
- JWT authentication required
- All changes are logged

### **Database Storage:**
- Credentials stored in `SystemSettings` table
- `isSecret` flag for sensitive values
- `updatedBy` tracks who made changes
- `updatedAt` tracks when changed

---

## 📝 **How It Works**

### **Backend Flow:**
1. Settings are stored in database via `/api/settings` endpoints
2. Services read from database on startup
3. Environment variables act as fallback
4. Database values take priority

### **Priority Order:**
```
Database Settings > Environment Variables > Default Values
```

### **Updating Settings:**
1. User updates via admin panel
2. Saved to `SystemSettings` table in database
3. API server needs restart to load new values
4. Services reinitialize with new credentials

---

## 🔄 **Applying Changes**

### **Why Restart is Needed:**
- Most services initialize API clients on startup
- Clients cache credentials for performance
- Restart loads fresh values from database

### **How to Restart:**

**Development:**
```bash
# Stop current server (Ctrl+C)
# Restart with:
cd apps/api
npm run dev
```

**Production (PM2):**
```bash
pm2 restart api
```

**Production (Docker):**
```bash
docker restart fixfirst-api
```

---

## ✅ **Best Practices**

### **For GSC:**
- Use a dedicated Google Cloud project
- Enable Search Console API before setup
- Add your email as test user (testing mode)
- Update redirect URI for production domain

### **For PayPal:**
- Always test in Sandbox first
- Create clear subscription plan descriptions
- Set up webhook notifications
- Monitor payment success rates

### **For OpenAI:**
- Set up billing limits in OpenAI dashboard
- Monitor usage regularly
- Test API key before saving
- Keep backup of key securely

---

## 🐛 **Troubleshooting**

### **"Settings not taking effect"**
**Solution:** Restart the API server after saving settings

### **"Test Connection Failed" (OpenAI)**
**Solution:** 
- Verify API key starts with `sk-`
- Check OpenAI account has billing enabled
- Ensure API key has proper permissions

### **"Invalid Client" (GSC)**
**Solution:**
- Verify Client ID and Secret are correct
- Check redirect URI matches exactly
- Ensure OAuth consent screen is configured

### **"Invalid credentials" (PayPal)**
**Solution:**
- Verify correct mode (Sandbox/Live)
- Check credentials match the selected mode
- Ensure app is not suspended in PayPal

### **"Credentials not found"**
**Solution:**
- Check database connection
- Verify `SystemSettings` table exists
- Run database migrations if needed

---

## 📊 **Configuration Status**

### **Checking Status:**
- Green "✓ Configured" badge = Settings saved
- No badge = Not configured yet
- Click "Update" to modify existing settings

### **Viewing Current Values:**
- Secrets are always masked for security
- Non-secret values (like Mode, URLs) are shown
- Last updated timestamp displayed

---

## 🎯 **Quick Start Checklist**

- [ ] OpenAI API key configured and tested
- [ ] GSC credentials configured (if using keyword tracking)
- [ ] PayPal credentials configured (if using billing)
- [ ] API server restarted after configuration
- [ ] Test each integration works correctly

---

## 📚 **Related Documentation**

- **OpenAI:** [platform.openai.com/docs](https://platform.openai.com/docs)
- **GSC:** `docs/GSC_SETUP_GUIDE.md`
- **PayPal:** `docs/PAYPAL_BILLING_SETUP.md`
- **General:** `docs/IMPLEMENTATION_ROADMAP.md`

---

## 💡 **Tips**

1. **Configure OpenAI first** - Most impactful for user experience
2. **GSC optional** - Only needed if using keyword tracking
3. **PayPal optional** - Only needed if monetizing
4. **Test in development** before production
5. **Document your keys** securely (password manager)

---

**Last Updated:** October 29, 2025  
**Version:** 1.0.0  
**Feature Status:** ✅ Production Ready

**Your platform now has enterprise-grade API management! 🎉**


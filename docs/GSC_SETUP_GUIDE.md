# 🔑 Google Search Console API Setup Guide

## Quick Setup Steps

### 1. Go to Google Cloud Console
Visit: https://console.cloud.google.com/

### 2. Create/Select Project
- Click "Select a project" → "New Project"
- Name it: "FixFirst SEO"
- Click "Create"

### 3. Enable Google Search Console API
- Go to "APIs & Services" → "Library"
- Search for "Google Search Console API"
- Click on it → Click "Enable"

### 4. Create OAuth 2.0 Credentials
- Go to "APIs & Services" → "Credentials"
- Click "Create Credentials" → "OAuth 2.0 Client ID"
- If prompted, configure OAuth consent screen:
  - User Type: External
  - App name: FixFirst SEO
  - User support email: your email
  - Developer contact: your email
  - Click "Save and Continue"
  - Scopes: Skip (click "Save and Continue")
  - Test users: Add your email
  - Click "Save and Continue"

- Now create OAuth Client ID:
  - Application type: **Web application**
  - Name: "FixFirst SEO Local"
  - Authorized redirect URIs:
    - Add: `http://localhost:3001/api/gsc/callback`
    - Add: `http://localhost:3005/api/gsc/callback` (just in case)
  - Click "Create"

### 5. Copy Credentials
- You'll see a popup with:
  - **Client ID** (looks like: 123456-abc.apps.googleusercontent.com)
  - **Client Secret** (looks like: GOCSPX-abc123...)
- Click "Download JSON" or copy both values

### 6. Add to Environment Variables

**For Windows (PowerShell):**
```powershell
# Add these to your API server startup command
$env:GSC_CLIENT_ID="your_client_id_here"
$env:GSC_CLIENT_SECRET="your_client_secret_here"
```

**Or create a `.env` file in `apps/api/`:**
```env
GSC_CLIENT_ID=your_client_id_here
GSC_CLIENT_SECRET=your_client_secret_here
GSC_REDIRECT_URI=http://localhost:3001/api/gsc/callback
```

### 7. Restart API Server
```bash
cd apps/api
npm run dev
```

### 8. Test Connection
- Go to Keywords page
- Click "Connect Google Search Console"
- You should see Google's OAuth consent screen
- Authorize access
- You'll be redirected back to your app

---

## 🚀 For Production Deployment

When deploying to production:

1. **Add Production Redirect URI:**
   - Go back to Google Cloud Console
   - Edit your OAuth client
   - Add: `https://yourdomain.com/api/gsc/callback`

2. **Set Production Environment Variables:**
   ```env
   GSC_CLIENT_ID=your_client_id_here
   GSC_CLIENT_SECRET=your_client_secret_here
   GSC_REDIRECT_URI=https://yourdomain.com/api/gsc/callback
   ```

3. **Publish OAuth App:**
   - Go to "OAuth consent screen"
   - Click "Publish App"
   - Verify your domain

---

## ❓ Troubleshooting

### "Error 400: redirect_uri_mismatch"
- Make sure redirect URI in Google Cloud Console exactly matches your env variable
- Check for http vs https
- Check for trailing slashes

### "GSC not configured" error
- Verify environment variables are set
- Restart API server after adding variables
- Check terminal for the warning message

### "Access blocked: This app is not verified"
- Normal for development
- Click "Advanced" → "Go to FixFirst SEO (unsafe)"
- Or add yourself as a test user in OAuth consent screen

---

## 🎯 What You Get

Once connected:
- ✅ Real ranking data from Google
- ✅ Last 16 months of historical data
- ✅ Impressions and clicks per keyword
- ✅ Click-through rates
- ✅ Position tracking
- ✅ Free forever (25,000 requests/day limit)


# 🔑 Google PageSpeed Insights API Key Setup

## Why Get an API Key?

| Without API Key | With API Key |
|----------------|--------------|
| 25 requests/day | **25,000 requests/day** |
| Shared IP limits | Your own quota |
| May hit rate limits | Reliable service |

**Recommendation:** Get an API key if you plan to run more than a few audits per day.

---

## 📋 Step-by-Step Guide (5 minutes)

### 1. Go to Google Cloud Console

Open: **https://console.cloud.google.com/**

### 2. Create a New Project

1. Click **"Select a project"** at the top
2. Click **"NEW PROJECT"**
3. Enter project name: `FixFirst SEO` (or any name)
4. Click **"CREATE"**
5. Wait a few seconds for the project to be created

### 3. Enable PageSpeed Insights API

1. In the left sidebar, click **"APIs & Services"** → **"Library"**
2. In the search bar, type: `PageSpeed Insights API`
3. Click on **"PageSpeed Insights API"**
4. Click the blue **"ENABLE"** button
5. Wait for it to enable (~5 seconds)

### 4. Create API Key

1. In the left sidebar, click **"APIs & Services"** → **"Credentials"**
2. Click **"CREATE CREDENTIALS"** (blue button at top)
3. Select **"API Key"**
4. A popup will show your key (starts with `AIzaSy...`)
5. **Copy the key immediately!**

### 5. (Optional) Restrict the Key

For better security:

1. In the popup, click **"RESTRICT KEY"**
2. Under "API restrictions", select **"Restrict key"**
3. In the dropdown, select **"PageSpeed Insights API"**
4. Click **"SAVE"**

Your key is now restricted to only work with PSI API.

---

## 🔧 Add Key to Your Project

### Option 1: Using PowerShell Script (Easiest)

1. Open `restart-worker-with-psi.ps1` in your editor
2. Find the line:
   ```powershell
   # $env:PSI_API_KEY = "AIzaSyXXXXXXXXXXXXXXXXXXXXX"
   ```
3. Remove the `#` and replace with your actual key:
   ```powershell
   $env:PSI_API_KEY = "AIzaSyYourActualKeyHere"
   ```
4. Save the file
5. Stop your current worker (Ctrl+C)
6. Run: `.\restart-worker-with-psi.ps1`

### Option 2: Manual Environment Variable

Stop your current worker (Ctrl+C), then run:

```powershell
cd "C:\Users\Lenovo\Documents\Software Development\October 2025\FixFirst SEO\apps\api"
$env:DATABASE_URL="postgresql://postgres:postgres@localhost:5433/seo_audit_tool"
$env:REDIS_URL="redis://localhost:6380"
$env:JWT_SECRET="dev-secret"
$env:PSI_API_KEY="AIzaSyYourActualKeyHere"
npm run worker
```

### Option 3: Create .env File

1. Create a file named `.env` in the project root
2. Add these lines:
   ```env
   DATABASE_URL=postgresql://postgres:postgres@localhost:5433/seo_audit_tool
   REDIS_URL=redis://localhost:6380
   JWT_SECRET=dev-secret
   PSI_API_KEY=AIzaSyYourActualKeyHere
   ```
3. Stop and restart the worker
4. The worker will automatically load from `.env`

---

## ✅ Verify It's Working

After restarting the worker with the API key:

1. Run a new audit in the browser
2. Watch the worker terminal logs
3. You should see:
   ```
   [PSI] Analyzing https://example.com...
   [PSI] Mobile Score: 85, Desktop Score: 95
   [PSI] Completed analysis
   ```
4. No rate limit errors!

---

## 📊 Monitor Your Usage

To check how many requests you've used:

1. Go to **Google Cloud Console**
2. Select your project
3. Go to **"APIs & Services"** → **"Dashboard"**
4. Click on **"PageSpeed Insights API"**
5. View the graph showing your daily requests

---

## 🚨 Troubleshooting

### "API key not valid" error

**Fix:** Make sure you:
- Enabled the PageSpeed Insights API
- Copied the full key (starts with `AIzaSy`)
- No extra spaces in the key

### "Rate limit exceeded"

**Without key:** You hit the 25/day limit
**With key:** Very unlikely (25,000/day limit)

**Fix:** 
- Wait 24 hours, or
- Get an API key if you don't have one

### Worker not picking up the key

**Fix:**
- Make sure you restarted the worker after setting the env var
- Check the key is correctly set: `echo $env:PSI_API_KEY` in PowerShell
- Should output your key (not blank)

---

## 💰 Cost

**PageSpeed Insights API is FREE!**

- ✅ 25,000 requests per day
- ✅ No credit card required
- ✅ No charges

Google provides this for free to help developers improve web performance.

---

## 🔐 Security Best Practices

1. **Don't commit your key to Git:**
   - Add `.env` to `.gitignore` (already done)
   - Never share your key publicly

2. **Restrict your key:**
   - Use API restrictions in Google Cloud Console
   - Only allow PageSpeed Insights API

3. **Rotate keys periodically:**
   - Generate a new key every few months
   - Delete old keys

---

## 📚 Additional Resources

- **Google PSI API Docs:** https://developers.google.com/speed/docs/insights/v5/get-started
- **Google Cloud Console:** https://console.cloud.google.com/
- **API Dashboard:** https://console.cloud.google.com/apis/dashboard

---

## ✨ What You Get With PSI

Once integrated, every audit will include:

- 📊 **Core Web Vitals** (LCP, CLS, INP)
- 🎯 **Performance Score** (0-100)
- ♿ **Accessibility Score** (0-100)
- ✅ **Best Practices Score** (0-100)
- 🔍 **SEO Score** (0-100)
- 💡 **Optimization Opportunities** (Google's recommendations)
- 📱 **Mobile & Desktop** comparison

All displayed beautifully in your Performance tab!

---

**Need help?** Open an issue or check the worker logs for detailed error messages.


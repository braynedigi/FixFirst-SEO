# 🧪 Testing Guide - PSI Integration & Complete System

## ✅ What's Currently Running

Based on your terminal output, you have:

- ✅ **Frontend** - http://localhost:3005
- ✅ **API Server** - http://localhost:3001
- ✅ **Worker** - Listening for audit jobs
- ✅ **Prisma Studio** - http://localhost:5555
- ✅ **PostgreSQL** - Port 5433
- ✅ **Redis** - Port 6380

Everything is ready to test! 🚀

---

## 🎯 Test Plan

### Test 1: Run Your First PSI-Enabled Audit

**Steps:**

1. **Open the app:**
   ```
   http://localhost:3005
   ```

2. **Login:**
   - Email: `test@example.com`
   - Password: `password123`

3. **Create a New Audit:**
   - Click **"New Audit"** button (top right or in dashboard)
   - Enter URL: `https://example.com`
   - Click **"Start Audit"**

4. **Watch the Worker Terminal:**

   You should see this sequence:
   ```
   [Worker] Starting audit abc123 for https://example.com
   [Worker] Stage: crawling (10%)
   [PSI] Analyzing https://example.com...
   [PSI] Mobile Score: 85, Desktop Score: 95    ← PSI IS WORKING! 🎉
   [PSI] Completed analysis for https://example.com
   [Worker] Stage: analyzing (65%)
   [Worker] Completed audit abc123 with score 75
   ```

   **Key Indicators:**
   - ✅ `[PSI] Analyzing...` - PSI service called
   - ✅ `[PSI] Mobile Score: XX` - PSI data retrieved
   - ✅ `[PSI] Completed analysis` - PSI success

5. **View Results:**
   - Wait for audit to complete (~1-2 minutes)
   - Dashboard will show "Completed"
   - Click on the audit

6. **Check the Performance Tab:**
   - Click **"Performance"** tab
   - You should see:

   ```
   ✅ Core Web Vitals (Mobile)
   ├─ LCP: 1,200 ms (green/yellow/red)
   ├─ CLS: 0.05 (green)
   └─ INP: 150 ms (green)

   ✅ PageSpeed Insights Scores
   ├─ Performance: 85
   ├─ Accessibility: 95
   ├─ Best Practices: 90
   └─ SEO: 100

   ✅ Desktop Performance
   ├─ LCP: 800 ms
   ├─ CLS: 0.02
   └─ INP: 80 ms

   ✅ Optimization Opportunities
   └─ Top 5 recommendations from Google
   ```

**Expected Result:** Beautiful cards with real Google PageSpeed data! 🎨

---

### Test 2: Try Different URLs

Test with various site types:

| URL | Why Test This | Expected Result |
|-----|---------------|----------------|
| `https://example.com` | Fast, simple HTML | High scores (~85-95) |
| `https://github.com` | Real production site | Moderate scores (~70-85) |
| `https://amazon.com` | Heavy, complex site | Lower scores (~40-60) |
| `https://google.com` | Optimized by Google | Very high scores (~95-100) |

**What to Check:**
- ✅ PSI runs for each audit
- ✅ Scores vary based on site performance
- ✅ Opportunities are site-specific
- ✅ Mobile vs Desktop scores differ

---

### Test 3: Check PSI Failure Handling

To test graceful degradation:

1. **Disconnect from internet** (or block googleapis.com in hosts file)
2. Run an audit
3. **Expected behavior:**
   - Worker logs: `[PSI] PSI analysis failed, continuing without it`
   - Audit still completes normally
   - Performance tab shows: "PageSpeed Insights data not available"
   - Your custom performance rules still show

**This confirms audits don't fail if PSI is unavailable!** ✅

---

### Test 4: PDF Export with PSI Data

1. Run an audit and wait for completion
2. Click **"Export PDF"** button
3. Open the downloaded PDF
4. **Check for PSI data in the report:**
   - Should include Core Web Vitals
   - Should show PSI scores
   - Beautiful formatted report

---

### Test 5: All Other Features

Make sure everything still works:

#### Authentication ✅
- Login/Logout
- Register new user
- Session persistence

#### Dashboard ✅
- View recent audits
- Click to view results
- See audit status (queued → running → completed)

#### Audit Results ✅
- Overview tab (summary)
- Technical tab (SEO rules)
- On-Page tab (content rules)
- Schema tab (structured data)
- **Performance tab (PSI data!)** ← NEW!
- Local SEO tab

#### Settings ✅
- Change password
- View usage stats
- Generate API key
- Update notification preferences
- Delete account

#### Failed Audit Management ✅
- Retry individual failed audits
- Delete individual failed audits
- Bulk delete all failed audits

#### Admin (if logged in as admin) ✅
- Email: `admin@seoaudit.com`
- Password: `password123`
- View/edit audit rules
- View all users
- System statistics

---

## 🔍 What to Look For

### Success Indicators ✅

**In Worker Logs:**
```
[PSI] Analyzing https://example.com...
[PSI] Mobile Score: 85, Desktop Score: 95
[PSI] Completed analysis
```

**In Frontend:**
- Performance tab loads without errors
- Core Web Vitals cards display with colors
- Numbers are realistic (not 0 or null)
- Optimization opportunities listed

**In Database (Prisma Studio):**
- Open http://localhost:5555
- Go to `Audit` table
- Click on latest audit
- Check `psiData` field - should contain JSON object

### Potential Issues ⚠️

**"PSI analysis failed"**
- **Cause:** No internet, rate limited, or API issue
- **Impact:** Audit completes, but no PSI data
- **Fix:** Check internet, consider getting API key

**"Rate limit exceeded"**
- **Cause:** Hit free tier limit (25/day)
- **Impact:** No PSI data for this audit
- **Fix:** Get a free API key (25,000/day)

**Performance tab shows "data not available"**
- **Cause:** PSI failed or audit was run before PSI integration
- **Impact:** No PSI visualization
- **Fix:** Run a new audit

---

## 📊 Database Inspection

Use Prisma Studio to inspect PSI data:

1. Open: http://localhost:5555
2. Click **"Audit"** table
3. Find your latest audit
4. Click to expand
5. Scroll to **"psiData"** field
6. Should look like:

```json
{
  "mobile": {
    "performanceScore": 85,
    "lcp": 1200,
    "cls": 0.05,
    "inp": 150,
    ...
  },
  "desktop": {
    "performanceScore": 95,
    ...
  },
  "opportunities": [...]
}
```

---

## 🎨 UI/UX Testing

### Check Responsive Design:
- Resize browser window
- Test on mobile viewport (DevTools)
- All tabs should be scrollable on mobile
- Cards should stack vertically on small screens

### Check Animations:
- Score numbers should animate on load
- Progress bars should animate
- Tab switching should be smooth
- Hover effects on cards

### Check Dark Theme:
- Background: Black with sea blue gradients
- Primary color: Sea blue (#06b6d4)
- Accent: Teal/green
- All text readable

---

## 🐛 Common Issues & Fixes

### Issue: "Cannot read property 'lcp' of undefined"

**Cause:** Old audit (before PSI integration)

**Fix:** Run a new audit

### Issue: Frontend not updating

**Cause:** Next.js cache

**Fix:**
1. Stop frontend (Ctrl+C)
2. Delete `.next` folder
3. Restart: `npm run dev`

### Issue: Worker not starting

**Cause:** Redis connection issue

**Fix:**
```powershell
docker ps  # Check if Redis is running
docker-compose restart redis
```

### Issue: Database error

**Cause:** Migrations not applied

**Fix:**
```powershell
cd "C:\Users\Lenovo\Documents\Software Development\October 2025\FixFirst SEO"
$env:DATABASE_URL="postgresql://postgres:postgres@localhost:5433/seo_audit_tool"
npx prisma migrate dev
```

---

## ✅ Test Checklist

Copy this checklist and check off as you test:

```
Basic Functionality:
[ ] User can login
[ ] User can create new audit
[ ] Audit queues and starts
[ ] Audit completes successfully
[ ] Results page loads

PSI Integration:
[ ] Worker logs show "[PSI] Analyzing..."
[ ] Worker logs show "[PSI] Mobile Score: XX"
[ ] Performance tab displays PSI data
[ ] Core Web Vitals cards show colored metrics
[ ] PageSpeed scores show (Performance, Accessibility, etc.)
[ ] Desktop metrics display
[ ] Optimization opportunities list appears
[ ] PSI data saved in database (check Prisma Studio)

Edge Cases:
[ ] Audit works without PSI (if PSI fails)
[ ] Performance tab shows "data not available" for old audits
[ ] Multiple audits can run simultaneously

Other Features:
[ ] PDF export includes PSI data
[ ] Settings page works
[ ] Admin panel accessible
[ ] Failed audit management works
[ ] Responsive design on mobile

Performance:
[ ] Page loads in < 3 seconds
[ ] Smooth animations
[ ] No console errors
[ ] Database queries are fast
```

---

## 🚀 Next Steps After Testing

1. **Get PSI API Key** (optional but recommended)
   - Follow: `PSI_API_KEY_SETUP.md`
   - Increases limit to 25,000/day

2. **Run More Audits**
   - Test with your own websites
   - Share with colleagues for feedback

3. **Customize**
   - Adjust rule weights in admin panel
   - Add more audit rules if needed

4. **Deploy to Production**
   - Build Docker images
   - Deploy to your VPS
   - Set production environment variables

---

## 📞 Need Help?

**Check logs first:**
- Worker terminal for PSI errors
- Browser console for frontend errors
- Prisma Studio for database state

**Documentation:**
- `PSI_INTEGRATION.md` - Full PSI details
- `PSI_API_KEY_SETUP.md` - Get API key guide
- `README.md` - Project overview

**Quick Fixes:**
- Restart services: `docker-compose restart`
- Clear Next.js cache: Delete `.next` folder
- Reset database: `npx prisma migrate reset`

---

## 🎉 Success Criteria

Your PSI integration is working perfectly if:

✅ Every new audit shows PSI data in Performance tab  
✅ Worker logs confirm PSI analysis  
✅ Database stores psiData JSON  
✅ Frontend displays beautiful metrics  
✅ Audits complete even if PSI fails  
✅ No errors in console or logs  

**Happy Testing!** 🚀


# 🔑 Keyword Tracking Feature Guide

## Overview

FixFirst SEO now includes a comprehensive **Keyword Tracking** system that allows you to monitor your search engine rankings for unlimited keywords across different devices and locations. The system integrates with **Google Search Console (GSC)** for free, real-time ranking data directly from Google.

---

## ✨ Features

### Core Functionality
- ✅ **Unlimited Keywords** - Track as many keywords as you need
- ✅ **Position Tracking** - Monitor current, previous, best, and worst positions
- ✅ **Rank Change Indicators** - See improvements and declines at a glance
- ✅ **Device Tracking** - Separate rankings for Desktop, Mobile, and Tablet
- ✅ **Location Tracking** - Track rankings by country (US, UK, etc.)
- ✅ **Search Volume** - View monthly search impressions from GSC
- ✅ **Click-Through Rates** - Monitor CTR for each keyword
- ✅ **Historical Data** - Up to 100 ranking snapshots per keyword

### Google Search Console Integration
- 🔗 **OAuth Authentication** - Secure connection to your GSC account
- 📊 **Real Data from Google** - Get actual ranking data, not estimates
- 🔄 **One-Click Sync** - Manual sync anytime with the "Sync GSC" button
- 📈 **Impressions & Clicks** - See how many times your site appears in search
- 🎯 **Target URL Tracking** - Monitor which pages rank for each keyword

### Organization & Management
- 📁 **Keyword Groups** - Organize keywords by categories, campaigns, or themes
- 🏷️ **Color-Coded Labels** - Visual organization with custom colors
- 🔍 **Search & Filter** - Quickly find keywords by search or group
- ⏸️ **Pause/Resume Tracking** - Temporarily stop tracking any keyword
- 📥 **Bulk Import** - Add multiple keywords at once (one per line)

### Analytics & Insights
- 📊 **Stats Dashboard** - Total keywords, Top 3, Top 10, and improved count
- 📈 **Position Charts** - Visualize ranking trends over time
- 🎯 **Performance Metrics** - Average position, best/worst tracking
- ⚡ **Quick Actions** - Delete, pause, or view details with one click

---

## 🚀 Setup Instructions

### Step 1: Enable Google Search Console API

To use keyword tracking with Google Search Console:

1. **Go to Google Cloud Console**
   - Visit [https://console.cloud.google.com/](https://console.cloud.google.com/)
   - Create a new project or select an existing one

2. **Enable the API**
   - Navigate to "APIs & Services" → "Library"
   - Search for "Google Search Console API"
   - Click "Enable"

3. **Create OAuth 2.0 Credentials**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth 2.0 Client ID"
   - Application type: "Web application"
   - Add authorized redirect URI: `http://localhost:3001/api/gsc/callback`
   - For production: `https://yourdomain.com/api/gsc/callback`

4. **Download Credentials**
   - Download the JSON file or copy the Client ID and Secret

5. **Set Environment Variables**
   ```bash
   GSC_CLIENT_ID=your_client_id_here
   GSC_CLIENT_SECRET=your_client_secret_here
   GSC_REDIRECT_URI=http://localhost:3001/api/gsc/callback
   ```

6. **Restart API Server**
   ```bash
   cd apps/api
   npm run dev
   ```

### Step 2: Connect Your Google Search Console Account

1. Navigate to any project's Keywords tab
2. Click "Connect Google Search Console" in the warning banner
3. Authorize access to your GSC account
4. Select the property you want to track
5. You're connected! Click "Sync GSC" to pull rankings

---

## 📖 User Guide

### Adding Keywords

#### Single Keyword
1. Go to Project → Keywords tab
2. Click "+ Add Keyword"
3. Enter:
   - Keyword phrase (e.g., "seo audit tool")
   - Group (optional)
   - Device (Desktop, Mobile, Tablet)
   - Target URL (optional)
4. Click "Add Keyword"

#### Bulk Import
1. Click "Bulk Add" button
2. Enter keywords (one per line):
   ```
   seo audit tool
   website analyzer
   competitor analysis
   ```
3. Select a group (optional)
4. Choose device type
5. Click "Add Keywords"

#### Import from GSC
1. Connect Google Search Console (if not already)
2. Click "Import from GSC"
3. View top-performing keywords
4. Select keywords to track
5. Click "Import Selected"

### Syncing Rankings

#### Manual Sync
- Click the "Sync GSC" button anytime
- This fetches the latest 7 days of data from Google
- Updates positions, impressions, clicks, and CTR
- Takes 5-10 seconds depending on keyword count

#### Automated Sync (Coming Soon)
- Set up automatic daily/weekly sync schedules
- Receive notifications when rankings change
- Background workers will handle this automatically

### Managing Keywords

#### View Details
- Click the chart icon (📊) to see full ranking history
- View position changes over time
- See which URLs rank for each keyword
- Analyze impressions, clicks, and CTR trends

#### Pause Tracking
- Click the pause button (⏸️) to temporarily stop tracking
- Useful for seasonal keywords or testing
- Click play (▶️) to resume

#### Delete Keyword
- Click the trash icon (🗑️)
- Confirm deletion
- Historical data will be permanently removed

### Organizing with Groups

#### Create Group
1. Go to Keywords tab
2. Click "Manage Groups"
3. Click "+ New Group"
4. Enter:
   - Name (e.g., "Brand Keywords")
   - Color (pick from palette)
   - Description (optional)
5. Save

#### Assign Keywords to Groups
1. Edit keyword
2. Select group from dropdown
3. Save changes

#### Filter by Group
- Use the group filter dropdown
- Select a group to show only those keywords
- Select "All Groups" to show everything

---

## 🔧 Technical Implementation

### Database Schema

```prisma
model Keyword {
  id               String         @id @default(cuid())
  projectId        String
  groupId          String?
  keyword          String
  targetUrl        String?
  device           KeywordDevice  @default(DESKTOP)
  location         String         @default("US")
  language         String         @default("en")
  searchVolume     Int?
  difficulty       Int?
  currentPosition  Int?
  previousPosition Int?
  bestPosition     Int?
  worstPosition    Int?
  averagePosition  Float?
  isTracking       Boolean        @default(true)
  
  project          Project        @relation(fields: [projectId], references: [id])
  group            KeywordGroup?  @relation(fields: [groupId], references: [id])
  rankings         KeywordRanking[]
}

model KeywordRanking {
  id             String    @id @default(cuid())
  keywordId      String
  position       Int?
  url            String?
  impressions    Int?
  clicks         Int?
  ctr            Float?
  serpFeatures   Json?
  competitorUrls Json?
  capturedAt     DateTime  @default(now())
  
  keyword        Keyword   @relation(fields: [keywordId], references: [id])
}

model KeywordGroup {
  id          String    @id @default(cuid())
  projectId   String
  name        String
  color       String?
  description String?
  
  project     Project   @relation(fields: [projectId], references: [id])
  keywords    Keyword[]
}
```

### API Endpoints

#### Keywords
- `GET /api/keywords/project/:projectId` - Get all keywords
- `GET /api/keywords/:id` - Get single keyword with history
- `POST /api/keywords` - Create keyword
- `POST /api/keywords/bulk` - Bulk create keywords
- `PATCH /api/keywords/:id` - Update keyword
- `DELETE /api/keywords/:id` - Delete keyword
- `POST /api/keywords/:id/toggle` - Pause/resume tracking
- `POST /api/keywords/sync-gsc` - Sync rankings from GSC

#### Keyword Groups
- `GET /api/keyword-groups/project/:projectId` - Get all groups
- `POST /api/keyword-groups` - Create group
- `PATCH /api/keyword-groups/:id` - Update group
- `DELETE /api/keyword-groups/:id` - Delete group

#### Google Search Console
- `GET /api/gsc/status` - Check connection status
- `GET /api/gsc/auth-url` - Get OAuth URL
- `GET /api/gsc/callback` - Handle OAuth callback
- `GET /api/gsc/sites` - List available GSC properties
- `GET /api/gsc/top-keywords` - Get top keywords from GSC
- `POST /api/gsc/disconnect` - Disconnect GSC

### GSC Service

The `gscService.ts` handles all Google Search Console interactions:

- **OAuth Flow** - Secure authentication with refresh tokens
- **Token Management** - Automatic token refresh before expiry
- **Rate Limiting** - Respects Google's API limits
- **Error Handling** - Graceful fallbacks for API failures
- **Data Caching** - Stores tokens in database for persistence

---

## 📊 Data Limitations

### Google Search Console API Limits
- **Data Freshness** - 2-3 day delay (Google limitation)
- **History** - Up to 16 months of historical data
- **Daily Quota** - 25,000 requests per day (very generous)
- **Rate Limit** - 600 requests per minute
- **Row Limit** - 25,000 rows per request

### MVP Limitations (Planned Improvements)
- ⏳ **Manual Sync Only** - Automated daily sync coming soon
- ⏳ **No SERP Features** - Featured snippets, PAA, etc. coming soon
- ⏳ **Basic Charts** - Advanced visualizations coming soon
- ⏳ **No Alerts** - Ranking change notifications coming soon

---

## 🎯 Best Practices

### 1. Start Small
- Add 10-20 core keywords first
- Test the GSC sync functionality
- Expand once you're comfortable

### 2. Organize Early
- Create groups before adding many keywords
- Use clear, descriptive group names
- Color-code by priority or campaign

### 3. Regular Syncing
- Sync weekly for most projects
- Daily for active campaigns
- After major site changes

### 4. Monitor Trends
- Focus on 7-day and 30-day trends
- Don't panic over daily fluctuations
- Look for consistent improvements

### 5. Set Realistic Expectations
- Rankings can take 2-6 months to improve
- GSC data has a 2-3 day delay
- Focus on trends, not daily changes

---

## 🔮 Coming Soon

### Automated Features
- ⏳ **Daily Auto-Sync** - Background worker runs nightly
- ⏳ **Ranking Alerts** - Email/Slack when positions change significantly
- ⏳ **Scheduled Reports** - Weekly ranking summary emails

### Advanced Analytics
- ⏳ **SERP Features** - Track featured snippets, PAA boxes
- ⏳ **Competitor Tracking** - See who ranks above you
- ⏳ **Opportunity Finder** - Keywords where you're close to Page 1
- ⏳ **Keyword Cannibalization** - Detect multiple pages competing

### Data Enhancements
- ⏳ **Search Volume** - Integrate with paid APIs (DataForSEO)
- ⏳ **Keyword Difficulty** - Competition scores
- ⏳ **CPC Data** - Cost-per-click estimates
- ⏳ **Trend Data** - Search interest over time

### Integration Options
- ⏳ **CSV Import/Export** - Bulk data management
- ⏳ **Google Sheets** - Live sync to spreadsheets
- ⏳ **Slack Notifications** - Real-time ranking alerts
- ⏳ **Webhooks** - Custom integrations

---

## ❓ Troubleshooting

### "GSC Not Connected" Error
1. Check environment variables are set
2. Verify OAuth credentials in Google Cloud Console
3. Ensure redirect URI matches exactly
4. Try disconnecting and reconnecting

### No Rankings Showing
1. Confirm keywords exist in GSC for your property
2. Check GSC data is not too recent (2-3 day delay)
3. Verify property URL matches exactly (http vs https)
4. Wait for next sync (data might be processing)

### Sync Button Not Working
1. Check GSC connection status
2. Ensure at least one keyword has `isTracking = true`
3. Check browser console for errors
4. Verify API server is running

### Rankings Seem Wrong
1. GSC data has 2-3 day delay
2. Rankings can fluctuate by 1-3 positions daily
3. Check device type matches (mobile vs desktop)
4. Verify location settings (US vs UK, etc.)

---

## 🎓 Learn More

### Google Search Console Resources
- [GSC API Documentation](https://developers.google.com/webmaster-tools)
- [Understanding Search Data](https://support.google.com/webmasters/answer/7576553)
- [GSC Limits & Quotas](https://developers.google.com/webmaster-tools/limits)

### SEO Best Practices
- [Google Search Central](https://developers.google.com/search)
- [Keyword Research Guide](https://moz.com/beginners-guide-to-seo/keyword-research)
- [Rank Tracking Tips](https://ahrefs.com/blog/rank-tracking/)

---

## 💡 Tips & Tricks

1. **Bulk Import from Spreadsheet**
   - Copy keywords from Excel/Sheets
   - Paste into bulk add modal
   - One keyword per line

2. **Track Branded vs Non-Branded**
   - Create separate groups
   - Different colors for easy identification
   - Monitor both independently

3. **Mobile-First Strategy**
   - Track mobile rankings separately
   - Mobile often ranks differently than desktop
   - Google uses mobile-first indexing

4. **Local SEO Keywords**
   - Include city/region in keywords
   - Track by specific location
   - Use "near me" variations

5. **Competitor Keywords**
   - Track what competitors rank for
   - Use GSC "Import Top Keywords"
   - Create "Competitor" group

---

## 🎉 Success!

You now have a powerful keyword tracking system integrated with Google Search Console! Start by:

1. ✅ Connecting your GSC account
2. ✅ Adding 5-10 core keywords
3. ✅ Running your first sync
4. ✅ Checking back weekly to monitor progress

**Happy Tracking!** 🚀


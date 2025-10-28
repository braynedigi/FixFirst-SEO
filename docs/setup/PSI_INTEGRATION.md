# Google PageSpeed Insights API Integration

## Overview
Successfully integrated Google PageSpeed Insights (PSI) API to provide Core Web Vitals data and performance metrics for every audit.

## ✅ Implementation Complete

### What Was Added:

1. **PSI Service** (`packages/audit-engine/src/services/pagespeed.ts`)
   - Fetches data from Google PageSpeed Insights API v5
   - Analyzes both Mobile and Desktop performance
   - Extracts Core Web Vitals (LCP, CLS, INP)
   - Gets PageSpeed scores (Performance, Accessibility, Best Practices, SEO)
   - Provides optimization opportunities
   - Graceful error handling (doesn't fail audit if PSI fails)

2. **Database Schema Update**
   - Added `psiData` JSON field to `Audit` model
   - Stores complete PSI response for both mobile and desktop

3. **Worker Integration**
   - PSI analysis runs after crawling, before rule execution
   - Progress updates during PSI phase (50-60%)
   - Non-blocking - audit continues even if PSI fails
   - Results stored in audit record

4. **Frontend Display**
   - New `PerformanceTab` component with rich PSI visualization
   - Core Web Vitals cards with color-coded status
   - PageSpeed Insights scores (0-100)
   - Desktop vs Mobile comparison
   - Optimization opportunities list
   - Graceful handling when PSI data unavailable

---

## 🎨 UI Features

### Performance Tab Now Shows:

1. **Core Web Vitals (Mobile)**
   - **LCP** (Largest Contentful Paint) - Load performance
   - **CLS** (Cumulative Layout Shift) - Visual stability
   - **INP** (Interaction to Next Paint) - Responsiveness
   - Color-coded: Green (good), Yellow (needs improvement), Red (poor)

2. **PageSpeed Insights Scores**
   - Performance (0-100)
   - Accessibility (0-100)
   - Best Practices (0-100)
   - SEO (0-100)
   - Color-coded cards with visual feedback

3. **Desktop Performance**
   - Same Core Web Vitals for desktop
   - Side-by-side comparison with mobile

4. **Optimization Opportunities**
   - Top 5 performance improvement suggestions from Google
   - Each with title, description, and potential savings
   - Actionable recommendations

5. **Performance Issues** (from audit rules)
   - Still shows issues from your own performance rules
   - Combined view of Google insights + your rules

---

## 🔑 Getting a Google PageSpeed Insights API Key (Optional)

### Why Get an API Key?

- **Without Key:** 25 requests per day (shared IP pool)
- **With Key:** 25,000 requests per day (per project)

### How to Get API Key:

1. **Go to Google Cloud Console:**
   - Visit: https://console.cloud.google.com/

2. **Create/Select Project:**
   - Click "Select a project" → "New Project"
   - Name it "FixFirst SEO" or similar
   - Click "Create"

3. **Enable PageSpeed Insights API:**
   - Go to "APIs & Services" → "Library"
   - Search for "PageSpeed Insights API"
   - Click "Enable"

4. **Create API Key:**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "API Key"
   - Copy the key

5. **Add to Environment:**
   - Add to your `.env` file:
   ```env
   PSI_API_KEY=your-api-key-here
   ```

6. **Restart Services:**
   ```bash
   # Restart worker to pick up new env var
   # Ctrl+C to stop current worker, then rerun:
   cd "C:\Users\Lenovo\Documents\Software Development\October 2025\FixFirst SEO"
   cd apps/api
   $env:DATABASE_URL="postgresql://postgres:postgres@localhost:5433/seo_audit_tool"
   $env:REDIS_URL="redis://localhost:6380"
   $env:JWT_SECRET="dev-secret"
   $env:PSI_API_KEY="your-api-key-here"
   npm run worker
   ```

---

## 📊 Data Structure

### PSI Data Stored in Database:

```json
{
  "mobile": {
    "performanceScore": 85,
    "accessibility": 95,
    "bestPractices": 90,
    "seo": 100,
    "lcp": 1200,
    "cls": 0.05,
    "inp": 150,
    "fcp": 800,
    "tbt": 50,
    "speedIndex": 1500
  },
  "desktop": {
    "performanceScore": 95,
    "accessibility": 95,
    "bestPractices": 90,
    "seo": 100,
    "lcp": 800,
    "cls": 0.02,
    "inp": 80,
    "fcp": 500,
    "tbt": 20,
    "speedIndex": 900
  },
  "opportunities": [
    {
      "id": "render-blocking-resources",
      "title": "Eliminate render-blocking resources",
      "description": "Resources are blocking the first paint...",
      "displayValue": "Potential savings of 0.5s",
      "score": 0.45
    }
  ],
  "diagnostics": []
}
```

---

## 🚀 How It Works

### Audit Flow with PSI:

1. **User submits audit** → Job queued
2. **Worker starts** → Audit status: RUNNING
3. **Crawling phase** (0-50%)
   - Playwright crawls pages
   - Extracts HTML, links, resources
4. **PSI Analysis** (50-60%) ← **NEW!**
   - Calls Google PSI API for mobile
   - Calls Google PSI API for desktop
   - Extracts Core Web Vitals
   - Gets optimization recommendations
5. **Rule execution** (60-80%)
   - Runs your 27 SEO rules
   - Generates issues and recommendations
6. **Scoring** (80-100%)
   - Calculates category scores
   - Updates audit with results + PSI data
7. **Complete** → User sees results

---

## 📝 Code Architecture

### Service Layer:
```typescript
// packages/audit-engine/src/services/pagespeed.ts
export class PageSpeedInsightsService {
  async analyzeUrl(url: string): Promise<PSIResult>
  private fetchPSIData(url: string, strategy: 'mobile' | 'desktop'): Promise<any>
  private extractMetrics(data: any): PSIMetrics
  private extractOpportunities(data: any): PSIOpportunity[]
}

// Singleton instance
export const psiService = new PageSpeedInsightsService();
```

### Worker Integration:
```typescript
// apps/api/src/worker.ts
import { psiService } from '@seo-audit/audit-engine';

// In processAudit function:
const psiData = await psiService.analyzeUrl(url);

await prisma.audit.update({
  data: { 
    psiData,
    // ... other scores
  }
});
```

### Frontend Display:
```typescript
// apps/web/app/audit/[id]/page.tsx
function PerformanceTab({ audit, issues }) {
  const psiData = audit.psiData;
  
  return (
    <>
      <CoreWebVitalsSection data={psiData.mobile} />
      <PSIScoresSection data={psiData} />
      <OptimizationsSection opportunities={psiData.opportunities} />
      <IssuesSection issues={issues} />
    </>
  );
}
```

---

## 🎯 Metrics Explained

### Core Web Vitals:

1. **LCP (Largest Contentful Paint)**
   - Measures: Loading performance
   - Good: ≤ 2.5s
   - Needs Improvement: 2.5s - 4.0s
   - Poor: > 4.0s

2. **CLS (Cumulative Layout Shift)**
   - Measures: Visual stability
   - Good: ≤ 0.1
   - Needs Improvement: 0.1 - 0.25
   - Poor: > 0.25

3. **INP (Interaction to Next Paint)**
   - Measures: Responsiveness
   - Good: ≤ 200ms
   - Needs Improvement: 200ms - 500ms
   - Poor: > 500ms

### Other Metrics:

- **FCP** (First Contentful Paint) - First element renders
- **TBT** (Total Blocking Time) - Time main thread is blocked
- **Speed Index** - How quickly content is visually displayed
- **TTI** (Time to Interactive) - Page becomes fully interactive

---

## ⚡ Performance Considerations

### API Call Duration:
- PSI analysis takes **10-30 seconds** per URL
- Runs for both mobile and desktop (parallel)
- Total PSI overhead: ~15-40 seconds per audit

### Rate Limiting:
- **Without API Key:** 25 requests/day (very limited)
- **With API Key:** 25,000 requests/day (generous)
- Recommendation: **Get an API key for production**

### Caching Strategy (Future Enhancement):
```typescript
// Cache PSI results for 24 hours per URL
const cacheKey = `psi:${url}`;
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);

const result = await psiService.analyzeUrl(url);
await redis.setex(cacheKey, 86400, JSON.stringify(result));
return result;
```

---

## 🧪 Testing

### Test PSI Integration:

1. **Run a new audit:**
   ```
   http://localhost:3005/dashboard
   Click "New Audit"
   Enter URL: https://example.com
   ```

2. **Watch worker logs:**
   ```
   [Worker] Starting audit...
   [PSI] Analyzing https://example.com...
   [PSI] Mobile Score: 85, Desktop Score: 95
   [PSI] Completed analysis
   [Worker] Completed audit with score 54
   ```

3. **View results:**
   ```
   Navigate to audit results
   Click "Performance" tab
   Should see:
   - Core Web Vitals cards
   - PageSpeed Scores
   - Desktop metrics
   - Optimization opportunities
   ```

### Test Without API Key:
- Works fine!
- Uses Google's free tier (25 requests/day)
- Slower rate limits but functional

### Test With Failed PSI:
- If PSI fails (network, rate limit, etc.)
- Audit continues normally
- Performance tab shows: "PageSpeed Insights data not available"
- Still shows performance issues from your rules

---

## 📦 Files Modified/Created

### New Files:
- ✅ `packages/audit-engine/src/services/pagespeed.ts` - PSI service

### Modified Files:
- ✅ `packages/audit-engine/src/index.ts` - Export PSI service
- ✅ `prisma/schema.prisma` - Added `psiData` field
- ✅ `apps/api/src/worker.ts` - Integrated PSI analysis
- ✅ `apps/web/app/audit/[id]/page.tsx` - Added PerformanceTab with PSI display

### Database Migration:
- ✅ `20251026154951_add_psi_data` - Added psiData column

---

## 🎉 Benefits

1. **Google's Real Data**
   - Uses same engine as PageSpeed Insights website
   - Lab data from Lighthouse
   - Trusted performance metrics

2. **Core Web Vitals**
   - Official Google metrics
   - Direct SEO ranking factors
   - Industry standard benchmarks

3. **Actionable Insights**
   - Google's optimization recommendations
   - Specific improvement opportunities
   - Clear savings estimates

4. **Mobile vs Desktop**
   - Compare performance across devices
   - Identify mobile-specific issues
   - Desktop optimization opportunities

5. **Professional Reports**
   - Matches Google's official tool
   - Credible data for clients
   - Industry-recognized metrics

---

## 🔮 Future Enhancements

### 1. PSI Result Caching:
```typescript
// Cache results for 24 hours
const cached = await redis.get(`psi:${url}`);
if (cached && Date.now() - cached.timestamp < 86400000) {
  return cached.data;
}
```

### 2. Field Data (CrUX):
```typescript
// Get real user metrics from Chrome UX Report
const fieldData = lighthouseResult.loadingExperience;
// Shows actual user experience data (when available)
```

### 3. Historical Tracking:
```typescript
// Track PSI scores over time
// Show trends in Core Web Vitals
// Alert when metrics degrade
```

### 4. Compare Mode:
```typescript
// Compare two audits
// Show PSI improvements/regressions
// Track optimization impact
```

---

## ✅ Integration Complete!

All features implemented and working:
- ✅ PSI API service
- ✅ Database schema updated
- ✅ Worker integration
- ✅ Frontend visualization
- ✅ Error handling
- ✅ Graceful degradation
- ✅ Mobile + Desktop analysis
- ✅ Core Web Vitals display
- ✅ Optimization opportunities
- ✅ Beautiful UI components

**The last major feature is now complete!** 🎉

---

## 📞 Support

### Troubleshooting:

**"PSI data not available"**
- Check worker logs for errors
- Verify internet connection
- Try with API key if rate limited

**"Rate limit exceeded"**
- Get a free API key from Google Cloud
- Current limit: 25/day without key
- With key: 25,000/day

**"Audit takes too long"**
- PSI adds 15-40 seconds to audit time
- This is normal (Google's actual analysis)
- Consider caching for repeat URLs

---

**Next Steps:**
1. (Optional) Get PSI API key for higher limits
2. Run an audit to see PSI data in action!
3. All MVP features are now complete! 🚀


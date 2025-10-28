# Phase 3: Analytics & Insights - Quick Start Guide

## 🚀 Quick Setup (5 Minutes)

### 1. Apply Database Migration
```bash
cd "C:\Users\Lenovo\Documents\Software Development\October 2025\FixFirst SEO"
$env:DATABASE_URL="postgresql://postgres:postgres@localhost:5433/seo_audit?schema=public"
npx prisma migrate deploy
npx prisma generate
```

### 2. Restart Services
```powershell
# Stop all running services (Ctrl+C in each terminal)

# Terminal 1: API Server
cd "C:\Users\Lenovo\Documents\Software Development\October 2025\FixFirst SEO\apps\api"
$env:DATABASE_URL="postgresql://postgres:postgres@localhost:5433/seo_audit?schema=public"
$env:REDIS_URL="redis://localhost:6380"
$env:SOCKET_URL="http://localhost:3001"
$env:PSI_API_KEY="AIzaSyApH_khs9Ln7hi3xkd6qLUahsSgq2KDU0U"
$env:FRONTEND_URL="http://localhost:3005"
npm run dev

# Terminal 2: Frontend
cd "C:\Users\Lenovo\Documents\Software Development\October 2025\FixFirst SEO\apps\web"
npm run dev

# Terminal 3: Worker
cd "C:\Users\Lenovo\Documents\Software Development\October 2025\FixFirst SEO\apps\worker"
$env:DATABASE_URL="postgresql://postgres:postgres@localhost:5433/seo_audit?schema=public"
$env:REDIS_URL="redis://localhost:6380"
$env:SOCKET_URL="http://localhost:3001"
$env:PSI_API_KEY="AIzaSyApH_khs9Ln7hi3xkd6qLUahsSgq2KDU0U"
npm run dev
```

### 3. Access New Features
- **Analytics Dashboard:** Project → Analytics tab
- **Recommendations:** Audit Detail → Recommendations tab
- **Competitor Tracking:** Analytics Dashboard → Add Competitor

---

## 📊 Feature Overview

### Analytics Dashboard
**Access:** Project Settings → Analytics Tab

**What You Get:**
- 📈 Score trends over customizable time periods
- 🎯 Issue distribution by severity and category
- ⚡ Performance metrics tracking
- 🏆 Competitor comparison rankings
- 📊 Summary statistics

### AI Recommendations
**Access:** Audit Detail Page → Recommendations Tab

**What You Get:**
- 🤖 Auto-generated SEO recommendations
- 🎯 Priority-based action items
- 💡 Quick wins identification
- 📈 Impact estimation
- ✅ Implementation tracking

### Competitor Analysis
**Access:** Project Analytics → Competitor Analysis Section

**What You Get:**
- 👥 Track multiple competitors
- 📊 Side-by-side comparisons
- 🏆 Competitive rankings
- 📈 Historical snapshots
- 🎯 Benchmarking data

---

## 🎯 Common Tasks

### View Analytics for a Project
1. Go to Dashboard
2. Click on a project
3. Click "Analytics" tab
4. Select time range (7, 14, 30, 60, or 90 days)

### Generate Recommendations for an Audit
1. Complete an SEO audit
2. Go to Audit Detail page
3. Click "Recommendations" tab
4. Click "Generate Recommendations"
5. Review and mark as implemented

### Add a Competitor
1. Go to Project → Analytics
2. Click "Add Competitor" button
3. Enter competitor name and domain
4. Click "Add Competitor"
5. Create snapshots to track over time

### Create a Competitor Snapshot (Manual)
```bash
# Using curl
curl -X POST http://localhost:3001/api/competitors/{competitorId}/snapshot \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "totalScore": 85,
    "technicalScore": 90,
    "onPageScore": 80,
    "structuredDataScore": 75,
    "performanceScore": 88,
    "localSeoScore": 82
  }'
```

---

## 📱 API Quick Reference

### Analytics Endpoints
```
GET  /api/analytics/trends/:projectId?days=30
GET  /api/analytics/issues/:projectId
GET  /api/analytics/performance/:projectId?limit=10
POST /api/analytics/snapshot/:auditId
```

### Recommendations Endpoints
```
POST   /api/recommendations/generate/:auditId
GET    /api/recommendations/:auditId
PATCH  /api/recommendations/:id/implement
```

### Competitors Endpoints
```
GET    /api/competitors/:projectId
POST   /api/competitors/:projectId
DELETE /api/competitors/:id
GET    /api/competitors/:id/snapshots?limit=30
POST   /api/competitors/:id/snapshot
GET    /api/competitors/:projectId/compare
```

---

## 🎨 Frontend Components

### Analytics Dashboard Page
**File:** `apps/web/app/project/[id]/analytics/page.tsx`

```tsx
// Navigate to analytics
router.push(`/project/${projectId}/analytics`)
```

### Recommendations Component
**File:** `apps/web/components/Recommendations.tsx`

```tsx
<Recommendations auditId={auditId} />
```

### Using Analytics API Client
**File:** `apps/web/lib/api.ts`

```tsx
import { analyticsApi, recommendationsApi, competitorsApi } from '@/lib/api'

// Get trends
const trendsData = await analyticsApi.getTrends(projectId, 30)

// Generate recommendations
const recsData = await recommendationsApi.generate(auditId)

// Add competitor
const competitor = await competitorsApi.create(projectId, {
  name: 'Competitor Inc.',
  domain: 'competitor.com'
})
```

---

## 🔧 Recommendation Categories

| Category | Icon | Description | Example |
|----------|------|-------------|---------|
| QUICK_WIN | ⚡ | High impact, low effort | Enable caching |
| TECHNICAL_IMPROVEMENT | 🔧 | Technical SEO fixes | Fix meta tags |
| CONTENT_OPTIMIZATION | 📝 | Content improvements | Optimize titles |
| PERFORMANCE_BOOST | 🚀 | Speed optimization | Compress images |
| STRUCTURED_DATA | 📊 | Schema markup | Add JSON-LD |
| MOBILE_OPTIMIZATION | 📱 | Mobile responsiveness | Fix viewport |
| LOCAL_SEO | 📍 | Local search | Add NAP info |
| SECURITY | 🔒 | Security improvements | Enable HTTPS |

---

## 🎯 Recommendation Priorities

| Priority | Color | When to Use |
|----------|-------|-------------|
| CRITICAL | 🔴 Red | Must fix immediately |
| HIGH | 🟠 Orange | Fix within 1-2 weeks |
| MEDIUM | 🟡 Yellow | Fix within 1 month |
| LOW | 🔵 Blue | Fix when convenient |

---

## 📈 Analytics Time Ranges

- **7 days:** Daily changes, immediate impact
- **14 days:** Weekly patterns, short-term trends
- **30 days:** Monthly overview, standard tracking
- **60 days:** Quarterly insights, seasonal patterns
- **90 days:** Long-term trends, strategic planning

---

## 🎓 Best Practices

### For Analytics
✅ Run audits regularly (weekly or bi-weekly)  
✅ Monitor trends, not just individual scores  
✅ Set up scheduled audits for consistency  
✅ Compare similar time periods (e.g., month-to-month)

### For Recommendations
✅ Generate recommendations after every audit  
✅ Start with Critical and High priority items  
✅ Mark recommendations as implemented  
✅ Review recommendations quarterly

### For Competitors
✅ Track 3-5 main competitors  
✅ Update snapshots monthly  
✅ Use consistent domains  
✅ Document snapshot context in metadata

---

## 🐛 Troubleshooting

### "No recommendations generated"
- Ensure audit is completed
- Check if audit has issues
- Try generating again

### "Competitor comparison shows no data"
- Add at least one competitor
- Create a snapshot for the competitor
- Ensure project has a completed audit

### "Analytics page is slow"
- Reduce time range (use 30 days instead of 90)
- Clear browser cache
- Check network tab for slow API calls

### "Cannot add competitor"
- Check if domain is already added
- Verify domain format (no http://)
- Ensure you have OWNER or ADMIN role

---

## 🚀 What's New in Phase 3

✨ **Analytics Dashboard** - Comprehensive project analytics  
🤖 **AI Recommendations** - Intelligent SEO insights  
🏆 **Competitor Tracking** - Competitive analysis tools  
📊 **Historical Data** - Long-term trend tracking  
📈 **Performance Metrics** - Core Web Vitals over time  
🎯 **Smart Prioritization** - Impact-based recommendations  

---

## 📚 Related Documentation

- **Full Guide:** [PHASE3_ANALYTICS_GUIDE.md](./PHASE3_ANALYTICS_GUIDE.md)
- **Team Collaboration:** [TEAM_COLLABORATION_GUIDE.md](./TEAM_COLLABORATION_GUIDE.md)
- **API Documentation:** [README.md](./README.md)

---

## 🎉 Next Steps

1. ✅ Run database migration
2. ✅ Restart all services
3. 📊 Create your first competitor
4. 🤖 Generate recommendations for existing audits
5. 📈 View analytics for your projects
6. 🎯 Implement top recommendations

---

**Phase 3: Analytics & Insights** - Quick Start Guide  
Last Updated: October 27, 2025


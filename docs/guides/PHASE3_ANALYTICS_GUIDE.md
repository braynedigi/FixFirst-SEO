# Phase 3: Analytics & Insights - Complete Guide

## Overview

Phase 3 introduces powerful analytics and insights features to transform your SEO audit tool into a comprehensive SEO intelligence platform. This includes AI-powered recommendations, competitor analysis, advanced analytics dashboards, and historical trend tracking.

---

## Table of Contents

1. [Features Overview](#features-overview)
2. [Database Schema](#database-schema)
3. [Backend APIs](#backend-apis)
4. [Frontend Components](#frontend-components)
5. [Usage Guide](#usage-guide)
6. [API Reference](#api-reference)
7. [Integration Examples](#integration-examples)

---

## Features Overview

### 🤖 AI-Powered Recommendations
- Automatic generation of SEO recommendations based on audit results
- Prioritized action items (Critical, High, Medium, Low)
- Category-based recommendations (Quick Wins, Technical, Content, Performance, etc.)
- Estimated impact scores and effort levels
- Implementation tracking

### 📊 Advanced Analytics Dashboard
- Score trends over time
- Issue distribution analysis (by severity and category)
- Performance metrics tracking
- Historical data comparison
- Customizable time ranges (7, 14, 30, 60, 90 days)

### 🏆 Competitor Analysis
- Track multiple competitors per project
- Side-by-side score comparisons
- Competitive rankings
- Historical competitor snapshots
- Manual and automated competitor audits

### 📈 Historical Data Tracking
- Audit snapshots for long-term analysis
- Score progression tracking
- Performance degradation detection
- Trend visualization

---

## Database Schema

### New Models

#### Competitor
Tracks competitor websites for each project.

```prisma
model Competitor {
  id              String              @id @default(cuid())
  projectId       String              @map("project_id")
  name            String
  domain          String
  isActive        Boolean             @default(true)
  lastAuditedAt   DateTime?
  createdAt       DateTime            @default(now())
  updatedAt       DateTime            @updatedAt
  
  project         Project             @relation(fields: [projectId], references: [id], onDelete: Cascade)
  snapshots       CompetitorSnapshot[]
  comparisons     CompetitorComparison[]
  
  @@unique([projectId, domain])
  @@index([projectId])
}
```

#### CompetitorSnapshot
Stores historical audit data for competitors.

```prisma
model CompetitorSnapshot {
  id                   String    @id @default(cuid())
  competitorId         String
  totalScore           Int
  technicalScore       Int
  onPageScore          Int
  structuredDataScore  Int
  performanceScore     Int
  localSeoScore        Int
  metadata             Json      @default("{}")
  capturedAt           DateTime  @default(now())
  
  competitor           Competitor @relation(fields: [competitorId], references: [id], onDelete: Cascade)
  
  @@index([competitorId])
  @@index([capturedAt])
}
```

#### Recommendation
AI-generated SEO recommendations for audits.

```prisma
model Recommendation {
  id              String                @id @default(cuid())
  auditId         String
  category        RecommendationCategory
  priority        RecommendationPriority
  title           String
  description     String                @db.Text
  impact          String                @db.Text
  effort          String
  estimatedValue  Int
  isImplemented   Boolean               @default(false)
  implementedAt   DateTime?
  metadata        Json                  @default("{}")
  createdAt       DateTime              @default(now())
  
  @@index([auditId])
  @@index([category])
  @@index([priority])
}
```

#### AuditSnapshot
Historical snapshots for trend analysis.

```prisma
model AuditSnapshot {
  id                   String    @id @default(cuid())
  auditId              String
  projectId            String
  totalScore           Int
  technicalScore       Int
  onPageScore          Int
  structuredDataScore  Int
  performanceScore     Int
  localSeoScore        Int
  issueCount           Int
  criticalIssues       Int
  warningIssues        Int
  infoIssues           Int
  metadata             Json      @default("{}")
  capturedAt           DateTime  @default(now())
  
  @@index([auditId])
  @@index([projectId])
  @@index([capturedAt])
}
```

---

## Backend APIs

### Analytics API (`/api/analytics`)

#### Get Trends
```http
GET /api/analytics/trends/:projectId?days=30
```

Returns score trends over time for a project.

**Response:**
```json
{
  "trends": [
    {
      "id": "audit_id",
      "url": "https://example.com",
      "totalScore": 85,
      "technicalScore": 90,
      "onPageScore": 80,
      "completedAt": "2025-01-15T10:00:00Z"
    }
  ],
  "statistics": {
    "avgScore": 82,
    "minScore": 75,
    "maxScore": 90,
    "scoreChange": 15,
    "scoreChangePercent": 20,
    "totalAudits": 10
  }
}
```

#### Get Issue Distribution
```http
GET /api/analytics/issues/:projectId
```

Returns issue distribution by severity and category.

**Response:**
```json
{
  "bySeverity": [
    { "severity": "CRITICAL", "count": 5 },
    { "severity": "WARNING", "count": 12 }
  ],
  "byCategory": [
    { "category": "TECHNICAL", "count": 8 },
    { "category": "PERFORMANCE", "count": 9 }
  ],
  "topIssues": [...]
}
```

#### Get Performance Metrics
```http
GET /api/analytics/performance/:projectId?limit=10
```

Returns performance metrics over time.

#### Create Audit Snapshot
```http
POST /api/analytics/snapshot/:auditId
```

Creates a historical snapshot of an audit.

---

### Recommendations API (`/api/recommendations`)

#### Generate Recommendations
```http
POST /api/recommendations/generate/:auditId
```

Generates AI-powered recommendations for an audit.

**Response:**
```json
{
  "recommendations": [
    {
      "id": "rec_id",
      "category": "QUICK_WIN",
      "priority": "HIGH",
      "title": "Optimize Page Performance",
      "description": "Your performance score is critically low...",
      "impact": "Improving performance can increase conversions by up to 20%",
      "effort": "Low",
      "estimatedValue": 85,
      "isImplemented": false,
      "metadata": {}
    }
  ],
  "generated": true
}
```

#### Get Recommendations
```http
GET /api/recommendations/:auditId
```

Retrieves recommendations for an audit.

#### Mark as Implemented
```http
PATCH /api/recommendations/:id/implement
```

Toggles the implementation status of a recommendation.

---

### Competitors API (`/api/competitors`)

#### Get Competitors
```http
GET /api/competitors/:projectId
```

Returns all competitors for a project.

**Response:**
```json
[
  {
    "id": "comp_id",
    "name": "Competitor Inc.",
    "domain": "competitor.com",
    "isActive": true,
    "lastAuditedAt": "2025-01-15T10:00:00Z",
    "snapshots": [...],
    "_count": { "snapshots": 5 }
  }
]
```

#### Add Competitor
```http
POST /api/competitors/:projectId
Content-Type: application/json

{
  "name": "Competitor Inc.",
  "domain": "competitor.com"
}
```

#### Delete Competitor
```http
DELETE /api/competitors/:id
```

#### Get Competitor Snapshots
```http
GET /api/competitors/:id/snapshots?limit=30
```

#### Create Competitor Snapshot
```http
POST /api/competitors/:id/snapshot
Content-Type: application/json

{
  "totalScore": 85,
  "technicalScore": 90,
  "onPageScore": 80,
  "structuredDataScore": 75,
  "performanceScore": 88,
  "localSeoScore": 82,
  "metadata": {}
}
```

#### Compare with Competitors
```http
GET /api/competitors/:projectId/compare
```

Returns a comparison of the project with its competitors.

**Response:**
```json
{
  "project": {
    "name": "My Website",
    "domain": "example.com",
    "scores": { "total": 85, ... },
    "lastUpdated": "2025-01-15T10:00:00Z"
  },
  "competitors": [
    {
      "id": "comp_id",
      "name": "Competitor Inc.",
      "domain": "competitor.com",
      "scores": { "total": 80, ... },
      "lastUpdated": "2025-01-14T10:00:00Z"
    }
  ],
  "rankings": [
    { "rank": 1, "name": "My Website", "totalScore": 85 },
    { "rank": 2, "name": "Competitor Inc.", "totalScore": 80 }
  ]
}
```

---

## Frontend Components

### Analytics Dashboard

**Location:** `apps/web/app/project/[id]/analytics/page.tsx`

**Features:**
- Score trends visualization
- Time range selection (7, 14, 30, 60, 90 days)
- Issue distribution charts
- Performance metrics over time
- Competitor comparison
- Add/remove competitors modal

**Usage:**
Navigate to a project and click the "Analytics" tab.

---

### Recommendations Component

**Location:** `apps/web/components/Recommendations.tsx`

**Features:**
- Automatic recommendation generation
- Priority-based grouping
- Expandable recommendation cards
- Implementation tracking
- Category icons and badges

**Usage:**
Integrated into the Audit Detail page as a "Recommendations" tab.

---

## Usage Guide

### Viewing Analytics

1. Navigate to your project's settings page
2. Click the "Analytics" tab
3. Select a time range (7, 14, 30, 60, or 90 days)
4. View trends, issue distribution, and performance metrics

### Generating Recommendations

1. View a completed audit
2. Click the "Recommendations" tab
3. Click "Generate Recommendations"
4. Review prioritized recommendations
5. Mark recommendations as implemented when completed

### Tracking Competitors

1. Go to Project → Analytics
2. Click "Add Competitor"
3. Enter competitor name and domain
4. Create snapshots manually or via API
5. View competitive rankings and comparisons

### Creating Audit Snapshots

Snapshots are created automatically after each audit completion. You can also create them manually via API:

```javascript
await analyticsApi.createSnapshot(auditId)
```

---

## Integration Examples

### React Component - Fetch Analytics Trends

```tsx
import { useQuery } from '@tanstack/react-query'
import { analyticsApi } from '@/lib/api'

function MyAnalytics({ projectId }: { projectId: string }) {
  const { data } = useQuery({
    queryKey: ['analytics-trends', projectId, 30],
    queryFn: async () => {
      const response = await analyticsApi.getTrends(projectId, 30)
      return response.data
    },
  })

  const trends = data?.trends || []
  const statistics = data?.statistics || {}

  return (
    <div>
      <h2>Analytics Trends</h2>
      <p>Average Score: {statistics.avgScore}</p>
      <p>Score Change: {statistics.scoreChangePercent}%</p>
      
      {trends.map((audit) => (
        <div key={audit.id}>
          <span>{audit.url}</span>
          <span>{audit.totalScore}/100</span>
        </div>
      ))}
    </div>
  )
}
```

### Generate Recommendations After Audit

```typescript
// In your audit completion handler
import { recommendationsApi } from '@/lib/api'

async function onAuditComplete(auditId: string) {
  try {
    const response = await recommendationsApi.generate(auditId)
    console.log(`Generated ${response.data.recommendations.length} recommendations`)
  } catch (error) {
    console.error('Failed to generate recommendations:', error)
  }
}
```

### Compare with Competitors

```tsx
import { competitorsApi } from '@/lib/api'

function CompetitorComparison({ projectId }: { projectId: string }) {
  const { data } = useQuery({
    queryKey: ['competitors-compare', projectId],
    queryFn: async () => {
      const response = await competitorsApi.compare(projectId)
      return response.data
    },
  })

  return (
    <div>
      <h2>Competitive Rankings</h2>
      {data?.rankings.map((site) => (
        <div key={site.name}>
          <span>#{site.rank}</span>
          <span>{site.name}</span>
          <span>{site.totalScore}/100</span>
        </div>
      ))}
    </div>
  )
}
```

---

## Best Practices

### Analytics
- Set up regular audit schedules to maintain consistent trend data
- Use appropriate time ranges for meaningful comparisons
- Monitor score changes to identify improvements or regressions

### Recommendations
- Generate recommendations after every completed audit
- Prioritize Critical and High priority recommendations
- Mark recommendations as implemented to track progress
- Use metadata field to store additional context

### Competitors
- Track 3-5 key competitors for meaningful comparison
- Update competitor snapshots regularly (weekly or monthly)
- Use the same domains consistently for accurate trend tracking
- Add context in metadata for manual snapshots

### Performance
- Create audit snapshots periodically for faster analytics queries
- Use indexed fields (projectId, capturedAt) for efficient filtering
- Implement caching for frequently accessed analytics data

---

## Troubleshooting

### No Recommendations Generated
- Ensure the audit is completed successfully
- Check that the audit has issues identified
- Verify backend logs for generation errors

### Competitor Comparison Not Working
- Ensure competitors have at least one snapshot
- Verify project has at least one completed audit
- Check that competitor domains are correctly formatted

### Slow Analytics Queries
- Limit the number of days queried (use pagination)
- Create audit snapshots for historical data
- Add database indexes if needed

---

## Future Enhancements

- **AI-Powered Insights:** Machine learning models for more intelligent recommendations
- **Automated Competitor Tracking:** Automatic periodic audits of competitors
- **Custom Analytics Reports:** PDF/Email reports generation
- **Benchmarking:** Industry-specific score benchmarks
- **Goal Tracking:** Set and track SEO improvement goals
- **Alerts:** Automated alerts for score drops or critical issues

---

## API Migration Notes

If upgrading from an earlier version:

1. Run the database migration:
```bash
npx prisma migrate deploy
```

2. Restart the API server to load new routes

3. Clear browser cache and restart frontend development server

4. Verify all new endpoints are accessible

---

## Support

For issues or questions about Analytics & Insights features:
- Review this documentation
- Check the API logs for errors
- Verify database migrations have been applied
- Ensure all environment variables are set correctly

---

**Phase 3: Analytics & Insights** - Version 1.0  
Last Updated: October 27, 2025


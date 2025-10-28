# Complete File Structure - SEO Audit Tool

```
seo-audit-tool/
│
├── 📄 Root Configuration Files
│   ├── package.json                    # Root workspace config
│   ├── tsconfig.json                   # Base TypeScript config
│   ├── .gitignore                      # Git ignore rules
│   ├── .dockerignore                   # Docker ignore rules
│   ├── docker-compose.yml              # Docker orchestration
│   ├── README.md                       # Main documentation
│   ├── QUICKSTART.md                   # Quick start guide
│   ├── PROJECT_SUMMARY.md              # Implementation summary
│   ├── FILE_STRUCTURE.md               # This file
│   └── seo-audit-tool-mvp.plan.md      # Original plan document
│
├── 🐳 docker/                          # Docker configurations
│   ├── Dockerfile.api                  # API server image
│   ├── Dockerfile.worker               # Worker service image
│   └── Dockerfile.web                  # Next.js frontend image
│
├── 🗄️ prisma/                          # Database schema & migrations
│   ├── schema.prisma                   # Prisma schema definition
│   └── seed.ts                         # Database seed script
│
├── 📦 packages/                        # Shared packages
│   │
│   ├── shared/                         # Shared types & utilities
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts
│   │       ├── types/
│   │       │   └── index.ts            # All TypeScript interfaces
│   │       └── utils/
│   │           ├── index.ts
│   │           ├── url-utils.ts        # URL normalization
│   │           └── score-calculator.ts # Scoring logic
│   │
│   └── audit-engine/                   # SEO audit engine
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           ├── index.ts
│           ├── crawler.ts              # Playwright web crawler
│           ├── rule-engine.ts          # Rule execution engine
│           └── rules/
│               ├── index.ts            # All rules export
│               ├── technical/          # Technical SEO rules (7)
│               │   ├── http-status.ts
│               │   ├── https.ts
│               │   ├── canonical.ts
│               │   ├── robots-txt.ts
│               │   ├── sitemap.ts
│               │   ├── security-headers.ts
│               │   └── mobile-friendly.ts
│               ├── onpage/             # On-page rules (7)
│               │   ├── title-tag.ts
│               │   ├── meta-description.ts
│               │   ├── h1-tag.ts
│               │   ├── word-count.ts
│               │   ├── image-alt-text.ts
│               │   ├── open-graph.ts
│               │   └── links.ts
│               ├── structured-data/    # Schema rules (5)
│               │   ├── jsonld.ts
│               │   ├── organization-schema.ts
│               │   ├── product-schema.ts
│               │   ├── article-schema.ts
│               │   └── local-business-schema.ts
│               ├── performance/        # Performance rules (3)
│               │   ├── load-time.ts
│               │   ├── page-size.ts
│               │   └── request-count.ts
│               └── local-seo/          # Local SEO rules (3)
│                   ├── nap-consistency.ts
│                   ├── google-maps.ts
│                   └── business-profile.ts
│
├── 🖥️ apps/                            # Applications
│   │
│   ├── api/                            # Backend API (Express)
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── server.ts               # Main Express server
│   │       ├── worker.ts               # BullMQ worker process
│   │       ├── middleware/
│   │       │   ├── auth.ts             # Authentication middleware
│   │       │   ├── error-handler.ts    # Global error handler
│   │       │   └── rate-limiter.ts     # Rate limiting
│   │       ├── routes/
│   │       │   ├── auth.ts             # Auth routes (register/login)
│   │       │   ├── projects.ts         # Project CRUD routes
│   │       │   ├── audits.ts           # Audit routes
│   │       │   └── admin.ts            # Admin routes
│   │       └── queue/
│   │           └── audit-queue.ts      # BullMQ queue setup
│   │
│   └── web/                            # Frontend (Next.js)
│       ├── package.json
│       ├── tsconfig.json
│       ├── next.config.js              # Next.js configuration
│       ├── tailwind.config.ts          # Tailwind CSS config
│       ├── postcss.config.js           # PostCSS config
│       ├── .eslintrc.json              # ESLint config
│       ├── next-env.d.ts               # Next.js types
│       ├── app/                        # Next.js App Router
│       │   ├── layout.tsx              # Root layout
│       │   ├── page.tsx                # Landing page
│       │   ├── providers.tsx           # React Query provider
│       │   ├── globals.css             # Global styles
│       │   ├── auth/
│       │   │   ├── login/
│       │   │   │   └── page.tsx        # Login page
│       │   │   └── register/
│       │   │       └── page.tsx        # Registration page
│       │   ├── dashboard/
│       │   │   └── page.tsx            # User dashboard
│       │   └── audit/
│       │       └── [id]/
│       │           └── page.tsx        # Audit results page
│       └── lib/
│           ├── api.ts                  # API client setup
│           └── utils.ts                # Utility functions
│
└── 📊 Generated/Runtime Files (not in repo)
    ├── node_modules/                   # Dependencies (gitignored)
    ├── .next/                          # Next.js build output
    ├── dist/                           # TypeScript build output
    └── prisma/migrations/              # Database migrations

```

## File Count Summary

- **Configuration Files**: 8
- **Docker Files**: 3
- **Database Files**: 2
- **Shared Package Files**: 6
- **Audit Engine Files**: 29 (1 crawler + 28 rules + engine)
- **Backend API Files**: 8 (server + 7 modules)
- **Frontend Files**: 10 (6 pages + 4 config/lib)

**Total Project Files**: ~70 files

## Key Directories

### `/apps/api/`
Express.js backend with TypeScript. Handles authentication, project management, audit creation, and admin functions.

### `/apps/web/`
Next.js 14 frontend with App Router. Premium dark-themed UI with real-time updates.

### `/packages/audit-engine/`
Core SEO analysis engine. Contains the Playwright crawler and 28 audit rules organized by category.

### `/packages/shared/`
Shared TypeScript types and utilities used across frontend and backend.

### `/prisma/`
Database schema and migrations. PostgreSQL database with 6 tables.

### `/docker/`
Dockerfiles for containerizing each service (API, Worker, Web).

## Technology Stack by Layer

**Frontend:**
- Next.js 14, React 18, TypeScript
- Tailwind CSS, Lucide Icons
- TanStack Query, Axios
- Framer Motion (animations)

**Backend:**
- Express.js, TypeScript
- Prisma ORM, PostgreSQL
- BullMQ, Redis
- JWT, bcryptjs, Zod

**Crawler:**
- Playwright (Chromium)
- Cheerio (HTML parsing)
- Axios (HTTP requests)

**Infrastructure:**
- Docker, Docker Compose
- npm Workspaces (Monorepo)

## Environment Configuration

**Required Environment Variables:**
- `DATABASE_URL` - PostgreSQL connection
- `REDIS_URL` - Redis connection
- `JWT_SECRET` - Authentication secret
- `NEXT_PUBLIC_API_URL` - API URL for frontend

**Optional:**
- `PSI_API_KEY` - Google PageSpeed Insights API
- `NODE_ENV` - Environment mode

## Ports

- **3000** - Next.js frontend
- **3001** - Express API
- **5432** - PostgreSQL
- **6379** - Redis

---

**Last Updated**: October 2024


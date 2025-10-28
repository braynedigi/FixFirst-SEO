# SEO Audit Tool - Full MVP

A comprehensive web-based SEO audit tool that analyzes websites and generates detailed reports with actionable insights across Technical, On-Page, Performance, Structured Data, and Local SEO.

## 🚀 Features

- **Technical SEO Analysis**: HTTPS enforcement, canonical tags, robots.txt, XML sitemap, security headers, mobile-friendliness
- **On-Page Optimization**: Title tags, meta descriptions, heading structure, content quality, image alt text, Open Graph tags
- **Structured Data**: JSON-LD detection and validation for Organization, Product, Article, and LocalBusiness schemas
- **Performance Metrics**: Page load time, page size, request count, Core Web Vitals
- **Local SEO**: NAP consistency, Google Maps integration, business profile links
- **Premium UI**: Dark theme, smooth animations, responsive design, real-time updates
- **User Management**: Authentication, role-based access, plan tiers (Free, Pro, Agency)
- **Rate Limiting**: Redis-based rate limiting per user plan

## 📋 Tech Stack

### Frontend
- **Next.js 14** (App Router)
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **TanStack Query** for state management
- **Framer Motion** for animations
- **Recharts** for data visualization
- **Lucide React** for icons

### Backend
- **Node.js** with Express
- **TypeScript**
- **BullMQ** for job queue management
- **Redis** for caching and rate limiting
- **PostgreSQL** with Prisma ORM

### Crawler & Analysis
- **Playwright** for headless browser automation
- **Cheerio** for HTML parsing
- **Axios** for HTTP requests
- **Custom rule engine** with 28+ SEO checks

## 🏗️ Project Structure

```
/
├── apps/
│   ├── api/              # Express backend
│   │   ├── src/
│   │   │   ├── server.ts
│   │   │   ├── worker.ts
│   │   │   ├── routes/
│   │   │   ├── middleware/
│   │   │   └── queue/
│   │   └── package.json
│   └── web/              # Next.js frontend
│       ├── app/
│       ├── components/
│       ├── lib/
│       └── package.json
├── packages/
│   ├── shared/           # Shared types & utils
│   └── audit-engine/     # Crawler & rules
│       ├── src/
│       │   ├── crawler.ts
│       │   ├── rule-engine.ts
│       │   └── rules/
│       │       ├── technical/
│       │       ├── onpage/
│       │       ├── structured-data/
│       │       ├── performance/
│       │       └── local-seo/
│       └── package.json
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── docker/
│   ├── Dockerfile.api
│   ├── Dockerfile.worker
│   └── Dockerfile.web
├── docker-compose.yml
└── package.json
```

## 🐳 Getting Started with Docker

### Prerequisites
- Docker and Docker Compose installed
- Node.js 20+ (for local development)

### Installation

1. **Clone the repository**
```bash
git clone <repo-url>
cd seo-audit-tool
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
Create a `.env` file in the root directory:
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/seo_audit_tool
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key-change-in-production
PSI_API_KEY=your-google-psi-api-key
NEXT_PUBLIC_API_URL=http://localhost:3001
```

4. **Start Docker services**
```bash
npm run docker:up
```

This will start:
- PostgreSQL (port 5432)
- Redis (port 6379)
- API server (port 3001)
- Worker service
- Next.js web app (port 3000)

5. **Run database migrations**
```bash
cd apps/api
npx prisma migrate dev
npx prisma db seed
```

6. **Access the application**
- Frontend: http://localhost:3000
- API: http://localhost:3001
- API Health: http://localhost:3001/health

### Default Admin Credentials
- Email: `admin@seoaudit.com`
- Password: `password123`

### Test User
- Email: `bro@example.com`
- Password: `test123`

## 📊 Database Schema

### Core Tables
- **users**: User accounts with authentication
- **projects**: Website projects per user
- **audits**: Audit records with scores
- **pages**: Crawled pages from audits
- **issues**: Detected SEO issues
- **rules**: Configurable audit rules

### Plan Tiers
- **FREE**: 1 audit per day
- **PRO**: 25 audits per month + PDF export
- **AGENCY**: 200 audits per month + white-label

## 🔧 Development

### Local Development (without Docker)

1. **Start PostgreSQL and Redis**
```bash
# Use your local instances or Docker containers
docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres:16-alpine
docker run -d -p 6379:6379 redis:7-alpine
```

2. **Run migrations**
```bash
cd apps/api
npx prisma migrate dev
npx prisma db seed
```

3. **Start the API server**
```bash
cd apps/api
npm run dev
```

4. **Start the worker (in another terminal)**
```bash
cd apps/api
npm run worker
```

5. **Start the web app (in another terminal)**
```bash
cd apps/web
npm run dev
```

## 🧪 SEO Rules

### Technical (35 points)
- ✓ HTTP Status Check (5pts)
- ✓ HTTPS Enforcement (5pts)
- ✓ Canonical Tags (4pts)
- ✓ Robots.txt (3pts)
- ✓ XML Sitemap (3pts)
- ✓ Security Headers (5pts)
- ✓ Mobile Friendly (5pts)
- ✓ Core Web Vitals (5pts)

### On-Page (25 points)
- ✓ Title Tag (5pts)
- ✓ Meta Description (4pts)
- ✓ H1 Tag (4pts)
- ✓ Content Length (3pts)
- ✓ Image Alt Text (3pts)
- ✓ Open Graph Tags (3pts)
- ✓ Internal/External Links (3pts)

### Structured Data (20 points)
- ✓ JSON-LD Detection (5pts)
- ✓ Organization Schema (4pts)
- ✓ Product Schema (4pts)
- ✓ Article Schema (4pts)
- ✓ LocalBusiness Schema (3pts)

### Performance (15 points)
- ✓ Page Load Time (5pts)
- ✓ Page Size (3pts)
- ✓ Request Count (3pts)
- ✓ PSI Metrics (4pts)

### Local SEO (5 points)
- ✓ NAP Consistency (2pts)
- ✓ Google Maps Embed (2pts)
- ✓ Business Profile Link (1pt)

## 🎨 UI Features

- **Dark Theme**: Optimized for reduced eye strain
- **Animated Transitions**: Smooth page and component transitions
- **Real-time Updates**: Live audit progress with polling
- **Responsive Design**: Mobile-first approach
- **Command Palette**: Quick navigation (Cmd+K)
- **Toast Notifications**: User feedback system
- **Loading States**: Skeleton loaders and spinners
- **Score Visualization**: Color-coded grades and charts

## 🚀 Deployment

### VPS Deployment (Production)

1. **Build Docker images**
```bash
docker build -f docker/Dockerfile.api -t seo-audit-api .
docker build -f docker/Dockerfile.worker -t seo-audit-worker .
docker build -f docker/Dockerfile.web -t seo-audit-web .
```

2. **Set production environment variables**
```env
NODE_ENV=production
DATABASE_URL=<your-production-db>
REDIS_URL=<your-production-redis>
JWT_SECRET=<strong-secret>
PSI_API_KEY=<your-api-key>
```

3. **Run migrations**
```bash
npx prisma migrate deploy
```

4. **Start services**
```bash
docker run -d -p 3001:3001 seo-audit-api
docker run -d seo-audit-worker
docker run -d -p 3000:3000 seo-audit-web
```

### Nginx Reverse Proxy

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
    }

    location /api {
        proxy_pass http://localhost:3001;
    }
}
```

## 📝 API Endpoints

### Authentication
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Projects
- `GET /api/projects` - List projects
- `POST /api/projects` - Create project
- `GET /api/projects/:id` - Get project
- `DELETE /api/projects/:id` - Delete project

### Audits
- `GET /api/audits` - List audits
- `POST /api/audits` - Create audit
- `GET /api/audits/:id` - Get audit results
- `DELETE /api/audits/:id` - Delete audit

### Admin (Admin role required)
- `GET /api/admin/rules` - List all rules
- `PATCH /api/admin/rules/:id` - Update rule
- `GET /api/admin/users` - List users
- `PATCH /api/admin/users/:id/plan` - Update user plan
- `GET /api/admin/stats` - System statistics

## 🔒 Security

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting per IP and user
- CORS protection
- Input validation with Zod
- SQL injection protection (Prisma)
- XSS protection

## 📈 Future Enhancements

- [ ] PDF export with branding
- [ ] Google PageSpeed Insights API integration
- [ ] Weekly automated re-audits
- [ ] Keyword ranking tracking
- [ ] Email report delivery
- [ ] White-label reports for agencies
- [ ] Multi-domain dashboard
- [ ] AI-powered fix recommendations
- [ ] Integration with SEMrush/Ahrefs
- [ ] Historical trend analysis

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

MIT License - see LICENSE file for details

## 👨‍💻 Author

Built by iameyaw (braynedigitech@gmail.com)

## 🏢 Company

**Brayne Smart Solutions Corp.**
Providing innovative digital solutions for modern businesses.

## 🙏 Acknowledgments

- Google PageSpeed Insights API
- Playwright for browser automation
- The open-source community

---

© 2025 FixFirst SEO. Powered By Brayne Smart Solutions Corp.

**Need help?** Open an issue or contact support.


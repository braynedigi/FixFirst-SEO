# Quick Start Guide - SEO Audit Tool

Get your SEO Audit Tool up and running in 5 minutes!

## Prerequisites

- **Docker** installed and running
- **Node.js 20+** (for local development)
- **Git** for cloning the repository

## 🚀 Quick Start (Recommended)

### Step 1: Clone and Install

```bash
# Clone the repository
git clone <your-repo-url>
cd seo-audit-tool

# Install all dependencies
npm install
```

### Step 2: Environment Setup

Copy the environment template:
```bash
cp .env.example .env
```

The default values in `.env` are already configured for Docker development.

### Step 3: Start Docker Services

```bash
# Start PostgreSQL, Redis, API, Worker, and Web
npm run docker:up

# Check logs (optional)
npm run docker:logs
```

This command will start:
- ✅ PostgreSQL database on port 5432
- ✅ Redis on port 6379
- ✅ API server on port 3001
- ✅ BullMQ worker (background jobs)
- ✅ Next.js web app on port 3000

### Step 4: Initialize Database

Wait for services to start (about 30 seconds), then run:

```bash
# Navigate to API directory
cd apps/api

# Run database migrations
npx prisma migrate dev --name init

# Seed initial data (users and rules)
npx prisma db seed

# Go back to root
cd ../..
```

### Step 5: Access the Application

Open your browser:
- **Frontend**: http://localhost:3000
- **API Health**: http://localhost:3001/health

## 🎯 Test It Out

### Default Accounts

**Admin Account:**
- Email: `admin@seoaudit.com`
- Password: `admin123`

**Test User:**
- Email: `test@example.com`
- Password: `test123`

### Run Your First Audit

1. Go to http://localhost:3000
2. Click "Log In" and use the test user credentials
3. Click "New Audit" or enter a URL on the homepage
4. Enter any public website URL (e.g., `https://example.com`)
5. Watch the audit progress in real-time!

## 🛠️ Development Commands

```bash
# Stop all services
npm run docker:down

# Restart services
npm run docker:down && npm run docker:up

# View logs from all services
npm run docker:logs

# View specific service logs
docker-compose logs -f web    # Frontend
docker-compose logs -f api    # Backend
docker-compose logs -f worker # Job processor

# Access PostgreSQL
docker exec -it seo-audit-postgres psql -U postgres -d seo_audit_tool

# Access Redis CLI
docker exec -it seo-audit-redis redis-cli
```

## 🐛 Troubleshooting

### Port Already in Use

If you get port conflicts:

```bash
# Stop Docker services
npm run docker:down

# Check what's using the ports
# On Windows PowerShell:
netstat -ano | findstr :3000
netstat -ano | findstr :3001
netstat -ano | findstr :5432
netstat -ano | findstr :6379

# Kill the process or change ports in docker-compose.yml
```

### Database Connection Issues

```bash
# Restart PostgreSQL
docker-compose restart postgres

# Check if PostgreSQL is healthy
docker-compose ps
```

### Worker Not Processing Jobs

```bash
# Check worker logs
docker-compose logs -f worker

# Restart worker
docker-compose restart worker
```

### "Module not found" Errors

```bash
# Rebuild dependencies in Docker
npm run docker:down
docker-compose build --no-cache
npm run docker:up
```

## 📂 Project Structure

```
seo-audit-tool/
├── apps/
│   ├── api/          → Backend API (Express)
│   └── web/          → Frontend (Next.js)
├── packages/
│   ├── shared/       → Shared types
│   └── audit-engine/ → SEO audit logic
├── prisma/           → Database schema
├── docker/           → Dockerfiles
└── docker-compose.yml
```

## 🧪 Running Tests

```bash
# Run all tests (when implemented)
npm test

# Run API tests
cd apps/api && npm test

# Run frontend tests
cd apps/web && npm test
```

## 🚢 Production Deployment

See [README.md](./README.md) for detailed deployment instructions.

Quick production checklist:
- [ ] Change all secrets in `.env`
- [ ] Use production database (not localhost)
- [ ] Use production Redis instance
- [ ] Set `NODE_ENV=production`
- [ ] Enable HTTPS
- [ ] Set up backups
- [ ] Configure monitoring

## 💡 Tips

1. **First Time Setup**: The initial Docker build may take 5-10 minutes
2. **Hot Reload**: The web app and API have hot reload enabled
3. **Database GUI**: Use Prisma Studio to view data: `cd apps/api && npx prisma studio`
4. **API Docs**: Visit http://localhost:3001/health to check API status
5. **Admin Panel**: Access admin features by logging in with the admin account

## 🎓 Next Steps

- Read the [full documentation](./README.md)
- Explore the audit rules in `packages/audit-engine/src/rules/`
- Customize the UI in `apps/web/app/`
- Add your Google PageSpeed Insights API key for performance metrics
- Configure white-label PDF exports (coming soon)

## 🆘 Need Help?

- Check the [README.md](./README.md) for detailed information
- Review Docker logs: `npm run docker:logs`
- Open an issue on GitHub
- Contact: braynedigitech@gmail.com

---

**Happy auditing! 🚀**


# 🚀 Deployment Checklist for VPS

## ✅ Pre-Deployment Tasks

### 1. Code Quality & Testing
- [ ] Run all linters and fix errors
- [ ] Test all Phase 2 features (Team Collaboration)
- [ ] Test all Phase 3 features (Analytics & Insights)
- [ ] Verify all API endpoints work correctly
- [ ] Test authentication and authorization
- [ ] Test WebSocket connections
- [ ] Test background worker jobs

### 2. Environment Configuration
- [ ] Create `.env.example` files for all apps
- [ ] Document all required environment variables
- [ ] Set up production environment variables on VPS
- [ ] Configure database connection strings
- [ ] Set up Redis connection
- [ ] Configure email service (SMTP)
- [ ] Set up Google PageSpeed Insights API key
- [ ] **Set up OpenAI API key** (for AI-powered recommendations)
  - Get key from: https://platform.openai.com/api-keys
  - Add at least $10 credits to account
  - Set spending limits ($20-50/month recommended)
  - Add `OPENAI_API_KEY` to environment variables

### 3. Database
- [ ] Run all Prisma migrations
- [ ] Seed initial data if needed
- [ ] Create database backup strategy
- [ ] Set up automated backups

### 4. Docker Configuration
- [ ] Update Dockerfiles for production
- [ ] Optimize Docker images
- [ ] Configure health checks
- [ ] Set up Docker volumes for persistence
- [ ] Test Docker builds locally

### 5. Security
- [ ] Set strong JWT_SECRET
- [ ] Configure CORS properly
- [ ] Set up rate limiting
- [ ] Configure helmet.js for security headers
- [ ] Review and secure all API endpoints
- [ ] Set up SSL/TLS certificates (Let's Encrypt)
- [ ] Configure firewall rules

### 6. Performance Optimization
- [ ] Enable production mode for Next.js
- [ ] Configure CDN for static assets
- [ ] Set up caching strategies
- [ ] Optimize database queries
- [ ] Configure connection pooling

### 7. Monitoring & Logging
- [ ] Set up error tracking (optional: Sentry)
- [ ] Configure application logging
- [ ] Set up uptime monitoring
- [ ] Configure alerts for critical errors
- [ ] Set up database monitoring

### 8. Documentation
- [ ] Update README.md with deployment instructions
- [ ] Document API endpoints
- [ ] Create user guide for new features
- [ ] Document troubleshooting steps
- [ ] Create backup/restore procedures

### 9. Git & Repository
- [ ] Review all commits
- [ ] Update .gitignore
- [ ] Remove sensitive data
- [ ] Create proper git tags/releases
- [ ] Write clear commit messages

### 10. VPS Setup
- [ ] Install Docker on VPS
- [ ] Configure firewall (ufw)
- [ ] Set up reverse proxy (Nginx)
- [ ] Configure domain and DNS
- [ ] Set up SSL certificates
- [ ] Create deployment scripts

---

## 📋 Current Status

### ✅ Completed
- [x] Phase 2: Team Collaboration fully implemented and tested
- [x] Phase 3: Analytics & Insights implemented
- [x] Database schema updated with all new models
- [x] Backend API routes created (analytics, recommendations, competitors)
- [x] Frontend components created
- [x] Project Settings implemented
- [x] Comprehensive documentation created

### ⚠️ To Do (Critical Before Deployment)
1. **Missing TrendChart Component** - Need to verify implementation
2. **Test Phase 3 Features** - Thoroughly test analytics, recommendations, competitors
3. **Create `.env.example` files** - Document all environment variables
4. **Update Dockerfiles** - Ensure they work for VPS (no Docker Compose)
5. **Create Deployment Script** - Automate VPS deployment
6. **Set up Nginx Configuration** - Reverse proxy for API and frontend
7. **SSL Certificate Setup** - Let's Encrypt configuration
8. **Database Migration Script** - For VPS
9. **Health Check Endpoints** - For monitoring
10. **Production Build Test** - Test production builds locally

---

## 🐳 VPS Deployment Architecture

Since your VPS doesn't support Docker Compose, you'll need:

```
VPS Structure:
├── Nginx (Reverse Proxy)
│   ├── Port 80 → 443 (SSL redirect)
│   ├── Port 443 → Frontend (localhost:3005)
│   └── /api → Backend (localhost:3001)
├── PostgreSQL Database
├── Redis
├── Docker Containers
│   ├── API Server (port 3001)
│   ├── Worker (background jobs)
│   └── Frontend (port 3005)
└── Let's Encrypt SSL
```

---

## 🔧 Quick Start Commands

### Test Production Build Locally
```bash
# Build API
cd apps/api
npm run build

# Build Frontend
cd apps/web
npm run build
npm start

# Test Worker
cd apps/worker
npm run build
```

### Push to GitHub
```bash
git add .
git commit -m "feat: Phase 3 Analytics & Insights complete"
git push origin main
```

### Deploy to VPS (after setup)
```bash
# SSH into VPS
ssh user@your-vps-ip

# Pull latest code
git pull origin main

# Rebuild and restart containers
./deploy.sh
```

---

## 📝 Next Steps

1. Run the checklist above
2. Test all features thoroughly
3. Create deployment scripts
4. Update documentation
5. Push to GitHub
6. Deploy to VPS

---

## ⚠️ Important Notes

- Always backup database before deployment
- Test in staging environment first if possible
- Keep environment variables secure
- Monitor logs during deployment
- Have rollback plan ready


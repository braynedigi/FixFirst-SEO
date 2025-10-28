# 🚀 Quick Start - View in Browser

Your SEO Audit Tool is now set up! Follow these steps to view it in your browser.

## ✅ What's Already Done

1. ✅ Dependencies installed
2. ✅ PostgreSQL running on port 5433
3. ✅ Redis running on port 6380
4. ✅ Database schema created
5. ✅ Test data seeded
6. ✅ Frontend and API servers starting

## 🌐 Access the Application

The services are starting in the background. Wait about 30 seconds, then:

### **Open in Browser:**
```
http://localhost:3002
```

## 👤 Test Login Credentials

**Regular User:**
- Email: `test@example.com`
- Password: `test123`

**Admin User:**
- Email: `admin@seoaudit.com`
- Password: `admin123`

## 🔄 Manual Startup (If Needed)

If the services aren't running, open **3 separate PowerShell windows**:

### Window 1: Databases
```powershell
cd "C:\Users\Lenovo\Documents\Software Development\October 2025\FixFirst SEO"
docker-compose up postgres redis
```

### Window 2: API Server
```powershell
cd "C:\Users\Lenovo\Documents\Software Development\October 2025\FixFirst SEO\apps\api"
$env:DATABASE_URL="postgresql://postgres:postgres@localhost:5433/seo_audit_tool"
$env:REDIS_URL="redis://localhost:6380"
$env:JWT_SECRET="dev-secret"
$env:PORT="3001"
npm run dev
```

### Window 3: Frontend
```powershell
cd "C:\Users\Lenovo\Documents\Software Development\October 2025\FixFirst SEO\apps\web"
$env:NEXT_PUBLIC_API_URL="http://localhost:3001"
npm run dev
```

## 🎯 Quick Test

1. Go to http://localhost:3002
2. Click "Log In"
3. Use: `test@example.com` / `test123`
4. Click "New Audit"
5. Enter any URL (e.g., `https://example.com`)
6. Click "Start Audit"
7. Watch the real-time progress!

## 🛠️ API Endpoints

- **Frontend:** http://localhost:3002
- **API Health:** http://localhost:3001/health
- **API Base:** http://localhost:3001/api

## 📊 What You Can Do

### As a User:
✅ Register/Login
✅ Create projects
✅ Run SEO audits on any website
✅ View detailed audit results with 28+ checks
✅ See real-time progress
✅ View audit history

### As an Admin:
✅ Manage audit rules
✅ View all system audits
✅ Manage users and plan tiers
✅ View system statistics

## 🎨 Features to Try

1. **Run Your First Audit:**
   - Enter your website URL
   - Watch the real-time crawler
   - See 28 SEO checks
   - Get scored 0-100

2. **Explore Categories:**
   - Technical SEO (35 pts)
   - On-Page (25 pts)
   - Structured Data (20 pts)
   - Performance (15 pts)
   - Local SEO (5 pts)

3. **Check Issue Details:**
   - Click on any issue
   - Read "How to Fix" recommendations
   - See severity levels (Critical/Warning/Info)

## 🐛 Troubleshooting

### Services Not Starting?
```powershell
# Check what's running
docker ps
netstat -ano | findstr ":3001 :3002 :5433 :6380"

# Restart Docker services
docker-compose down
docker-compose up -d postgres redis
```

### Port Conflicts?
Edit `docker-compose.yml` and change the ports:
- PostgreSQL: Change `5433:5432` to `5434:5432`
- Redis: Change `6380:6379` to `6381:6379`
- Web: Change `3002:3000` to `3003:3000`

### Database Connection Error?
```powershell
# Recreate database
docker-compose down -v
docker-compose up -d postgres redis
$env:DATABASE_URL="postgresql://postgres:postgres@localhost:5433/seo_audit_tool"
npx prisma migrate dev --name init
npx tsx prisma/seed.ts
```

## 🔍 Check Logs

```powershell
# Docker logs
docker-compose logs -f postgres
docker-compose logs -f redis

# Or check the terminal windows where you started the services
```

## 🎉 You're All Set!

Your SEO Audit Tool is running with:
- ✅ Premium dark-themed UI
- ✅ 28 audit rules
- ✅ Real-time progress tracking
- ✅ Full authentication system
- ✅ Complete database setup

**Next Steps:**
1. Open http://localhost:3002 in your browser
2. Log in with test credentials
3. Run your first audit!

---

**Need help?** Check:
- `README.md` - Full documentation
- `QUICKSTART.md` - Setup guide
- `PROJECT_SUMMARY.md` - Feature list


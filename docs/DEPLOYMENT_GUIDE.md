# 🚀 Production Deployment Guide (Without Docker Compose)

This guide will help you deploy the FixFirst SEO application on a VPS using individual Dockerfiles.

## 📋 Prerequisites

- VPS with Docker installed
- PostgreSQL database (can be on the same VPS or external)
- Redis server (can be on the same VPS or external)
- Domain name (optional but recommended)
- SSL certificate (recommended for production)

---

## 🗄️ Step 1: Setup Database & Redis

### Option A: Install on VPS

```bash
# Install PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib -y

# Install Redis
sudo apt install redis-server -y

# Create database
sudo -u postgres psql
CREATE DATABASE seo_audit;
CREATE USER seouser WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE seo_audit TO seouser;
\q
```

### Option B: Use Managed Services
- PostgreSQL: DigitalOcean, AWS RDS, Supabase, etc.
- Redis: Redis Cloud, AWS ElastiCache, etc.

---

## 📦 Step 2: Prepare Your VPS

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker (if not installed)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Create application directory
mkdir -p ~/fixfirst-seo
cd ~/fixfirst-seo
```

---

## 🔧 Step 3: Clone & Configure

```bash
# Clone repository
git clone https://github.com/braynedigi/FixFirst-SEO.git .

# Create environment files
cat > apps/api/.env.production << EOF
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://seouser:your_secure_password@localhost:5432/seo_audit?schema=public
REDIS_URL=redis://localhost:6379
SOCKET_URL=http://localhost:3001
FRONTEND_URL=https://yourdomain.com
PSI_API_KEY=your_psi_api_key
OPENAI_API_KEY=your_openai_api_key
JWT_SECRET=$(openssl rand -base64 32)
SESSION_SECRET=$(openssl rand -base64 32)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM=noreply@yourdomain.com
EOF

cat > apps/web/.env.production << EOF
NEXT_PUBLIC_API_URL=https://yourdomain.com/api
NODE_ENV=production
EOF
```

---

## 🏗️ Step 4: Build Docker Images

```bash
# Build API image
docker build -f apps/api/Dockerfile -t fixfirst-api:latest .

# Build Worker image
docker build -f apps/worker/Dockerfile -t fixfirst-worker:latest .

# Build Web image
docker build -f apps/web/Dockerfile -t fixfirst-web:latest .
```

---

## 🗄️ Step 5: Run Database Migrations

```bash
# Run migrations
docker run --rm \
  --env-file apps/api/.env.production \
  --network host \
  fixfirst-api:latest \
  npx prisma migrate deploy

# (Optional) Seed database
docker run --rm \
  --env-file apps/api/.env.production \
  --network host \
  fixfirst-api:latest \
  npx prisma db seed
```

---

## 🚀 Step 6: Start Services

### Start API Server

```bash
docker run -d \
  --name fixfirst-api \
  --restart unless-stopped \
  --env-file apps/api/.env.production \
  --network host \
  -p 3001:3001 \
  fixfirst-api:latest
```

### Start Worker

```bash
docker run -d \
  --name fixfirst-worker \
  --restart unless-stopped \
  --env-file apps/api/.env.production \
  --network host \
  fixfirst-worker:latest
```

### Start Web Frontend

```bash
docker run -d \
  --name fixfirst-web \
  --restart unless-stopped \
  --env-file apps/web/.env.production \
  --network host \
  -p 3005:3005 \
  fixfirst-web:latest
```

---

## 🔒 Step 7: Setup Nginx Reverse Proxy (Recommended)

```bash
# Install Nginx
sudo apt install nginx -y

# Create Nginx configuration
sudo nano /etc/nginx/sites-available/fixfirst
```

Add this configuration:

```nginx
# Frontend
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Frontend
    location / {
        proxy_pass http://localhost:3005;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket
    location /socket.io {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/fixfirst /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 🔐 Step 8: Setup SSL with Let's Encrypt

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal is configured automatically
```

---

## 📊 Step 9: Verify Deployment

```bash
# Check running containers
docker ps

# Check API logs
docker logs fixfirst-api

# Check Worker logs
docker logs fixfirst-worker

# Check Web logs
docker logs fixfirst-web

# Test API endpoint
curl https://yourdomain.com/api/health

# Access your application
# Visit: https://yourdomain.com
```

---

## 🔄 Step 10: Update Deployment

```bash
# Pull latest changes
cd ~/fixfirst-seo
git pull origin main

# Rebuild images
docker build -f apps/api/Dockerfile -t fixfirst-api:latest .
docker build -f apps/worker/Dockerfile -t fixfirst-worker:latest .
docker build -f apps/web/Dockerfile -t fixfirst-web:latest .

# Run migrations (if any)
docker run --rm \
  --env-file apps/api/.env.production \
  --network host \
  fixfirst-api:latest \
  npx prisma migrate deploy

# Stop old containers
docker stop fixfirst-api fixfirst-worker fixfirst-web
docker rm fixfirst-api fixfirst-worker fixfirst-web

# Start new containers (repeat Step 6)
```

---

## 🛠️ Useful Commands

### View Logs
```bash
# API logs
docker logs -f fixfirst-api

# Worker logs
docker logs -f fixfirst-worker

# Web logs
docker logs -f fixfirst-web
```

### Restart Services
```bash
docker restart fixfirst-api
docker restart fixfirst-worker
docker restart fixfirst-web
```

### Stop Services
```bash
docker stop fixfirst-api fixfirst-worker fixfirst-web
```

### Remove Containers
```bash
docker rm -f fixfirst-api fixfirst-worker fixfirst-web
```

### Check Resource Usage
```bash
docker stats
```

---

## 🚨 Troubleshooting

### API won't start
```bash
# Check logs
docker logs fixfirst-api

# Verify database connection
docker run --rm --env-file apps/api/.env.production fixfirst-api:latest npx prisma db pull

# Check if port is in use
sudo lsof -i :3001
```

### Worker not processing jobs
```bash
# Check logs
docker logs fixfirst-worker

# Verify Redis connection
redis-cli ping

# Check worker is running
docker ps | grep worker
```

### Web page not loading
```bash
# Check logs
docker logs fixfirst-web

# Verify API URL
cat apps/web/.env.production

# Check Nginx configuration
sudo nginx -t
```

---

## 🔧 Environment Variables Reference

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/db` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `PSI_API_KEY` | Google PageSpeed Insights API key | `AIza...` |
| `JWT_SECRET` | Secret for JWT tokens | Generate with `openssl rand -base64 32` |
| `FRONTEND_URL` | Your domain URL | `https://yourdomain.com` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENAI_API_KEY` | OpenAI API key for AI recommendations | Not set |
| `SMTP_HOST` | Email server hostname | Not set |
| `SMTP_USER` | Email username | Not set |
| `SMTP_PASS` | Email password | Not set |

---

## 📈 Performance Optimization

### Enable Gzip in Nginx
Add to your Nginx config:
```nginx
gzip on;
gzip_vary on;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
```

### Set up Caching
```nginx
location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

---

## 🔐 Security Checklist

- [ ] SSL certificate installed and auto-renewing
- [ ] Firewall configured (UFW or iptables)
- [ ] Database has strong password
- [ ] JWT_SECRET and SESSION_SECRET are random and secure
- [ ] Environment variables are not in git
- [ ] SMTP credentials are secure
- [ ] Regular backups configured
- [ ] Monitoring and alerting setup

---

## 📞 Support

If you encounter issues:
1. Check the logs first
2. Review environment variables
3. Verify database and Redis connectivity
4. Check firewall rules
5. Review Nginx configuration

---

## ✅ Quick Deployment Summary

```bash
# 1. Setup VPS with Docker, PostgreSQL, Redis
# 2. Clone repository
git clone https://github.com/braynedigi/FixFirst-SEO.git
cd FixFirst-SEO

# 3. Configure environment
# Create .env.production files

# 4. Build images
docker build -f apps/api/Dockerfile -t fixfirst-api:latest .
docker build -f apps/worker/Dockerfile -t fixfirst-worker:latest .
docker build -f apps/web/Dockerfile -t fixfirst-web:latest .

# 5. Run migrations
docker run --rm --env-file apps/api/.env.production --network host fixfirst-api:latest npx prisma migrate deploy

# 6. Start services
docker run -d --name fixfirst-api --restart unless-stopped --env-file apps/api/.env.production --network host -p 3001:3001 fixfirst-api:latest
docker run -d --name fixfirst-worker --restart unless-stopped --env-file apps/api/.env.production --network host fixfirst-worker:latest
docker run -d --name fixfirst-web --restart unless-stopped --env-file apps/web/.env.production --network host -p 3005:3005 fixfirst-web:latest

# 7. Setup Nginx + SSL
# Configure reverse proxy and Let's Encrypt

# Done! 🎉
```


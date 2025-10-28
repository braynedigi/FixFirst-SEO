# ⚡ Quick Deployment Guide

Deploy FixFirst SEO on your VPS in under 10 minutes!

## 📋 Prerequisites

- VPS with Ubuntu 20.04+ or Debian 10+
- Docker installed
- PostgreSQL and Redis (can be on the same VPS or external)
- Domain name (optional)
- At least 2GB RAM recommended

---

## 🚀 One-Command Deployment

```bash
# Clone repository
git clone https://github.com/braynedigi/FixFirst-SEO.git
cd FixFirst-SEO

# Create environment configuration
nano apps/api/.env.production
# Add your configuration (see template below)

nano apps/web/.env.production
# Add: NEXT_PUBLIC_API_URL=https://yourdomain.com/api

# Run deployment script
bash deploy.sh
```

---

## 🔧 Environment Template

### `apps/api/.env.production`

```env
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://user:password@localhost:5432/seo_audit?schema=public
REDIS_URL=redis://localhost:6379
SOCKET_URL=http://localhost:3001
FRONTEND_URL=https://yourdomain.com
PSI_API_KEY=your_psi_api_key
JWT_SECRET=your_random_secret_here
SESSION_SECRET=your_random_secret_here
```

Generate random secrets:
```bash
openssl rand -base64 32
```

### `apps/web/.env.production`

```env
NEXT_PUBLIC_API_URL=https://yourdomain.com/api
NODE_ENV=production
```

---

## 📦 Manual Deployment Steps

If you prefer manual control:

### 1. Build Images

```bash
# API
docker build -f apps/api/Dockerfile -t fixfirst-api:latest .

# Worker
docker build -f apps/worker/Dockerfile -t fixfirst-worker:latest .

# Web
docker build -f apps/web/Dockerfile -t fixfirst-web:latest .
```

### 2. Run Migrations

```bash
docker run --rm \
  --env-file apps/api/.env.production \
  --network host \
  fixfirst-api:latest \
  npx prisma migrate deploy
```

### 3. Start Services

```bash
# API
docker run -d \
  --name fixfirst-api \
  --restart unless-stopped \
  --env-file apps/api/.env.production \
  --network host \
  -p 3001:3001 \
  fixfirst-api:latest

# Worker
docker run -d \
  --name fixfirst-worker \
  --restart unless-stopped \
  --env-file apps/api/.env.production \
  --network host \
  fixfirst-worker:latest

# Web
docker run -d \
  --name fixfirst-web \
  --restart unless-stopped \
  --env-file apps/web/.env.production \
  --network host \
  -p 3005:3005 \
  fixfirst-web:latest
```

---

## 🌐 Setup Reverse Proxy (Recommended)

### Install Nginx

```bash
sudo apt install nginx -y
```

### Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/fixfirst
```

Paste this configuration:

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Frontend
    location / {
        proxy_pass http://localhost:3005;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket
    location /socket.io {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

Enable and start:

```bash
sudo ln -s /etc/nginx/sites-available/fixfirst /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Setup SSL (Free)

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d yourdomain.com
```

---

## 🔍 Verification

```bash
# Check running containers
docker ps

# View logs
docker logs -f fixfirst-api
docker logs -f fixfirst-worker
docker logs -f fixfirst-web

# Test API
curl http://localhost:3001/health

# Access application
# Open browser: http://your-vps-ip:3005
```

---

## 🔄 Update Deployment

```bash
cd FixFirst-SEO
git pull origin main
bash deploy.sh
```

---

## 🛑 Stop Services

```bash
docker stop fixfirst-api fixfirst-worker fixfirst-web
docker rm fixfirst-api fixfirst-worker fixfirst-web
```

---

## 🆘 Common Issues

### Port already in use
```bash
sudo lsof -i :3001
sudo kill -9 <PID>
```

### Database connection failed
- Verify DATABASE_URL is correct
- Check PostgreSQL is running: `sudo systemctl status postgresql`
- Test connection: `psql $DATABASE_URL`

### Worker not processing
- Check Redis is running: `redis-cli ping`
- View worker logs: `docker logs -f fixfirst-worker`

---

## 📊 Resource Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| CPU | 1 core | 2 cores |
| RAM | 2GB | 4GB |
| Storage | 10GB | 20GB |
| Bandwidth | 1TB/month | 2TB/month |

---

## 🔐 Security Checklist

- [ ] SSL certificate installed
- [ ] Firewall configured (allow 80, 443)
- [ ] Strong database password
- [ ] Random JWT/Session secrets
- [ ] Environment variables secured
- [ ] Regular backups enabled

---

## 📞 Need Help?

Check the full [Deployment Guide](./DEPLOYMENT_GUIDE.md) for detailed instructions and troubleshooting.

---

## ✅ You're Done!

Your FixFirst SEO application should now be running! 🎉

Visit `https://yourdomain.com` (or `http://your-vps-ip:3005`) to access your application.


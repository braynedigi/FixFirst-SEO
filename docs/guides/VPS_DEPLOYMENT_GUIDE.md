# 🚀 VPS Deployment Guide (No Docker Compose)

This guide covers deploying the FixFirst SEO application to a VPS that supports Docker but not Docker Compose.

## 📋 Prerequisites

- Ubuntu 20.04+ VPS
- Root or sudo access
- Domain name pointed to your VPS
- Minimum 2GB RAM, 2 CPU cores
- 20GB+ storage

---

## 1️⃣ Initial VPS Setup

### Update System
```bash
sudo apt update && sudo apt upgrade -y
```

### Install Docker
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

### Install Required Tools
```bash
sudo apt install -y git nginx certbot python3-certbot-nginx
```

### Install PostgreSQL
```bash
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### Install Redis
```bash
sudo apt install -y redis-server
sudo systemctl start redis
sudo systemctl enable redis
```

---

## 2️⃣ Database Setup

### Create Database and User
```bash
sudo -u postgres psql
```

```sql
CREATE DATABASE seo_audit;
CREATE USER seo_user WITH ENCRYPTED PASSWORD 'your-secure-password';
GRANT ALL PRIVILEGES ON DATABASE seo_audit TO seo_user;
\q
```

### Update PostgreSQL for Local Connections
```bash
sudo nano /etc/postgresql/14/main/pg_hba.conf
```

Add this line:
```
local   seo_audit       seo_user                                md5
```

Restart PostgreSQL:
```bash
sudo systemctl restart postgresql
```

---

## 3️⃣ Clone Repository

```bash
cd /var/www
sudo git clone https://github.com/yourusername/fixfirst-seo.git
cd fixfirst-seo
```

---

## 4️⃣ Environment Configuration

### Create API Environment File
```bash
cd /var/www/fixfirst-seo/apps/api
sudo nano .env
```

Paste and configure:
```env
DATABASE_URL="postgresql://seo_user:your-secure-password@localhost:5432/seo_audit?schema=public"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="your-super-secret-jwt-key-generate-a-long-random-string"
PORT=3001
NODE_ENV=production
FRONTEND_URL="https://yourdomain.com"
SOCKET_URL="http://localhost:3001"
PSI_API_KEY="your-google-psi-api-key"

# Optional Email Configuration
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="noreply@yourdomain.com"
```

### Create Frontend Environment File
```bash
cd /var/www/fixfirst-seo/apps/web
sudo nano .env.production
```

Paste:
```env
NEXT_PUBLIC_API_URL=https://yourdomain.com/api
NEXT_PUBLIC_WS_URL=wss://yourdomain.com
```

---

## 5️⃣ Run Database Migrations

```bash
cd /var/www/fixfirst-seo/apps/api
npm install
npx prisma migrate deploy
npx prisma generate
```

---

## 6️⃣ Build Docker Images

### API Server Dockerfile
```bash
cd /var/www/fixfirst-seo/apps/api
sudo docker build -t seo-api:latest .
```

### Worker Dockerfile
```bash
cd /var/www/fixfirst-seo/apps/worker
sudo docker build -t seo-worker:latest .
```

### Frontend Dockerfile
```bash
cd /var/www/fixfirst-seo/apps/web
sudo docker build -t seo-frontend:latest .
```

---

## 7️⃣ Create Docker Network

```bash
sudo docker network create seo-network
```

---

## 8️⃣ Run Docker Containers

### Run API Server
```bash
sudo docker run -d \
  --name seo-api \
  --network seo-network \
  -p 3001:3001 \
  --env-file /var/www/fixfirst-seo/apps/api/.env \
  --restart unless-stopped \
  seo-api:latest
```

### Run Worker
```bash
sudo docker run -d \
  --name seo-worker \
  --network seo-network \
  --env-file /var/www/fixfirst-seo/apps/api/.env \
  --restart unless-stopped \
  seo-worker:latest
```

### Run Frontend
```bash
sudo docker run -d \
  --name seo-frontend \
  --network seo-network \
  -p 3005:3005 \
  --restart unless-stopped \
  seo-frontend:latest
```

---

## 9️⃣ Configure Nginx

### Create Nginx Configuration
```bash
sudo nano /etc/nginx/sites-available/fixfirst-seo
```

Paste:
```nginx
# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS Server
server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Configuration (will be added by certbot)
    # ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Client body size limit (for file uploads)
    client_max_body_size 10M;

    # API Proxy
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

    # WebSocket Proxy
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

    # Frontend Proxy
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
}
```

### Enable Configuration
```bash
sudo ln -s /etc/nginx/sites-available/fixfirst-seo /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 🔟 SSL Certificate Setup

### Install Let's Encrypt Certificate
```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Follow the prompts and choose to redirect HTTP to HTTPS.

### Auto-Renewal
Certbot sets up auto-renewal automatically. Test it:
```bash
sudo certbot renew --dry-run
```

---

## 1️⃣1️⃣ Create Deployment Script

Create a deployment script for easy updates:

```bash
sudo nano /var/www/fixfirst-seo/deploy.sh
```

Paste:
```bash
#!/bin/bash

echo "🚀 Starting deployment..."

# Navigate to project directory
cd /var/www/fixfirst-seo

# Pull latest code
echo "📥 Pulling latest code..."
git pull origin main

# Stop existing containers
echo "🛑 Stopping containers..."
docker stop seo-api seo-worker seo-frontend
docker rm seo-api seo-worker seo-frontend

# Run database migrations
echo "🗄️ Running database migrations..."
cd apps/api
npx prisma migrate deploy
npx prisma generate

# Rebuild images
echo "🔨 Building Docker images..."
cd /var/www/fixfirst-seo/apps/api
docker build -t seo-api:latest .

cd /var/www/fixfirst-seo/apps/worker
docker build -t seo-worker:latest .

cd /var/www/fixfirst-seo/apps/web
docker build -t seo-frontend:latest .

# Start containers
echo "▶️ Starting containers..."
docker run -d \
  --name seo-api \
  --network seo-network \
  -p 3001:3001 \
  --env-file /var/www/fixfirst-seo/apps/api/.env \
  --restart unless-stopped \
  seo-api:latest

docker run -d \
  --name seo-worker \
  --network seo-network \
  --env-file /var/www/fixfirst-seo/apps/api/.env \
  --restart unless-stopped \
  seo-worker:latest

docker run -d \
  --name seo-frontend \
  --network seo-network \
  -p 3005:3005 \
  --restart unless-stopped \
  seo-frontend:latest

echo "✅ Deployment complete!"
echo "📊 Check container status:"
docker ps
```

Make it executable:
```bash
sudo chmod +x /var/www/fixfirst-seo/deploy.sh
```

---

## 1️⃣2️⃣ Create Admin User

```bash
cd /var/www/fixfirst-seo/apps/api
node -e "
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function createAdmin() {
  const hashedPassword = await bcrypt.hash('your-admin-password', 10);
  const admin = await prisma.user.create({
    data: {
      email: 'admin@yourdomain.com',
      passwordHash: hashedPassword,
      role: 'ADMIN',
      planTier: 'ENTERPRISE'
    }
  });
  console.log('Admin user created:', admin.email);
  process.exit(0);
}

createAdmin();
"
```

---

## 1️⃣3️⃣ Monitoring & Logs

### View Container Logs
```bash
# API logs
sudo docker logs -f seo-api

# Worker logs
sudo docker logs -f seo-worker

# Frontend logs
sudo docker logs -f seo-frontend
```

### Check Container Status
```bash
sudo docker ps
```

### Restart Containers
```bash
sudo docker restart seo-api seo-worker seo-frontend
```

---

## 🔧 Troubleshooting

### Container Won't Start
```bash
# Check logs
sudo docker logs seo-api

# Check if port is in use
sudo netstat -tuln | grep 3001

# Restart Docker
sudo systemctl restart docker
```

### Database Connection Issues
```bash
# Test PostgreSQL connection
psql -U seo_user -d seo_audit -h localhost

# Check PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-14-main.log
```

### Nginx Issues
```bash
# Test configuration
sudo nginx -t

# Check error logs
sudo tail -f /var/log/nginx/error.log

# Restart Nginx
sudo systemctl restart nginx
```

---

## 🔐 Security Checklist

- [ ] Set strong database passwords
- [ ] Set strong JWT_SECRET
- [ ] Configure firewall (ufw)
- [ ] Enable fail2ban for SSH
- [ ] Regular security updates
- [ ] Monitor access logs
- [ ] Set up automated backups

### Configure Firewall
```bash
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw enable
```

---

## 📦 Backup Strategy

### Database Backup Script
```bash
#!/bin/bash
BACKUP_DIR="/var/backups/seo-audit"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR
pg_dump -U seo_user seo_audit > $BACKUP_DIR/backup_$DATE.sql
gzip $BACKUP_DIR/backup_$DATE.sql

# Keep only last 7 days
find $BACKUP_DIR -name "*.gz" -mtime +7 -delete
```

Add to crontab:
```bash
0 2 * * * /path/to/backup-script.sh
```

---

## ✅ Post-Deployment Checklist

- [ ] Visit your domain and verify it loads
- [ ] Test user registration and login
- [ ] Run a test audit
- [ ] Check all API endpoints work
- [ ] Verify WebSocket connections
- [ ] Test team collaboration features
- [ ] Check analytics dashboard
- [ ] Monitor logs for errors
- [ ] Set up monitoring alerts

---

## 🆘 Support

If you encounter issues, check:
1. Container logs
2. Nginx error logs
3. PostgreSQL logs
4. Redis status

For further help, refer to the main README.md or create an issue on GitHub.


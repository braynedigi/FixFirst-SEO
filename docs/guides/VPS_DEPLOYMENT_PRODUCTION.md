# 🚀 VPS Production Deployment Guide

Complete guide for deploying FixFirst SEO to a production VPS using Docker.

---

## 📋 Prerequisites

### Server Requirements
- **OS:** Ubuntu 20.04+ or Debian 11+
- **RAM:** Minimum 2GB (4GB+ recommended)
- **Storage:** Minimum 20GB SSD
- **CPU:** 2+ cores recommended

### Software Required
- Docker (v20.10+)
- Docker Compose (v2.0+)
- Git
- Nginx (for reverse proxy)
- Certbot (for SSL certificates)

---

## 🔧 Step 1: Server Setup

### 1.1 Update System
```bash
sudo apt update && sudo apt upgrade -y
```

### 1.2 Install Docker
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker $USER

# Logout and login again for group changes to take effect
```

### 1.3 Install Docker Compose
```bash
sudo apt install docker-compose-plugin -y
```

### 1.4 Install Nginx
```bash
sudo apt install nginx -y
```

### 1.5 Install Certbot (for SSL)
```bash
sudo apt install certbot python3-certbot-nginx -y
```

---

## 📦 Step 2: Clone Repository

```bash
# Navigate to your desired directory
cd /var/www

# Clone your repository
git clone https://github.com/yourusername/fixfirst-seo.git
cd fixfirst-seo
```

---

## ⚙️ Step 3: Configure Environment

### 3.1 Create Production Environment File
```bash
# Copy the example file
cp env.production.example .env

# Edit with your configuration
nano .env
```

### 3.2 Required Configuration

Update the following in `.env`:

```bash
# Database - CHANGE THESE!
POSTGRES_PASSWORD=YOUR_VERY_SECURE_PASSWORD_HERE
JWT_SECRET=YOUR_VERY_LONG_RANDOM_STRING_HERE

# Your Domain
FRONTEND_URL=https://yourdomain.com
NEXT_PUBLIC_API_URL=https://api.yourdomain.com

# Google PageSpeed Insights API
PSI_API_KEY=YOUR_GOOGLE_PSI_API_KEY

# Email (Recommended)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=noreply@yourdomain.com

# OpenAI (Optional)
OPENAI_API_KEY=sk-your-key-here
```

### 3.3 Generate Secure Secrets

```bash
# Generate secure password for database
openssl rand -base64 32

# Generate JWT secret
openssl rand -base64 64
```

---

## 🐳 Step 4: Deploy with Docker

### 4.1 Make Deploy Script Executable
```bash
chmod +x deploy.sh
```

### 4.2 Run Deployment
```bash
./deploy.sh
```

This script will:
1. Validate environment variables
2. Build Docker images
3. Start all services
4. Run database migrations
5. Display service status

### 4.3 Verify Deployment
```bash
# Check if all containers are running
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

---

## 🌐 Step 5: Configure Nginx Reverse Proxy

### 5.1 Create Nginx Configuration for Frontend

```bash
sudo nano /etc/nginx/sites-available/fixfirst-frontend
```

Add this configuration:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    client_max_body_size 10M;

    location / {
        proxy_pass http://localhost:3005;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 5.2 Create Nginx Configuration for API

```bash
sudo nano /etc/nginx/sites-available/fixfirst-api
```

Add this configuration:

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    client_max_body_size 10M;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket support
    location /socket.io/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### 5.3 Enable Sites

```bash
# Enable configurations
sudo ln -s /etc/nginx/sites-available/fixfirst-frontend /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/fixfirst-api /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

---

## 🔒 Step 6: Setup SSL Certificates

### 6.1 Obtain SSL Certificates

```bash
# For frontend
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# For API
sudo certbot --nginx -d api.yourdomain.com
```

Follow the prompts and choose to redirect HTTP to HTTPS when asked.

### 6.2 Auto-renewal

Certbot automatically sets up certificate renewal. Verify:

```bash
sudo certbot renew --dry-run
```

---

## 🔐 Step 7: Security Hardening

### 7.1 Configure Firewall

```bash
# Install UFW if not already installed
sudo apt install ufw -y

# Allow SSH
sudo ufw allow OpenSSH

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

### 7.2 Secure Docker

```bash
# Ensure Docker daemon only listens on localhost
sudo nano /etc/docker/daemon.json
```

Add:
```json
{
  "live-restore": true,
  "hosts": ["unix:///var/run/docker.sock"]
}
```

```bash
sudo systemctl restart docker
```

---

## 🔄 Step 8: Setup Automatic Backups

### 8.1 Create Backup Script

```bash
sudo nano /usr/local/bin/backup-seo-audit.sh
```

Add:
```bash
#!/bin/bash
BACKUP_DIR="/var/backups/seo-audit"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup database
docker-compose -f /var/www/fixfirst-seo/docker-compose.prod.yml \
  exec -T postgres pg_dump -U postgres seo_audit | \
  gzip > $BACKUP_DIR/db_backup_$DATE.sql.gz

# Backup uploads
tar -czf $BACKUP_DIR/uploads_backup_$DATE.tar.gz \
  /var/lib/docker/volumes/fixfirst-seo_api_uploads

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
```

```bash
# Make executable
sudo chmod +x /usr/local/bin/backup-seo-audit.sh

# Setup daily backup cron job
sudo crontab -e
```

Add this line:
```
0 2 * * * /usr/local/bin/backup-seo-audit.sh >> /var/log/seo-audit-backup.log 2>&1
```

---

## 📊 Step 9: Monitoring

### 9.1 View Logs

```bash
# All services
docker-compose -f docker-compose.prod.yml logs -f

# Specific service
docker-compose -f docker-compose.prod.yml logs -f api
docker-compose -f docker-compose.prod.yml logs -f worker
docker-compose -f docker-compose.prod.yml logs -f web
```

### 9.2 Check Service Status

```bash
# Docker services
docker-compose -f docker-compose.prod.yml ps

# System resources
docker stats
```

### 9.3 Setup Health Checks (Optional)

Use a service like UptimeRobot or Pingdom to monitor:
- Frontend: `https://yourdomain.com`
- API Health: `https://api.yourdomain.com/health`

---

## 🔄 Step 10: Updates and Maintenance

### 10.1 Pull Latest Changes

```bash
cd /var/www/fixfirst-seo
git pull
```

### 10.2 Redeploy

```bash
./deploy.sh
```

### 10.3 Restart Services

```bash
# Restart all
docker-compose -f docker-compose.prod.yml restart

# Restart specific service
docker-compose -f docker-compose.prod.yml restart api
```

### 10.4 Database Migrations

```bash
# Run pending migrations
docker-compose -f docker-compose.prod.yml exec api \
  npx prisma migrate deploy --schema=./prisma/schema.prisma
```

---

## 🐛 Troubleshooting

### Service Won't Start

```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs <service-name>

# Check container status
docker ps -a

# Restart service
docker-compose -f docker-compose.prod.yml restart <service-name>
```

### Database Connection Issues

```bash
# Check if database is running
docker-compose -f docker-compose.prod.yml ps postgres

# Check database logs
docker-compose -f docker-compose.prod.yml logs postgres

# Restart database
docker-compose -f docker-compose.prod.yml restart postgres
```

### SSL Certificate Issues

```bash
# Check certificate status
sudo certbot certificates

# Renew certificates manually
sudo certbot renew

# Restart Nginx
sudo systemctl restart nginx
```

### Out of Disk Space

```bash
# Clean Docker
docker system prune -a --volumes

# Check disk usage
df -h

# Remove old backups
sudo find /var/backups/seo-audit -mtime +30 -delete
```

---

## 📝 Post-Deployment Checklist

- [ ] All services are running
- [ ] SSL certificates are installed
- [ ] Firewall is configured
- [ ] Backups are set up
- [ ] Domain DNS is pointing to server
- [ ] Admin user is created
- [ ] PSI API key is configured
- [ ] Email notifications are working (test)
- [ ] Health check monitoring is set up
- [ ] Password and secrets are secure
- [ ] Documentation is updated

---

## 🆘 Support

If you encounter issues:
1. Check the logs first
2. Review this documentation
3. Check the troubleshooting section
4. Consult the main README.md

---

## 🔗 Useful Commands Reference

```bash
# View all containers
docker ps -a

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Stop all services
docker-compose -f docker-compose.prod.yml down

# Start all services
docker-compose -f docker-compose.prod.yml up -d

# Rebuild and restart
docker-compose -f docker-compose.prod.yml up -d --build

# Check disk usage
docker system df

# Clean up
docker system prune -a

# Database backup
docker-compose -f docker-compose.prod.yml exec postgres \
  pg_dump -U postgres seo_audit > backup.sql

# Database restore
cat backup.sql | docker-compose -f docker-compose.prod.yml exec -T postgres \
  psql -U postgres seo_audit
```

---

**🎉 Congratulations! Your FixFirst SEO instance is now live in production!**


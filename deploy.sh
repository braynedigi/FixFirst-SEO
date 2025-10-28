#!/bin/bash

# ============================================
# FixFirst SEO - Production Deployment Script
# ============================================

set -e  # Exit on error

echo "🚀 Starting FixFirst SEO deployment..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "📝 Please create .env from env.production.example"
    echo "   cp env.production.example .env"
    echo "   Then edit .env with your configuration"
    exit 1
fi

# Load environment variables
source .env

# Check required variables
required_vars=("POSTGRES_PASSWORD" "JWT_SECRET" "PSI_API_KEY" "FRONTEND_URL" "NEXT_PUBLIC_API_URL")
missing_vars=()

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ] || [[ "${!var}" == *"YOUR_"* ]]; then
        missing_vars+=("$var")
    fi
done

if [ ${#missing_vars[@]} -gt 0 ]; then
    echo "❌ Error: The following required variables are not configured:"
    printf '   - %s\n' "${missing_vars[@]}"
    echo "📝 Please update your .env file"
    exit 1
fi

echo "✅ Environment variables validated"

# Pull latest changes (if using git deployment)
if [ -d .git ]; then
    echo "📥 Pulling latest changes..."
    git pull
fi

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose -f docker-compose.prod.yml down

# Remove old images (optional - uncomment if needed)
# echo "🗑️  Removing old images..."
# docker-compose -f docker-compose.prod.yml down --rmi all

# Build images
echo "🔨 Building Docker images..."
docker-compose -f docker-compose.prod.yml build --no-cache

# Start services
echo "🚀 Starting services..."
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be healthy..."
sleep 10

# Check service status
echo "📊 Checking service status..."
docker-compose -f docker-compose.prod.yml ps

# Run database migrations
echo "🔄 Running database migrations..."
docker-compose -f docker-compose.prod.yml exec -T api npx prisma migrate deploy --schema=./prisma/schema.prisma

# Show logs
echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 Service URLs:"
echo "   - Frontend: http://localhost:${WEB_PORT:-3005}"
echo "   - API:      http://localhost:${API_PORT:-3001}"
echo ""
echo "📝 Useful commands:"
echo "   - View logs:     docker-compose -f docker-compose.prod.yml logs -f"
echo "   - Stop services: docker-compose -f docker-compose.prod.yml down"
echo "   - Restart:       docker-compose -f docker-compose.prod.yml restart"
echo ""
echo "🔍 To view logs, run:"
echo "   docker-compose -f docker-compose.prod.yml logs -f"


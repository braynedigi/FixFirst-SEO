#!/bin/bash

# FixFirst SEO Deployment Script (Without Docker Compose)
# This script helps deploy the application on a VPS using individual Dockerfiles

set -e

echo "🚀 FixFirst SEO Deployment Script"
echo "=================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker is installed${NC}"

# Build images
echo ""
echo "📦 Building Docker images..."
echo "----------------------------"

echo "Building API image..."
docker build -f apps/api/Dockerfile -t fixfirst-api:latest . || {
    echo -e "${RED}❌ Failed to build API image${NC}"
    exit 1
}
echo -e "${GREEN}✅ API image built successfully${NC}"

echo "Building Worker image..."
docker build -f apps/worker/Dockerfile -t fixfirst-worker:latest . || {
    echo -e "${RED}❌ Failed to build Worker image${NC}"
    exit 1
}
echo -e "${GREEN}✅ Worker image built successfully${NC}"

echo "Building Web image..."
docker build -f apps/web/Dockerfile -t fixfirst-web:latest . || {
    echo -e "${RED}❌ Failed to build Web image${NC}"
    exit 1
}
echo -e "${GREEN}✅ Web image built successfully${NC}"

# Run migrations
echo ""
echo "🗄️  Running database migrations..."
echo "-----------------------------------"

if [ -f "apps/api/.env.production" ]; then
    docker run --rm \
        --env-file apps/api/.env.production \
        --network host \
        fixfirst-api:latest \
        npx prisma migrate deploy || {
        echo -e "${YELLOW}⚠️  Migration failed. Make sure database is accessible.${NC}"
    }
    echo -e "${GREEN}✅ Migrations completed${NC}"
else
    echo -e "${YELLOW}⚠️  No .env.production file found. Skipping migrations.${NC}"
    echo "   Create apps/api/.env.production with your configuration."
fi

# Stop existing containers
echo ""
echo "🛑 Stopping existing containers..."
echo "-----------------------------------"

docker stop fixfirst-api 2>/dev/null || true
docker stop fixfirst-worker 2>/dev/null || true
docker stop fixfirst-web 2>/dev/null || true

docker rm fixfirst-api 2>/dev/null || true
docker rm fixfirst-worker 2>/dev/null || true
docker rm fixfirst-web 2>/dev/null || true

echo -e "${GREEN}✅ Old containers removed${NC}"

# Start new containers
echo ""
echo "🚀 Starting new containers..."
echo "------------------------------"

# Start API
docker run -d \
    --name fixfirst-api \
    --restart unless-stopped \
    --env-file apps/api/.env.production \
    --network host \
    -p 3001:3001 \
    fixfirst-api:latest || {
    echo -e "${RED}❌ Failed to start API container${NC}"
    exit 1
}
echo -e "${GREEN}✅ API container started${NC}"

# Start Worker
docker run -d \
    --name fixfirst-worker \
    --restart unless-stopped \
    --env-file apps/api/.env.production \
    --network host \
    fixfirst-worker:latest || {
    echo -e "${RED}❌ Failed to start Worker container${NC}"
    exit 1
}
echo -e "${GREEN}✅ Worker container started${NC}"

# Start Web
docker run -d \
    --name fixfirst-web \
    --restart unless-stopped \
    --env-file apps/web/.env.production \
    --network host \
    -p 3005:3005 \
    fixfirst-web:latest || {
    echo -e "${RED}❌ Failed to start Web container${NC}"
    exit 1
}
echo -e "${GREEN}✅ Web container started${NC}"

# Verification
echo ""
echo "🔍 Verification..."
echo "------------------"

sleep 3

# Check if containers are running
if [ "$(docker ps -q -f name=fixfirst-api)" ]; then
    echo -e "${GREEN}✅ API container is running${NC}"
else
    echo -e "${RED}❌ API container is not running${NC}"
fi

if [ "$(docker ps -q -f name=fixfirst-worker)" ]; then
    echo -e "${GREEN}✅ Worker container is running${NC}"
else
    echo -e "${RED}❌ Worker container is not running${NC}"
fi

if [ "$(docker ps -q -f name=fixfirst-web)" ]; then
    echo -e "${GREEN}✅ Web container is running${NC}"
else
    echo -e "${RED}❌ Web container is not running${NC}"
fi

echo ""
echo "=================================="
echo -e "${GREEN}✅ Deployment completed!${NC}"
echo "=================================="
echo ""
echo "📊 Container Status:"
docker ps --filter "name=fixfirst"
echo ""
echo "📝 View logs:"
echo "   docker logs -f fixfirst-api"
echo "   docker logs -f fixfirst-worker"
echo "   docker logs -f fixfirst-web"
echo ""
echo "🌐 Access your application:"
echo "   Frontend: http://localhost:3005"
echo "   API:      http://localhost:3001"
echo ""

# Production Dockerfile for Worker Service
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat chromium
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY prisma ./prisma/

# Install dependencies
RUN npm ci --only=production

# Build stage
FROM base AS builder
WORKDIR /app

# Install Chromium for Puppeteer
RUN apk add --no-cache chromium

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules

# Copy source code
COPY . .

# Generate Prisma Client
COPY prisma ./prisma
RUN npx prisma generate

# Production stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Install Chromium and fonts
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    font-noto-emoji

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 workeruser

# Copy necessary files
COPY --from=builder --chown=workeruser:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=workeruser:nodejs /app/apps/api ./apps/api
COPY --from=builder --chown=workeruser:nodejs /app/prisma ./prisma

# Switch to non-root user
USER workeruser

# Start Worker
WORKDIR /app/apps/api
CMD ["node", "--require", "tsx/cjs", "src/worker.ts"]


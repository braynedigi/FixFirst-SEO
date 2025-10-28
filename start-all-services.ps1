# FixFirst SEO - Start All Services
# This script starts API, Worker, and Frontend servers simultaneously

Write-Host "🚀 Starting FixFirst SEO Application..." -ForegroundColor Cyan
Write-Host ""

# Set environment variables
$env:DATABASE_URL = "postgresql://postgres:postgres@localhost:5433/seo_audit?schema=public"
$env:REDIS_URL = "redis://localhost:6380"
$env:PSI_API_KEY = "AIzaSyApH_khs9Ln7hi3xkd6qLUahsSgq2KDU0U"
$env:JWT_SECRET = "your-super-secret-jwt-key-change-in-production"
$env:PORT = "3001"
$env:FRONTEND_URL = "http://localhost:3005"
$env:API_URL = "http://localhost:3001"
$env:SOCKET_URL = "http://localhost:3001"
$env:NODE_ENV = "development"

# Navigate to project root
$projectRoot = $PSScriptRoot
Set-Location $projectRoot

Write-Host "📍 Project Root: $projectRoot" -ForegroundColor Gray
Write-Host ""

# Check if Docker containers are running
Write-Host "🐳 Checking Docker containers..." -ForegroundColor Yellow
$postgresRunning = docker ps --filter "name=seo-audit-postgres" --filter "status=running" --format "{{.Names}}"
$redisRunning = docker ps --filter "name=seo-audit-redis" --filter "status=running" --format "{{.Names}}"

if (-not $postgresRunning) {
    Write-Host "❌ PostgreSQL container is not running!" -ForegroundColor Red
    Write-Host "   Run: docker-compose up -d" -ForegroundColor Gray
    exit 1
}

if (-not $redisRunning) {
    Write-Host "❌ Redis container is not running!" -ForegroundColor Red
    Write-Host "   Run: docker-compose up -d" -ForegroundColor Gray
    exit 1
}

Write-Host "✅ Docker containers are running" -ForegroundColor Green
Write-Host ""

# Stop any existing Node processes
Write-Host "🛑 Stopping any existing Node processes..." -ForegroundColor Yellow
Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2
Write-Host "✅ Cleaned up existing processes" -ForegroundColor Green
Write-Host ""

# Start API Server
Write-Host "🔧 Starting API Server..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$projectRoot\apps\api'; npm run dev" -WindowStyle Normal
Start-Sleep -Seconds 3

# Start Worker Process
Write-Host "⚙️  Starting Worker Process..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$projectRoot\apps\api'; npm run worker" -WindowStyle Normal
Start-Sleep -Seconds 3

# Start Frontend
Write-Host "🎨 Starting Frontend..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$projectRoot\apps\web'; npm run dev" -WindowStyle Normal
Start-Sleep -Seconds 5

Write-Host ""
Write-Host "=" * 60 -ForegroundColor Green
Write-Host "✅ ALL SERVICES STARTED SUCCESSFULLY!" -ForegroundColor Green
Write-Host "=" * 60 -ForegroundColor Green
Write-Host ""
Write-Host "📌 URLs:" -ForegroundColor Cyan
Write-Host "   Frontend: http://localhost:3005" -ForegroundColor White
Write-Host "   API:      http://localhost:3001" -ForegroundColor White
Write-Host ""
Write-Host "🔑 Admin Login:" -ForegroundColor Cyan
Write-Host "   Email:    admin@seoaudit.com" -ForegroundColor White
Write-Host "   Password: password123" -ForegroundColor White
Write-Host ""
Write-Host "📝 Note: Each service runs in its own PowerShell window" -ForegroundColor Gray
Write-Host "   Close those windows to stop the services" -ForegroundColor Gray
Write-Host ""
Write-Host "Press any key to exit this window..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")


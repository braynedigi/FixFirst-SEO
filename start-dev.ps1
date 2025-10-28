# SEO Audit Tool - Development Startup Script
# This script starts all necessary services

Write-Host "🚀 Starting SEO Audit Tool..." -ForegroundColor Green
Write-Host ""

# Check if Docker is running
Write-Host "1️⃣ Starting PostgreSQL and Redis..." -ForegroundColor Cyan
docker-compose up -d postgres redis
Start-Sleep -Seconds 3

Write-Host ""
Write-Host "2️⃣ Starting API Server..." -ForegroundColor Cyan
$apiJob = Start-Job -ScriptBlock {
    Set-Location "C:\Users\Lenovo\Documents\Software Development\October 2025\FixFirst SEO\apps\api"
    $env:DATABASE_URL="postgresql://postgres:postgres@localhost:5433/seo_audit_tool"
    $env:REDIS_URL="redis://localhost:6380"
    $env:JWT_SECRET="dev-secret"
    $env:PORT="3001"
    npm run dev
}

Write-Host ""
Write-Host "3️⃣ Starting Frontend..." -ForegroundColor Cyan
Start-Sleep -Seconds 2
$webJob = Start-Job -ScriptBlock {
    Set-Location "C:\Users\Lenovo\Documents\Software Development\October 2025\FixFirst SEO\apps\web"
    $env:NEXT_PUBLIC_API_URL="http://localhost:3001"
    npm run dev
}

Write-Host ""
Write-Host "✅ All services starting!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Service URLs:" -ForegroundColor Yellow
Write-Host "   Frontend: http://localhost:3002" -ForegroundColor White
Write-Host "   API:      http://localhost:3001/health" -ForegroundColor White
Write-Host ""
Write-Host "👤 Test Credentials:" -ForegroundColor Yellow
Write-Host "   Email:    test@example.com" -ForegroundColor White
Write-Host "   Password: test123" -ForegroundColor White
Write-Host ""
Write-Host "🛑 To stop: Run 'docker-compose down' and close this window" -ForegroundColor Red
Write-Host ""
Write-Host "Waiting for services to start (15 seconds)..." -ForegroundColor Cyan
Start-Sleep -Seconds 15

Write-Host ""
Write-Host "🌐 Opening browser..." -ForegroundColor Green
Start-Process "http://localhost:3002"

Write-Host ""
Write-Host "📊 Monitoring logs (Ctrl+C to stop)..." -ForegroundColor Cyan
Write-Host ""

# Keep jobs running and show output
Receive-Job -Job $apiJob -Wait
Receive-Job -Job $webJob -Wait


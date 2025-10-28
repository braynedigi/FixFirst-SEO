# Restart Worker with PSI API Key
# Usage: Edit this file to add your PSI_API_KEY, then run: .\restart-worker-with-psi.ps1

Write-Host "🔄 Restarting worker with PSI API key..." -ForegroundColor Cyan

# Navigate to project root
Set-Location "C:\Users\Lenovo\Documents\Software Development\October 2025\FixFirst SEO\apps\api"

# Set environment variables
$env:DATABASE_URL = "postgresql://postgres:postgres@localhost:5433/seo_audit_tool"
$env:REDIS_URL = "redis://localhost:6380"
$env:JWT_SECRET = "dev-secret"

# ⚠️ EDIT THIS LINE - Add your PSI API key here:
 $env:PSI_API_KEY = "AIzaSyApH_khs9Ln7hi3xkd6qLUahsSgq2KDU0U"

Write-Host "✅ Environment variables set" -ForegroundColor Green
Write-Host "🚀 Starting worker..." -ForegroundColor Cyan
Write-Host ""

# Start the worker
npm run worker


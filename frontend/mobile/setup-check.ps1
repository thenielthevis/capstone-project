# Quick Setup Check Script
# Run with: powershell -ExecutionPolicy Bypass -File setup-check.ps1

Write-Host "`n=== Lifora Mobile App Setup Check ===`n" -ForegroundColor Cyan

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: Run this script from frontend/mobile directory" -ForegroundColor Red
    exit 1
}

# Check Node.js
Write-Host "Checking Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js installed: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found. Install from https://nodejs.org" -ForegroundColor Red
    exit 1
}

# Check npm
Write-Host "`nChecking npm..." -ForegroundColor Yellow
try {
    $npmVersion = npm --version
    Write-Host "✓ npm installed: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm not found" -ForegroundColor Red
    exit 1
}

# Check if node_modules exists
Write-Host "`nChecking dependencies..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Write-Host "✓ Dependencies installed" -ForegroundColor Green
} else {
    Write-Host "⚠️  Dependencies not installed. Run: npm install" -ForegroundColor Yellow
}

# Check .env file
Write-Host "`nChecking environment configuration..." -ForegroundColor Yellow
if (Test-Path ".env") {
    Write-Host "✓ .env file exists" -ForegroundColor Green
    
    # Read and validate .env
    $envContent = Get-Content ".env" -Raw
    if ($envContent -match "EXPO_PUBLIC_API_URL=(.+)") {
        $apiUrl = $matches[1].Trim()
        if ($apiUrl -and $apiUrl -ne "http://192.168.1.5:5000/api") {
            Write-Host "  API URL configured: $apiUrl" -ForegroundColor Cyan
        } else {
            Write-Host "⚠️  API URL needs to be updated in .env" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "❌ .env file not found" -ForegroundColor Red
    Write-Host "  Run: Copy-Item .env.sample .env" -ForegroundColor Yellow
}

# Check backend server
Write-Host "`nChecking backend server..." -ForegroundColor Yellow
$backendPath = "..\..\backend"
if (Test-Path $backendPath) {
    Write-Host "✓ Backend directory found" -ForegroundColor Green
    
    # Try to check if backend is running
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:5000" -TimeoutSec 2 -UseBasicParsing
        Write-Host "✓ Backend server is running!" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  Backend server not running" -ForegroundColor Yellow
        Write-Host "  Start it with: cd $backendPath; npm start" -ForegroundColor Cyan
    }
} else {
    Write-Host "❌ Backend directory not found at $backendPath" -ForegroundColor Red
}

# Get local IP addresses
Write-Host "`nYour network configuration:" -ForegroundColor Yellow
Write-Host "Local IP addresses:" -ForegroundColor Cyan
Get-NetIPAddress -AddressFamily IPv4 | Where-Object {
    $_.InterfaceAlias -notlike "*Loopback*" -and 
    $_.IPAddress -notlike "169.254.*"
} | ForEach-Object {
    Write-Host "  $($_.InterfaceAlias): $($_.IPAddress)" -ForegroundColor White
}

# Recommendations
Write-Host "`n=== Recommendations ===" -ForegroundColor Cyan

$recommendations = @()

if (-not (Test-Path ".env")) {
    $recommendations += "1. Create .env file: Copy-Item .env.sample .env"
}

if (-not (Test-Path "node_modules")) {
    $recommendations += "2. Install dependencies: npm install"
}

try {
    Invoke-WebRequest -Uri "http://localhost:5000" -TimeoutSec 1 -UseBasicParsing | Out-Null
} catch {
    $recommendations += "3. Start backend server: cd ..\..\backend; npm start"
}

$recommendations += "4. Run connection test: node testConnection.js"
$recommendations += "5. Run env checker: node checkEnv.js"
$recommendations += "6. Start mobile app: npx expo start --clear"

if ($recommendations.Count -gt 2) {
    Write-Host "`nNext steps:" -ForegroundColor Yellow
    $recommendations | ForEach-Object { Write-Host "  $_" -ForegroundColor White }
} else {
    Write-Host "`n✓ Setup looks good! You can now run:" -ForegroundColor Green
    Write-Host "  npx expo start" -ForegroundColor Cyan
}

Write-Host "`nFor troubleshooting, see TROUBLESHOOTING.md`n" -ForegroundColor Gray

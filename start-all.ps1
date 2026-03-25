# SatelliteVision Pro - Full Stack Startup Script (Windows)
# This script starts backend, frontend, and Python ML service

Write-Host "SatelliteVision Pro - Full Stack Startup" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Check prerequisites
Write-Host "Checking prerequisites..." -ForegroundColor Yellow
Write-Host ""

# Check Java
try {
    $javaVersion = java -version 2>&1 | Select-Object -First 1
    Write-Host "[OK] Java: $javaVersion" -ForegroundColor Green
}
catch {
    Write-Host "[ERROR] Java is not installed! Please install Java JDK 17+" -ForegroundColor Red
    exit 1
}

# Check Maven
try {
    $mvnVersion = mvn -version 2>&1 | Select-Object -First 1
    Write-Host "[OK] Maven: $mvnVersion" -ForegroundColor Green
}
catch {
    Write-Host "[ERROR] Maven is not installed! Please install Maven 3.6+" -ForegroundColor Red
    exit 1
}

# Check Node.js or Bun
$hasNode = Get-Command node -ErrorAction SilentlyContinue
$hasBun = Get-Command bun -ErrorAction SilentlyContinue

if ($hasNode) {
    $nodeVersion = node --version
    Write-Host "[OK] Node.js: $nodeVersion" -ForegroundColor Green
}
elseif ($hasBun) {
    $bunVersion = bun --version
    Write-Host "[OK] Bun: $bunVersion" -ForegroundColor Green
}
else {
    Write-Host "[ERROR] Neither Node.js nor Bun is installed!" -ForegroundColor Red
    Write-Host "   Please install Node.js (https://nodejs.org) or Bun (https://bun.sh)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "All prerequisites met!" -ForegroundColor Green
Write-Host ""

# Start Backend (Java)
Write-Host "Starting Java Backend on port 8081..." -ForegroundColor Cyan
$backendJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    mvn spring-boot:run
}
Write-Host "Backend Job ID: $($backendJob.Id)" -ForegroundColor Gray
Write-Host ""

# Start Python ML Service
Write-Host "Starting Python ML Service on port 5000..." -ForegroundColor Cyan
$pythonJob = Start-Job -ScriptBlock {
    Set-Location "$using:PWD\python-cog-service"
    python app.py
}
Write-Host "Python Job ID: $($pythonJob.Id)" -ForegroundColor Gray
Write-Host ""

# Wait for services to start
Write-Host "Waiting for services to initialize (20 seconds)..." -ForegroundColor Yellow
Start-Sleep -Seconds 20

# Check if backend is running
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8081" -UseBasicParsing -TimeoutSec 5 -ErrorAction SilentlyContinue
    Write-Host "[OK] Backend is running at http://localhost:8081" -ForegroundColor Green
}
catch {
    Write-Host "[WARNING] Backend may still be starting..." -ForegroundColor Yellow
}

# Start frontend
Write-Host ""
Write-Host "Starting React Frontend..." -ForegroundColor Cyan

# Install dependencies if needed
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    if ($hasBun) { bun install } else { npm install }
    Write-Host ""
}

Write-Host "Frontend will be available at: http://localhost:5173" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop all servers" -ForegroundColor Yellow
Write-Host ""

if ($hasBun) {
    bun run dev
}
else {
    npm run dev
}

# Cleanup on exit
Write-Host ""
Write-Host "Shutting down servers..." -ForegroundColor Red
Stop-Job -Job $backendJob -ErrorAction SilentlyContinue
Stop-Job -Job $pythonJob -ErrorAction SilentlyContinue
Remove-Job -Job $backendJob -ErrorAction SilentlyContinue
Remove-Job -Job $pythonJob -ErrorAction SilentlyContinue
Write-Host "Shutdown complete." -ForegroundColor Green

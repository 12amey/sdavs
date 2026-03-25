# Python COG NDVI Service Startup Script
# For Windows PowerShell

Write-Host "🐍 Starting Python COG NDVI Service..." -ForegroundColor Green

# Check Python installation
$pythonCmd = $null
if (Get-Command python -ErrorAction SilentlyContinue) {
    $pythonCmd = "python"
} elseif (Get-Command python3 -ErrorAction SilentlyContinue) {
    $pythonCmd = "python3"
} elseif (Get-Command py -ErrorAction SilentlyContinue) {
    $pythonCmd = "py"
} else {
    Write-Host "❌ Python not found! Please install Python 3.8+ from python.org" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Found Python: $pythonCmd" -ForegroundColor Green
& $pythonCmd --version

# Navigate to python service directory
cd python-cog-service

# Install dependencies
Write-Host "`n📦 Installing Python dependencies..." -ForegroundColor Cyan
& $pythonCmd -m pip install -r requirements.txt

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install dependencies"  -ForegroundColor Red
    exit 1
}

Write-Host "`n🚀 Starting Flask service on port 5000..." -ForegroundColor Green
& $pythonCmd app.py

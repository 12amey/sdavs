#!/bin/bash

# SatelliteVision Pro - Full Stack Startup Script
# This script starts both backend and frontend

echo "🛰️  SatelliteVision Pro - Full Stack Startup"
echo "============================================"
echo ""

# Function to check if command exists
command_exists() {
    command -v "$1" &> /dev/null
}

# Check prerequisites
echo "🔍 Checking prerequisites..."
echo ""

if ! command_exists java; then
    echo "❌ Java is not installed! Please install Java JDK 17+"
    exit 1
fi

if ! command_exists mvn; then
    echo "❌ Maven is not installed! Please install Maven 3.6+"
    exit 1
fi

if ! command_exists bun; then
    echo "❌ Bun is not installed! Please install Bun"
    echo "Visit: https://bun.sh"
    exit 1
fi

echo "✅ All prerequisites met!"
echo ""

# Start backend in background
echo "🚀 Starting Java Backend..."
./start-backend.sh &
BACKEND_PID=$!

echo "Backend PID: $BACKEND_PID"
echo ""

# Wait for backend to start
echo "⏳ Waiting for backend to initialize (30 seconds)..."
sleep 30

# Check if backend is running
if curl -s http://localhost:8080/api/satellite/health > /dev/null; then
    echo "✅ Backend is running!"
else
    echo "⚠️  Backend may still be starting..."
fi

echo ""

# Start frontend
echo "🌐 Starting React Frontend..."
echo ""
bun run dev

# Cleanup on exit
trap "echo ''; echo '🛑 Shutting down...'; kill $BACKEND_PID 2>/dev/null" EXIT

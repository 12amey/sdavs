#!/bin/bash

# SatelliteVision Pro - Backend Startup Script
# This script builds and starts the Java Spring Boot backend

echo "🛰️  SatelliteVision Pro - Starting Backend"
echo "=========================================="
echo ""

# Check if Java is installed
if ! command -v java &> /dev/null; then
    echo "❌ Java is not installed!"
    echo "Please install Java JDK 17 or higher"
    echo ""
    echo "Ubuntu/Debian: sudo apt install openjdk-17-jdk"
    echo "macOS: brew install openjdk@17"
    echo "Windows: Download from https://www.oracle.com/java/technologies/downloads/"
    exit 1
fi

# Check if Maven is installed
if ! command -v mvn &> /dev/null; then
    echo "❌ Maven is not installed!"
    echo "Please install Maven 3.6 or higher"
    echo ""
    echo "Ubuntu/Debian: sudo apt install maven"
    echo "macOS: brew install maven"
    echo "Windows: Download from https://maven.apache.org/download.cgi"
    exit 1
fi

# Display versions
echo "✅ Java Version:"
java -version
echo ""

echo "✅ Maven Version:"
mvn -version
echo ""

# Check if pom.xml exists
if [ ! -f "pom.xml" ]; then
    echo "❌ pom.xml not found! Please run this script from the project root directory."
    exit 1
fi

echo "📦 Building backend (this may take a few minutes on first run)..."
echo ""

# Clean and build the project (skip tests for faster startup)
mvn clean install -DskipTests

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Build failed! Please check the error messages above."
    exit 1
fi

echo ""
echo "✅ Build successful!"
echo ""
echo "🚀 Starting Spring Boot backend on http://localhost:8080"
echo ""
echo "📊 API Endpoints:"
echo "   - Health: http://localhost:8080/api/satellite/health"
echo "   - Image Processing: http://localhost:8080/api/image/health"
echo ""
echo "Press Ctrl+C to stop the backend"
echo ""
echo "=========================================="
echo ""

# Start the Spring Boot application
mvn spring-boot:run

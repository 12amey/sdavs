# SDAVS — Satellite Data Analysis & Visualization System

SDAVS is an advanced, full-stack satellite monitoring platform designed for real-time environmental analysis, vegetation health monitoring, and environmental risk assessment. It leverages real-world data from the ESA Copernicus Sentinel-2 satellite constellation and NASA natural disaster event tracking.

## 🛰️ Core Features

- **Real-time NDVI Analysis**: Calculate Normalized Difference Vegetation Index (NDVI) for any coordinate to assess vegetation health.
- **Dynamic Area Selection**: Select any region on an interactive map for instant bounding-box analysis.
- **Automated Data Pipelines**: Hourly synchronization of satellite data for major Indian cities.
- **Environmental Risk Assessment**: Automated detection of deforestation risks and potential flood warnings based on NDVI changes.
- **NASA EONET Integration**: Real-time tracking of global natural disaster events (fires, floods, storms) from NASA.
- **ML Predictions**: Future NDVI and climate trend forecasting using trained Machine Learning models.
- **Interactive Dashboards**: Modern, high-performance UI built with React and Tailwind CSS.
- **Comprehensive Reporting**: Export professional PDF reports of environmental analysis.

## 🛠️ Technology Stack

- **Backend**: Spring Boot 3.2 (Java 23), Hibernate, Spring Security, OAuth 2.0.
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Leaflet, Framer Motion.
- **Database**: PostgreSQL (Cloud-hosted via Supabase).
- **Machine Learning**: Python (scikit-learn, rasterio, numpy) for COG processing and forecasting.
- **Data APIs**: 
  - ESA/Copernicus Sentinel-2 via Element84 STAC API.
  - NASA Earth Observatory Natural Event Tracker (EONET).
  - OpenWeatherMap API for site-specific environmental data.

## 🚀 Getting Started

### Prerequisites

- Java 17+ or 21+ (Running on Java 23)
- Node.js & npm/bun
- Python 3.9+

### Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd satllite-8-main
   ```

2. **Configure Database**:
   Update `src/main/resources/application.properties` with your Supabase PostgreSQL credentials.

3. **Install Frontend Dependencies**:
   ```bash
   npm install
   # or
   bun install
   ```

4. **Install Python Service Dependencies**:
   ```bash
   cd python-cog-service
   pip install -r requirements.txt
   ```

### Running the Platform

- **Full Start (Recommended)**:
  Run the `start-all.ps1` (PowerShell) or `start-all.sh` (Bash) script to launch the backend, frontend, and Python ML service simultaneously.

- **Manual Start**:
  - Backend: `mvn spring-boot:run`
  - Frontend: `npm run dev` or `bun run dev`
  - Python Service: `python app.py`

## 📊 Project Architecture

The system follows a modern microservice-inspired architecture:
- **Spring Boot Backend**: Handles business logic, data persistence, and security.
- **React Frontend**: Provides a premium, high-performance user interface.
- **Python ML Service**: Handles heavy geospatial computations and NDVI COG (Cloud Optimized GeoTIFF) processing.
- **Supabase Cloud DB**: Provides scalable PostgreSQL storage.

---

*Developed for Advanced Geospatial Monitoring and Environmental Conservation.*
*© 2026 SDAVS Project Team*

package com.satellite.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.sql.DataSource;
import java.lang.management.ManagementFactory;
import java.sql.Connection;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * API Information and Versioning Controller.
 * Provides project metadata, version info, and system status at a glance.
 */
@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class ApiInfoController {

    @Autowired
    private DataSource dataSource;

    @Value("${app.name:Satellite Data Analysis and Visualization System}")
    private String appName;

    @Value("${app.version:1.0.0}")
    private String appVersion;

    @Value("${satellite.update.enabled:true}")
    private boolean autoUpdateEnabled;

    @Value("${satellite.update.cron:0 0 * * * *}")
    private String updateSchedule;

    /**
     * GET /api/info
     * Returns project metadata — useful for frontend display and presentation
     */
    @GetMapping("/info")
    public ResponseEntity<Map<String, Object>> getApiInfo() {
        Map<String, Object> info = new LinkedHashMap<>();

        // Project info
        info.put("name", appName);
        info.put("acronym", "SDAVS");
        info.put("version", appVersion);
        info.put("description", "Advanced satellite data analysis platform with real-time NDVI monitoring, " +
                "environmental risk assessment, ML predictions, and automated data pipelines.");

        // Tech stack
        info.put("stack", Map.of(
            "backend", "Spring Boot 3.2 (Java 17)",
            "frontend", "React 18 + TypeScript + Vite",
            "database", "PostgreSQL (Supabase)",
            "ml", "Python (scikit-learn, rasterio)",
            "dataSources", new String[]{
                "Sentinel-2 L2A (ESA Copernicus)",
                "NASA EONET (Natural Events)",
                "OpenWeatherMap API",
                "STAC API (Element84)"
            }
        ));

        // Features
        info.put("features", new String[]{
            "Real-time NDVI vegetation analysis",
            "Dynamic area selection & bounding box analysis",
            "Sentinel-2 satellite imagery processing",
            "Environmental monitoring (AQI, Temperature, Flood Risk)",
            "Deforestation detection & alerting",
            "NASA disaster event tracking (EONET)",
            "ML-based NDVI & climate predictions",
            "Automated hourly data updates",
            "Role-based access control",
            "PDF report generation",
            "Google OAuth 2.0 integration"
        });

        // System status
        long uptimeMs = ManagementFactory.getRuntimeMXBean().getUptime();
        Duration uptime = Duration.ofMillis(uptimeMs);
        info.put("uptime", String.format("%dd %dh %dm %ds",
            uptime.toDays(), uptime.toHoursPart(), uptime.toMinutesPart(), uptime.toSecondsPart()));

        info.put("autoUpdate", Map.of(
            "enabled", autoUpdateEnabled,
            "schedule", updateSchedule
        ));

        // Database status
        try (Connection conn = dataSource.getConnection()) {
            info.put("database", "connected");
        } catch (Exception e) {
            info.put("database", "disconnected");
        }

        info.put("timestamp", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));

        return ResponseEntity.ok(info);
    }

    /**
     * GET /api/ping
     * Simple health check for monitoring
     */
    @GetMapping("/ping")
    public ResponseEntity<String> ping() {
        return ResponseEntity.ok("pong");
    }
}

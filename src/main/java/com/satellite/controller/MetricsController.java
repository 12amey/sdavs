package com.satellite.controller;

import com.satellite.repository.DataUpdateLogRepository;
import com.satellite.repository.SatelliteDataRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.sql.DataSource;
import java.lang.management.ManagementFactory;
import java.lang.management.MemoryMXBean;
import java.sql.Connection;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/metrics")
@CrossOrigin(origins = "*")
public class MetricsController {
    
    @Autowired
    private DataSource dataSource;
    
    @Autowired
    private SatelliteDataRepository satelliteRepository;
    
    @Autowired
    private DataUpdateLogRepository updateLogRepository;
    
    /**
     * Comprehensive health check endpoint
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> healthCheck() {
        Map<String, Object> health = new HashMap<>();
        
        try {
            // Database health
            long dbStart = System.currentTimeMillis();
            try (Connection conn = dataSource.getConnection()) {
                long dbTime = System.currentTimeMillis() - dbStart;
                health.put("database", Map.of(
                    "status", "UP",
                    "responseTime", dbTime + "ms"
                ));
            }
            
            // Data freshness
            updateLogRepository.findLatestUpdate().ifPresent(log -> {
                Duration age = Duration.between(log.getUpdateTimestamp(), LocalDateTime.now());
                health.put("lastDataUpdate", Map.of(
                    "timestamp", log.getUpdateTimestamp(),
                    "hoursAgo", age.toHours(),
                    "citiesUpdated", log.getCitiesUpdated(),
                    "status", log.getStatus()
                ));
            });
            
            // Memory status
            MemoryMXBean memoryBean = ManagementFactory.getMemoryMXBean();
            long usedMemory = memoryBean.getHeapMemoryUsage().getUsed() / (1024 * 1024);
            long maxMemory = memoryBean.getHeapMemoryUsage().getMax() / (1024 * 1024);
            health.put("memory", Map.of(
                "used", usedMemory + "MB",
                "max", maxMemory + "MB",
                "usage", (usedMemory * 100 / maxMemory) + "%"
            ));
            
            // Application uptime
            long uptime = ManagementFactory.getRuntimeMXBean().getUptime() / 1000;
            health.put("uptime", uptime + " seconds");
            
            health.put("status", "HEALTHY");
            return ResponseEntity.ok(health);
            
        } catch (Exception e) {
            health.put("status", "UNHEALTHY");
            health.put("error", e.getMessage());
            return ResponseEntity.status(503).body(health);
        }
    }
    
    /**
     * Database statistics
     */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        Map<String, Object> stats = new HashMap<>();
        
        try {
            long totalRecords = satelliteRepository.count();
            stats.put("totalRecords", totalRecords);
            
            // Count distinct cities
            stats.put("cities", satelliteRepository.findAll().stream()
                .map(d -> d.getCity())
                .filter(c -> c != null)
                .distinct()
                .count());
            
            // Classification breakdown
            Map<String, Long> classifications = new HashMap<>();
            satelliteRepository.findAll().forEach(data -> {
                if (data.getClassification() != null) {
                    String classification = data.getClassification().name();
                    classifications.put(classification, 
                        classifications.getOrDefault(classification, 0L) + 1);
                }
            });
            stats.put("classifications", classifications);
            
            stats.put("status", "SUCCESS");
            return ResponseEntity.ok(stats);
            
        } catch (Exception e) {
            stats.put("status", "ERROR");
            stats.put("error", e.getMessage());
            return ResponseEntity.status(500).body(stats);
        }
    }
    
    /**
     * Performance metrics
     */
    @GetMapping("/performance")
    public ResponseEntity<Map<String, Object>> getPerformanceMetrics() {
        Map<String, Object> metrics = new HashMap<>();
        
        // Thread info
        ThreadGroup rootGroup = Thread.currentThread().getThreadGroup();
        metrics.put("activeThreads", rootGroup.activeCount());
        
        // Memory details
        Runtime runtime = Runtime.getRuntime();
        metrics.put("memory", Map.of(
            "free", runtime.freeMemory() / (1024 * 1024) + "MB",
            "total", runtime.totalMemory() / (1024 * 1024) + "MB",
            "max", runtime.maxMemory() / (1024 * 1024) + "MB"
        ));
        
        // System load
        try {
            double load = ManagementFactory.getOperatingSystemMXBean().getSystemLoadAverage();
            metrics.put("systemLoad", load);
        } catch (Exception e) {
            metrics.put("systemLoad", "unavailable");
        }
        
        return ResponseEntity.ok(metrics);
    }
}

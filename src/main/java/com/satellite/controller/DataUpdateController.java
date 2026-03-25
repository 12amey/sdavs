package com.satellite.controller;

import com.satellite.model.DataUpdateLog;
import com.satellite.repository.DataUpdateLogRepository;
import com.satellite.service.ScheduledDataUpdateService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Controller for managing automated database updates
 */
@RestController
@RequestMapping("/api/updates")
@CrossOrigin(origins = "*")
public class DataUpdateController {
    
    private static final Logger logger = LoggerFactory.getLogger(DataUpdateController.class);
    
    @Autowired
    private ScheduledDataUpdateService updateService;
    
    @Autowired
    private DataUpdateLogRepository updateLogRepository;
    
    @Value("${satellite.update.enabled:true}")
    private boolean updateEnabled;
    
    @Value("${satellite.update.cron:0 0 * * * *}")
    private String updateCron;
    
    /**
     * GET /api/updates/status
     * Check the automated update system status
     */
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getUpdateStatus() {
        logger.info("Fetching update status");
        
        Map<String, Object> status = new HashMap<>();
        status.put("enabled", updateEnabled);
        status.put("schedule", updateCron);
        status.put("scheduleDescription", getCronDescription(updateCron));
        
        // Get last update log
        List<DataUpdateLog> recentLogs = updateLogRepository.findTop5ByOrderByUpdateTimestampDesc();
        if (!recentLogs.isEmpty()) {
            DataUpdateLog lastLog = recentLogs.get(0);
            status.put("lastUpdate", lastLog.getUpdateTimestamp());
            status.put("lastStatus", lastLog.getStatus());
            status.put("citiesUpdated", lastLog.getCitiesUpdated());
            status.put("errors", lastLog.getErrors());
        } else {
            status.put("lastUpdate", null);
            status.put("message", "No updates have run yet");
        }
        
        status.put("recentLogs", recentLogs);
        
        return ResponseEntity.ok(status);
    }
    
    /**
     * POST /api/updates/trigger
     * Manually trigger a database update now
     */
    @PostMapping("/trigger")
    public ResponseEntity<Map<String, Object>> triggerUpdate() {
        logger.info("Manual update triggered");
        
        if (!updateEnabled) {
            return ResponseEntity.badRequest()
                .body(Map.of(
                    "success", false,
                    "message", "Automated updates are disabled in configuration"
                ));
        }
        
        try {
            LocalDateTime startTime = LocalDateTime.now();
            DataUpdateLog log = updateService.updateAllCities();
            LocalDateTime endTime = LocalDateTime.now();
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Update completed successfully");
            response.put("startTime", startTime);
            response.put("endTime", endTime);
            response.put("citiesUpdated", log.getCitiesUpdated());
            response.put("status", log.getStatus());
            response.put("errors", log.getErrors());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Manual update failed", e);
            return ResponseEntity.internalServerError()
                .body(Map.of(
                    "success", false,
                    "message", "Update failed: " + e.getMessage(),
                    "error", e.toString()
                ));
        }
    }
    
    /**
     * GET /api/updates/history
     * Get update history logs
     */
    @GetMapping("/history")
    public ResponseEntity<List<DataUpdateLog>> getUpdateHistory(
            @RequestParam(defaultValue = "10") int limit) {
        logger.info("Fetching update history (limit: {})", limit);
        
        List<DataUpdateLog> logs;
        if (limit <= 10) {
            logs = updateLogRepository.findTop10ByOrderByUpdateTimestampDesc();
        } else {
            logs = updateLogRepository.findAll()
                .stream()
                .sorted((a, b) -> b.getUpdateTimestamp().compareTo(a.getUpdateTimestamp()))
                .limit(limit)
                .toList();
        }
        
        return ResponseEntity.ok(logs);
    }
    
    /**
     * GET /api/updates/next-run
     * Get information about when the next scheduled update will run
     */
    @GetMapping("/next-run")
    public ResponseEntity<Map<String, Object>> getNextRunInfo() {
        Map<String, Object> info = new HashMap<>();
        info.put("enabled", updateEnabled);
        info.put("schedule", updateCron);
        info.put("description", getCronDescription(updateCron));
        
        // Get last run time
        List<DataUpdateLog> recentLogs = updateLogRepository.findTop1ByOrderByUpdateTimestampDesc();
        if (!recentLogs.isEmpty()) {
            info.put("lastRun", recentLogs.get(0).getUpdateTimestamp());
        }
        
        // Calculate next run (approximation)
        String nextRunEstimate = estimateNextRun(updateCron);
        info.put("nextRunEstimate", nextRunEstimate);
        
        return ResponseEntity.ok(info);
    }
    
    /**
     * Convert CRON expression to human-readable description
     */
    private String getCronDescription(String cron) {
        if (cron == null) return "Unknown";
        
        // Parse basic CRON patterns
        if (cron.equals("0 0 * * * *")) {
            return "Every hour";
        } else if (cron.equals("0 */15 * * * *")) {
            return "Every 15 minutes";
        } else if (cron.equals("0 */30 * * * *")) {
            return "Every 30 minutes";
        } else if (cron.equals("0 0 */6 * * *")) {
            return "Every 6 hours";
        } else if (cron.equals("0 0 */12 * * *")) {
            return "Every 12 hours";
        } else if (cron.equals("0 0 0 * * *")) {
            return "Daily at midnight";
        } else if (cron.equals("0 0 2 * * SUN")) {
            return "Weekly on Sunday at 2 AM";
        } else if (cron.equals("0 0 2 * * *")) {
            return "Daily at 2 AM";
        } else {
            return "Custom schedule: " + cron;
        }
    }
    
    /**
     * Estimate when the next scheduled run will occur
     */
    private String estimateNextRun(String cron) {
        if (cron == null) return "Unknown";
        
        if (cron.equals("0 0 * * * *")) {
            return "Within the next hour";
        } else if (cron.equals("0 */15 * * * *")) {
            return "Within the next 15 minutes";
        } else if (cron.equals("0 */30 * * * *")) {
            return "Within the next 30 minutes";
        } else if (cron.equals("0 0 */6 * * *")) {
            return "Within the next 6 hours";
        } else {
            return "Check schedule configuration";
        }
    }
}

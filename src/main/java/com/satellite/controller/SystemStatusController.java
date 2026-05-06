package com.satellite.controller;

import com.satellite.service.ScheduledDataUpdateService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/system")
@CrossOrigin(origins = "*")
public class SystemStatusController {

    @Autowired
    private ScheduledDataUpdateService dataUpdateService;

    @PostMapping("/sync-data")
    public ResponseEntity<?> triggerManualUpdate() {
        try {
            // Run in background
            new Thread(() -> dataUpdateService.scheduledUpdate()).start();
            return ResponseEntity.ok(Map.of("message", "Data update triggered in background. Cities will appear in Climate Hub as they are processed."));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }
}

package com.satellite.controller;

import com.satellite.model.DisasterEvent;
import com.satellite.service.EONETService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/disasters")
@CrossOrigin(origins = "*")
public class DisasterController {
    
    @Autowired
    private EONETService eonetService;
    
    /**
     * Get all active disaster events
     */
    @GetMapping
    public ResponseEntity<List<DisasterEvent>> getAllDisasters() {
        List<DisasterEvent> events = eonetService.getAllActiveEvents();
        return ResponseEntity.ok(events);
    }
    
    /**
     * Get disasters in specific geographic bounds
     */
    @GetMapping("/bounds")
    public ResponseEntity<List<DisasterEvent>> getDisastersInBounds(
            @RequestParam Double minLat,
            @RequestParam Double maxLat,
            @RequestParam Double minLon,
            @RequestParam Double maxLon) {
        
        List<DisasterEvent> events = eonetService.getEventsInBounds(minLat, maxLat, minLon, maxLon);
        return ResponseEntity.ok(events);
    }
    
    /**
     * Get disasters by category
     */
    @GetMapping("/category/{category}")
    public ResponseEntity<List<DisasterEvent>> getDisastersByCategory(@PathVariable String category) {
        List<DisasterEvent> events = eonetService.getEventsByCategory(category);
        return ResponseEntity.ok(events);
    }
    
    /**
     * Manually trigger disaster sync
     */
    @PostMapping("/sync")
    public ResponseEntity<String> syncDisasters() {
        eonetService.syncDisasterEvents();
        return ResponseEntity.ok("Disaster sync triggered successfully");
    }
}

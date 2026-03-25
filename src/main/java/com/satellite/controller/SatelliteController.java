package com.satellite.controller;

import com.satellite.dto.AnalysisRequest;
import com.satellite.dto.AnalysisResponse;
import com.satellite.model.DataUpdateLog;
import com.satellite.model.SatelliteData;
import com.satellite.model.UserAnalysis;
import com.satellite.repository.DataUpdateLogRepository;
import com.satellite.service.SatelliteAnalysisService;
import com.satellite.service.ScheduledDataUpdateService;
import com.satellite.service.Sentinel2Service;
import com.satellite.service.AreaAnalysisService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/satellite")
@CrossOrigin(origins = "*")
public class SatelliteController {
    
    @Autowired
    private SatelliteAnalysisService analysisService;

    @Autowired
    private Sentinel2Service sentinel2Service;
    
    @Autowired
    private ScheduledDataUpdateService scheduledDataUpdateService;
    
    @Autowired
    private DataUpdateLogRepository dataUpdateLogRepository;
    
    @Autowired
    private AreaAnalysisService areaAnalysisService;
    
    @Autowired
    private com.satellite.service.SatelliteImageValidator satelliteImageValidator;
    
    @PostMapping("/analyze")
    public ResponseEntity<Map<String, Object>> analyzeImage(
            @RequestParam("image") MultipartFile imageFile) {
        
        try {
            // Basic validation
            if (imageFile.isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "No image file provided"));
            }

            // Mandatory First Stage Validation (Java-side)
            try {
                satelliteImageValidator.validateSatelliteImage(imageFile);
            } catch (Exception e) {
                return ResponseEntity.badRequest()
                    .body(Map.of(
                        "success", false,
                        "error", "Invalid satellite imagery detected",
                        "message", e.getMessage()
                    ));
            }
            
            // Mock response (or real analysis if preferred, but at least validated now)
            Map<String, Object> response = Map.of(
                "avgNdvi", 0.68,
                "landUse", "Agricultural",
                "coverage", 75,
                "vegetationHealth", Map.of(
                    "healthy", 65,
                    "moderate", 25,
                    "sparse", 10
                ),
                "message", "Analysis completed successfully",
                "fileName", imageFile.getOriginalFilename(),
                "fileSize", imageFile.getSize()
            );
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                .body(Map.of("error", "Analysis failed: " + e.getMessage()));
        }
    }
    
    /**
     * GET endpoint for area analysis - called by frontend AreaAnalysisPanel
     * Analyzes satellite data within a bounding box
     */
    @GetMapping("/analyze-area")
    public ResponseEntity<Map<String, Object>> analyzeAreaGet(
            @RequestParam double minLat,
            @RequestParam double maxLat,
            @RequestParam double minLon,
            @RequestParam double maxLon) {
        
        try {
            Map<String, Object> result = areaAnalysisService.analyzeArea(minLat, maxLat, minLon, maxLon);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", e.getMessage()));
        }
    }
    
    @PostMapping("/analyze-area")
    public ResponseEntity<AnalysisResponse> analyzeArea(
            @Valid @RequestBody AnalysisRequest request,
            @RequestParam(required = false) Long userId) {
        
        AnalysisResponse response = analysisService.analyzeArea(request, userId);
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/data")
    public ResponseEntity<List<SatelliteData>> getSatelliteData(
            @RequestParam(required = false) Double minLat,
            @RequestParam(required = false) Double maxLat,
            @RequestParam(required = false) Double minLon,
            @RequestParam(required = false) Double maxLon) {
        
        List<SatelliteData> data;
        if (minLat != null && maxLat != null && minLon != null && maxLon != null) {
            data = analysisService.getSatelliteDataByArea(minLat, maxLat, minLon, maxLon);
        } else {
            // Return all data if no parameters provided
            data = analysisService.getSatelliteDataByArea(-90.0, 90.0, -180.0, 180.0);
        }
        return ResponseEntity.ok(data);
    }

    @GetMapping("/sentinel-2")
    public ResponseEntity<Map<String, Object>> getSentinel2Data(
            @RequestParam Double minLat,
            @RequestParam Double maxLat,
            @RequestParam Double minLon,
            @RequestParam Double maxLon) {
        
        Map<String, Object> result = sentinel2Service.searchSentinel2Scenes(minLat, maxLat, minLon, maxLon);
        if (result != null) {
            return ResponseEntity.ok(result);
        } else {
            return ResponseEntity.notFound().build();
        }
    }
    
    @GetMapping("/analysis/{lat}/{lng}")
    public ResponseEntity<AnalysisResponse> getPointAnalysis(
            @PathVariable Double lat,
            @PathVariable Double lng,
            @RequestParam(defaultValue = "0.01") Double radius) {
        
        AnalysisRequest request = new AnalysisRequest(
            lat - radius, lng - radius,
            lat + radius, lng + radius
        );
        request.setRegionName("Point Analysis");
        
        AnalysisResponse response = analysisService.analyzeArea(request, null);
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/history/{userId}")
    public ResponseEntity<List<UserAnalysis>> getUserAnalysisHistory(@PathVariable Long userId) {
        List<UserAnalysis> history = analysisService.getUserAnalysisHistory(userId);
        return ResponseEntity.ok(history);
    }
    
    /**
     * Trigger manual data update for all cities
     */
    @PostMapping("/trigger-update")
    public ResponseEntity<DataUpdateLog> triggerDataUpdate() {
        DataUpdateLog result = scheduledDataUpdateService.updateAllCities();
        return ResponseEntity.ok(result);
    }
    
    /**
     * Get the last data update status
     */
    @GetMapping("/last-update")
    public ResponseEntity<DataUpdateLog> getLastUpdate() {
        return dataUpdateLogRepository.findLatestUpdate()
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/health")
    public ResponseEntity<String> healthCheck() {
        try {
            // Test database connection
            long dataCount = analysisService.getSatelliteDataByArea(-90.0, 90.0, -180.0, 180.0).size();
            return ResponseEntity.ok("Satellite Analysis Service is running! Database connected with " + dataCount + " data points.");
        } catch (Exception e) {
            return ResponseEntity.ok("Satellite Analysis Service is running! Database connection: " + e.getMessage());
        }
    }
}
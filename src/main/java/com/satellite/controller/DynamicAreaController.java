package com.satellite.controller;

import com.satellite.model.AreaAnalysisResult;
import com.satellite.service.DynamicAreaAnalysisService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * Controller for dynamic area analysis
 * Allows users to select ANY area on map and get real-time analysis
 */
@RestController
@RequestMapping("/api/analysis")
@CrossOrigin(origins = "*")
public class DynamicAreaController {
    
    private static final Logger logger = LoggerFactory.getLogger(DynamicAreaController.class);
    
    @Autowired
    private DynamicAreaAnalysisService analysisService;
    
    /**
     * POST /api/analysis/area
     * Analyze any selected area on-demand
     */
    @PostMapping("/area")
    public ResponseEntity<AreaAnalysisResult> analyzeArea(@RequestBody Map<String, Object> request) {
        logger.info("Received area analysis request: {}", request);
        
        try {
            // Extract bounding box coordinates
            double minLat = getDoubleValue(request, "minLat");
            double maxLat = getDoubleValue(request, "maxLat");
            double minLon = getDoubleValue(request, "minLon");
            double maxLon = getDoubleValue(request, "maxLon");
            String areaName = (String) request.getOrDefault("areaName", "Selected Area");
            
            // Validate coordinates
            if (!isValidCoordinates(minLat, maxLat, minLon, maxLon)) {
                AreaAnalysisResult errorResult = new AreaAnalysisResult();
                errorResult.setSuccess(false);
                errorResult.setErrorMessage("Invalid coordinates provided");
                return ResponseEntity.badRequest().body(errorResult);
            }
            
            // Perform analysis
            AreaAnalysisResult result = analysisService.analyzeArea(
                minLat, maxLat, minLon, maxLon, areaName
            );
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            logger.error("Error analyzing area", e);
            AreaAnalysisResult errorResult = new AreaAnalysisResult();
            errorResult.setSuccess(false);
            errorResult.setErrorMessage("Analysis failed: " + e.getMessage());
            return ResponseEntity.internalServerError().body(errorResult);
        }
    }
    
    /**
     * GET /api/analysis/info
     * Get information about the dynamic analysis system
     */
    @GetMapping("/info")
    public ResponseEntity<Map<String, Object>> getSystemInfo() {
        Map<String, Object> info = new HashMap<>();
        info.put("service", "Dynamic Area Analysis");
        info.put("description", "Analyze any geographic area on-demand using real satellite data");
        info.put("coverage", "Global (optimized for India)");
        info.put("dataSources", Map.of(
            "satellite", "Sentinel-2 via AWS STAC API",
            "disasters", "NASA EONET",
            "weather", "OpenWeatherMap",
            "airQuality", "OpenWeatherMap"
        ));
        info.put("features", new String[]{
            "Real-time satellite imagery analysis",
            "NDVI vegetation index calculation",
            "Environmental data (temperature, humidity, AQI)",
            "Natural disaster tracking",
            "Risk assessment (flood, deforestation, pollution)"
        });
        info.put("limitations", Map.of(
            "satelliteImagery", "Dependent on cloud cover and satellite pass frequency (every 5 days)",
            "weatherData", "Requires OpenWeatherMap API key for full functionality",
            "storage", "Results not stored by default - analyze on-demand"
        ));
        
        return ResponseEntity.ok(info);
    }
    
    /**
     * GET /api/analysis/example-areas
     * Get example areas for testing
     */
    @GetMapping("/example-areas")
    public ResponseEntity<Map<String, Object>> getExampleAreas() {
        Map<String, Object> examples = new HashMap<>();
        
        examples.put("Mumbai", Map.of(
            "minLat", 18.89, "maxLat", 19.27,
            "minLon", 72.77, "maxLon", 72.98,
            "description", "Mumbai metropolitan area"
        ));
        
        examples.put("Bangalore", Map.of(
            "minLat", 12.83, "maxLat", 13.14,
            "minLon", 77.46, "maxLon", 77.75,
            "description", "Bangalore city"
        ));
        
        examples.put("Delhi", Map.of(
            "minLat", 28.40, "maxLat", 28.88,
            "minLon", 76.84, "maxLon", 77.35,
            "description", "Delhi NCR region"
        ));
        
        examples.put("Western Ghats", Map.of(
            "minLat", 15.0, "maxLat", 16.0,
            "minLon", 73.5, "maxLon", 74.5,
            "description", "Biodiversity hotspot"
        ));
        
        examples.put("Sundarbans", Map.of(
            "minLat", 21.5, "maxLat", 22.5,
            "minLon", 88.5, "maxLon", 89.5,
            "description", "Mangrove forest region"
        ));
        
        return ResponseEntity.ok(examples);
    }
    
    /**
     * Helper: Extract double value from request map
     */
    private double getDoubleValue(Map<String, Object> map, String key) {
        Object value = map.get(key);
        if (value instanceof Number) {
            return ((Number) value).doubleValue();
        } else if (value instanceof String) {
            return Double.parseDouble((String) value);
        }
        throw new IllegalArgumentException("Invalid value for " + key);
    }
    
    /**
     * Helper: Validate coordinates
     */
    private boolean isValidCoordinates(double minLat, double maxLat, double minLon, double maxLon) {
        return minLat >= -90 && minLat <= 90 &&
               maxLat >= -90 && maxLat <= 90 &&
               minLon >= -180 && minLon <= 180 &&
               maxLon >= -180 && maxLon <= 180 &&
               minLat < maxLat &&
               minLon < maxLon;
    }
}

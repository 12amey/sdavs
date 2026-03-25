package com.satellite.controller;

import com.satellite.service.MLPredictionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/ml")
@CrossOrigin(origins = "*")
public class MLController {
    
    @Autowired
    private MLPredictionService mlService;
    
    @GetMapping("/predict/ndvi")
    public ResponseEntity<Map<String, Object>> predictNDVI(
            @RequestParam Double lat,
            @RequestParam Double lng,
            @RequestParam(defaultValue = "12") int months) {
        
        Map<String, Object> prediction = mlService.predictFutureNDVI(lat, lng, months);
        return ResponseEntity.ok(prediction);
    }
    
    @GetMapping("/predict/deforestation")
    public ResponseEntity<Map<String, Object>> predictDeforestation(
            @RequestParam Double minLat,
            @RequestParam Double maxLat,
            @RequestParam Double minLon,
            @RequestParam Double maxLon) {
        
        Map<String, Object> riskAssessment = mlService.predictDeforestationRisk(minLat, maxLat, minLon, maxLon);
        return ResponseEntity.ok(riskAssessment);
    }
    
    @GetMapping("/predict/climate")
    public ResponseEntity<Map<String, Object>> predictClimateImpact(
            @RequestParam Double lat,
            @RequestParam Double lng,
            @RequestParam(defaultValue = "10") int years) {
        
        Map<String, Object> climateImpact = mlService.predictClimateImpact(lat, lng, years);
        return ResponseEntity.ok(climateImpact);
    }
    
    @GetMapping("/health")
    public ResponseEntity<String> healthCheck() {
        return ResponseEntity.ok("ML Prediction Service is running!");
    }
}
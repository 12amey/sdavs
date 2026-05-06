package com.satellite.controller;

import com.satellite.model.*;
import com.satellite.service.*;
import com.satellite.repository.SatelliteDataRepository;
import java.util.HashMap;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/environment")
@CrossOrigin(origins = "*")
public class EnvironmentalController {
    
    @Autowired
    private DeforestationService deforestationService;
    
    @Autowired
    private FloodService floodService;
    
    @Autowired
    private AqiService aqiService;
    
    @Autowired
    private RiskScoringService riskScoringService;

    @Autowired
    private SatelliteDataRepository satelliteDataRepository;
    
    // ==================== Deforestation Endpoints ====================
    
    @PostMapping("/deforestation/detect/{cityName}")
    public ResponseEntity<?> detectDeforestation(@PathVariable String cityName) {
        try {
            List<DeforestationAlert> alerts = deforestationService.detectDeforestation(cityName);
            return ResponseEntity.ok(alerts);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }
    
    @GetMapping("/deforestation/risk/{cityName}")
    public ResponseEntity<?> getDeforestationRisk(@PathVariable String cityName) {
        try {
            Map<String, Object> risk = deforestationService.getRiskForCity(cityName);
            return ResponseEntity.ok(risk);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }
    
    @GetMapping("/deforestation/trend/{cityName}")
    public ResponseEntity<?> getDeforestationTrend(@PathVariable String cityName) {
        try {
            List<SatelliteData> trend = deforestationService.getNdviTrend(cityName);
            return ResponseEntity.ok(trend);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }
    
    // ==================== Flood/NDWI Endpoints ====================
    
    @PostMapping("/flood/detect/{cityName}")
    public ResponseEntity<?> detectFloodRisk(@PathVariable String cityName) {
        try {
            Map<String, Object> risk = floodService.detectFloodRisk(cityName);
            return ResponseEntity.ok(risk);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }
    
    @GetMapping("/flood/ndwi/{cityName}")
    public ResponseEntity<?> getNdwiTrend(@PathVariable String cityName) {
        try {
            List<NdwiData> trend = floodService.getNdwiTrend(cityName);
            return ResponseEntity.ok(trend);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }
    
    @GetMapping("/flood/alerts")
    public ResponseEntity<?> getActiveFloodAlerts() {
        try {
            List<FloodAlert> alerts = floodService.getActiveAlerts();
            return ResponseEntity.ok(alerts);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }
    
    // ==================== AQI Endpoints ====================
    
    @PostMapping("/aqi/fetch/{cityName}")
    public ResponseEntity<?> fetchAqi(
            @PathVariable String cityName,
            @RequestParam double latitude,
            @RequestParam double longitude) {
        try {
            AqiData aqi = aqiService.fetchAndStoreAqi(cityName, latitude, longitude);
            if (aqi != null) {
                return ResponseEntity.ok(aqi);
            } else {
                return ResponseEntity.status(503).body(Map.of("error", "Failed to fetch AQI data from external API"));
            }
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }
    
    @GetMapping("/aqi/current/{cityName}")
    public ResponseEntity<?> getCurrentAqi(@PathVariable String cityName) {
        try {
            return aqiService.getLatestAqi(cityName)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }
    
    @GetMapping("/aqi/trend/{cityName}")
    public ResponseEntity<?> getAqiTrend(@PathVariable String cityName) {
        try {
            List<AqiData> trend = aqiService.get7DayTrend(cityName);
            return ResponseEntity.ok(trend);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }
    
    // ==================== Risk Scoring Endpoints ====================
    
    @PostMapping("/risk/calculate/{cityName}")
    public ResponseEntity<?> calculateRisk(@PathVariable String cityName) {
        try {
            EnvironmentalRisk risk = riskScoringService.calculateRiskScore(cityName);
            return ResponseEntity.ok(risk);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }
    
    @GetMapping("/risk/{cityName}")
    public ResponseEntity<?> getRisk(@PathVariable String cityName) {
        try {
            EnvironmentalRisk risk = riskScoringService.calculateRiskScore(cityName);
            return ResponseEntity.ok(risk);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }
    
    @GetMapping("/risk/all")
    public ResponseEntity<?> getAllRisks() {
        try {
            List<EnvironmentalRisk> risks = riskScoringService.getAllRisks();
            return ResponseEntity.ok(risks);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }
    @GetMapping("/cities")
    public ResponseEntity<List<String>> getAvailableCities() {
        try {
            return ResponseEntity.ok(satelliteDataRepository.findDistinctCities());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/ml/history/{cityName}")
    public ResponseEntity<?> getMlHistory(@PathVariable String cityName) {
        try {
            Map<String, Object> history = new HashMap<>();
            
            // 1. NDVI & Temperature History
            List<SatelliteData> satelliteHistory = satelliteDataRepository.findByCity(cityName);
            
            // 2. AQI History
            List<AqiData> aqiHistory = aqiService.get7DayTrend(cityName);
            
            // 3. NDWI History
            List<NdwiData> ndwiHistory = floodService.getNdwiTrend(cityName);
            
            history.put("satellite", satelliteHistory);
            history.put("aqi", aqiHistory);
            history.put("ndwi", ndwiHistory);
            
            return ResponseEntity.ok(history);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }
}

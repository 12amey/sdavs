package com.satellite.service;

import com.satellite.model.SatelliteData;
import com.satellite.repository.SatelliteDataRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class AreaAnalysisService {
    
    @Autowired
    private SatelliteDataRepository satelliteDataRepository;
    
    /**
     * Analyze satellite data within a bounding box
     * @param minLat Minimum latitude
     * @param maxLat Maximum latitude
     * @param minLon Minimum longitude
     * @param maxLon Maximum longitude
     * @return Map containing analysis results
     */
    public Map<String, Object> analyzeArea(double minLat, double maxLat, double minLon, double maxLon) {
        // Query database for points within bounding box
        List<SatelliteData> points = satelliteDataRepository
                .findByLatitudeBetweenAndLongitudeBetween(minLat, maxLat, minLon, maxLon);
        
        if (points.isEmpty()) {
            throw new RuntimeException("No satellite data found in selected area");
        }
        
        // Calculate statistics
        double avgNdvi = points.stream()
                .mapToDouble(SatelliteData::getNdviValue)
                .average()
                .orElse(0.0);
        
        double minNdvi = points.stream()
                .mapToDouble(SatelliteData::getNdviValue)
                .min()
                .orElse(0.0);
        
        double maxNdvi = points.stream()
                .mapToDouble(SatelliteData::getNdviValue)
                .max()
                .orElse(0.0);
        
        // Count by classification
        long healthyCount = points.stream()
                .filter(p -> p.getNdviValue() > 0.6)
                .count();
        
        long moderateCount = points.stream()
                .filter(p -> p.getNdviValue() >= 0.4 && p.getNdviValue() <= 0.6)
                .count();
        
        long unhealthyCount = points.stream()
                .filter(p -> p.getNdviValue() < 0.4)
                .count();
        
        int totalPoints = points.size();
        
        // Determine overall classification
        String classification;
        if (avgNdvi > 0.6) {
            classification = "HEALTHY";
        } else if (avgNdvi > 0.4) {
            classification = "MODERATE";
        } else {
            classification = "UNHEALTHY";
        }
        
        // Build response
        Map<String, Object> result = new HashMap<>();
        result.put("avgNdvi", Math.round(avgNdvi * 1000.0) / 1000.0);
        result.put("minNdvi", Math.round(minNdvi * 1000.0) / 1000.0);
        result.put("maxNdvi", Math.round(maxNdvi * 1000.0) / 1000.0);
        result.put("healthyPercent", Math.round((healthyCount * 100.0 / totalPoints) * 10.0) / 10.0);
        result.put("moderatePercent", Math.round((moderateCount * 100.0 / totalPoints) * 10.0) / 10.0);
        result.put("unhealthyPercent", Math.round((unhealthyCount * 100.0 / totalPoints) * 10.0) / 10.0);
        result.put("dataPoints", totalPoints);
        result.put("classification", classification);
        
        return result;
    }
}

package com.satellite.service;

import com.satellite.model.FloodAlert;
import com.satellite.model.NdwiData;
import com.satellite.repository.FloodAlertRepository;
import com.satellite.repository.NdwiDataRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class FloodService {
    
    @Autowired
    private NdwiDataRepository ndwiDataRepository;
    
    @Autowired
    private FloodAlertRepository floodAlertRepository;
    
    /**
     * Calculate NDWI from green and NIR bands
     * Formula: NDWI = (Green - NIR) / (Green + NIR)
     * @param green Green band value
     * @param nir Near-infrared band value
     * @return NDWI value (-1 to 1)
     */
    public double calculateNDWI(double green, double nir) {
        if (green + nir == 0) {
            return 0.0;
        }
        return (green - nir) / (green + nir);
    }
    
    /**
     * Detect flood risk by comparing current NDWI with historical data
     * @param cityName City to analyze
     * @return Flood risk assessment
     */
    public Map<String,Object> detectFloodRisk(String cityName) {
        // Get historical NDWI data (last 60 days)
        LocalDateTime sixtyDaysAgo = LocalDateTime.now().minusDays(60);
        List<NdwiData> historicalData = ndwiDataRepository
                .findHistoricalData(cityName, sixtyDaysAgo);
        
        if (historicalData.isEmpty()) {
            Map<String, Object> result = new HashMap<>();
            result.put("status", "NO_DATA");
            result.put("message", "No historical NDWI data available for " + cityName);
            return result;
        }
        
        // Get latest NDWI
        Optional<NdwiData> latestOpt = ndwiDataRepository
                .findFirstByCityNameOrderByAnalysisDateDesc(cityName);
        
        if (latestOpt.isEmpty()) {
            Map<String, Object> result = new HashMap<>();
            result.put("status", "NO_DATA");
            return result;
        }
        
        NdwiData latest = latestOpt.get();
        
        // Calculate average historical water area
        double avgHistoricalWaterArea = historicalData.stream()
                .filter(n -> n.getWaterAreaKm2() != null)
                .mapToDouble(NdwiData::getWaterAreaKm2)
                .average()
                .orElse(0.0);
        
        // Calculate water increase percentage
        double currentWaterArea = latest.getWaterAreaKm2() != null ? latest.getWaterAreaKm2() : 0.0;
        double increasePercent = 0.0;
        
        if (avgHistoricalWaterArea > 0) {
            increasePercent = ((currentWaterArea - avgHistoricalWaterArea) / avgHistoricalWaterArea) * 100;
        }
        
        // Determine alert level
        String alertLevel = null;
        if (increasePercent >= 30.0) {
            alertLevel = "CRITICAL";
        } else if (increasePercent >= 15.0) {
            alertLevel = "WARNING";
        } else if (increasePercent >= 5.0) {
            alertLevel = "WATCH";
        }
        
        // Create alert if threshold exceeded
        if (alertLevel != null) {
            FloodAlert alert = new FloodAlert(cityName, increasePercent, alertLevel);
            alert.setAffectedAreaKm2(currentWaterArea);
            floodAlertRepository.save(alert);
        }
        
        // Build response
        Map<String, Object> result = new HashMap<>();
        result.put("city", cityName);
        result.put("currentWaterArea", currentWaterArea);
        result.put("historicalAvgWaterArea", avgHistoricalWaterArea);
        result.put("increasePercent", Math.round(increasePercent * 10.0) / 10.0);
        result.put("alertLevel", alertLevel != null ? alertLevel : "NORMAL");
        result.put("latestNDWI", latest.getNdwiValue());
        
        return result;
    }
    
    /**
     * Get NDWI trend for a city (last 5 updates)
     * @param cityName City name
     * @return List of NDWI data
     */
    public List<NdwiData> getNdwiTrend(String cityName) {
        List<NdwiData> allData = ndwiDataRepository.findByCityNameOrderByAnalysisDateDesc(cityName);
        // Return only first 5 records
        return allData.size() > 5 ? allData.subList(0, 5) : allData;
    }
    
    /**
     * Get active flood alerts
     * @return List of active alerts
     */
    public List<FloodAlert> getActiveAlerts() {
        return floodAlertRepository.findByIsActiveTrue();
    }
}

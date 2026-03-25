package com.satellite.service;

import com.satellite.model.DeforestationAlert;
import com.satellite.model.SatelliteData;
import com.satellite.repository.DeforestationAlertRepository;
import com.satellite.repository.SatelliteDataRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class DeforestationService {
    
    @Autowired
    private SatelliteDataRepository satelliteDataRepository;
    
    @Autowired
    private DeforestationAlertRepository deforestationAlertRepository;
    
    /**
     * Detect deforestation by comparing current NDVI with historical data
     * @param cityName City to analyze
     * @return List of new alerts created
     */
    public List<DeforestationAlert> detectDeforestation(String cityName) {
        // Get current satellite data for city
        List<SatelliteData> currentData = satelliteDataRepository.findByCityName(cityName);
        
        for (SatelliteData current : currentData) {
            // Check if this point has previous NDVI data
            if (current.getPreviousNdvi() != null && current.getPreviousNdvi() > 0) {
               double currentNdvi = current.getNdviValue();
                double previousNdvi = current.getPreviousNdvi();
                
                // Calculate NDVI drop percentage
                double dropPercent = ((previousNdvi - currentNdvi) / previousNdvi) * 100;
                
                // Determine risk level based on drop  percentage
                String riskLevel = null;
                if (dropPercent >= 15.0) {
                    riskLevel = "HIGH";
                } else if (dropPercent >= 10.0) {
                    riskLevel = "MODERATE";
                } else if (dropPercent >= 5.0) {
                    riskLevel = "LOW";
                }
                
                // Create alert if significant drop detected
                if (riskLevel != null) {
                    DeforestationAlert alert = new DeforestationAlert(
                        cityName,
                        current.getLatitude(),
                        current.getLongitude(),
                        previousNdvi,
                        currentNdvi,
                        riskLevel
                    );
                    deforestationAlertRepository.save(alert);
                }
            }
        }
        
        // Return all active alerts for the city
        return deforestationAlertRepository.findByCityNameAndIsResolvedFalse(cityName);
    }
    
    /**
     * Get deforestation risk level for a city
     * @param cityName City name
     * @return Risk assessment map
     */
    public Map<String, Object> getRiskForCity(String cityName) {
        List<DeforestationAlert> alerts = deforestationAlertRepository
                .findByCityNameAndIsResolvedFalse(cityName);
        
        long highCount = alerts.stream().filter(a -> "HIGH".equals(a.getRiskLevel())).count();
        long moderateCount = alerts.stream().filter(a -> "MODERATE".equals(a.getRiskLevel())).count();
        long lowCount = alerts.stream().filter(a -> "LOW".equals(a.getRiskLevel())).count();
        
        String overallRisk;
        if (highCount > 0) {
            overallRisk = "HIGH";
        } else if (moderateCount > 0) {
            overallRisk = "MODERATE";
        } else if (lowCount > 0) {
            overallRisk = "LOW";
        } else {
            overallRisk = "SAFE";
        }
        
        Map<String, Object> result = new HashMap<>();
        result.put("city", cityName);
        result.put("overallRisk", overallRisk);
        result.put("highAlerts", highCount);
        result.put("moderateAlerts", moderateCount);
        result.put("lowAlerts", lowCount);
        result.put("totalAlerts", alerts.size());
        
        return result;
    }
    
    /**
     * Get 6-month NDVI trend for a city
     * @param cityName City name
     * @return Trend data
     */
    public List<SatelliteData> getNdviTrend(String cityName) {
        // Get historical data for city
        // For simplicity, returning current data
        // In production, this would query time-series data
       return satelliteDataRepository.findByCityName(cityName);
    }
}

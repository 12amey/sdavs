package com.satellite.service;

import com.satellite.model.EnvironmentalRisk;
import com.satellite.model.DeforestationAlert;
import com.satellite.model.FloodAlert;
import com.satellite.model.AqiData;
import com.satellite.model.SatelliteData;
import com.satellite.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class RiskScoringService {
    
    @Autowired
    private EnvironmentalRiskRepository riskRepository;
    
    @Autowired
    private SatelliteDataRepository satelliteDataRepository;
    
    @Autowired
    private DeforestationAlertRepository deforestationAlertRepository;
    
    @Autowired
    private FloodAlertRepository floodAlertRepository;
    
    @Autowired
    private AqiDataRepository aqiDataRepository;
    
    /**
     * Calculate comprehensive environmental risk score for a city
     * @param cityName City to analyze
     * @return EnvironmentalRisk object
     */
    public EnvironmentalRisk calculateRiskScore(String cityName) {
        // Get or create risk record
        EnvironmentalRisk risk = riskRepository.findByCityName(cityName)
                .orElse(new EnvironmentalRisk(cityName));
        
        // 1. Calculate NDVI Score (0-20 points)
        double ndviScore = calculateNdviScore(cityName);
        risk.setNdviScore(ndviScore);
        
        // 2. Calculate Deforestation Score (0-25 points)
        double deforestationScore = calculateDeforestationScore(cityName);
        risk.setDeforestationScore(deforestationScore);
        
        // 3. Calculate Flood Score (0-25 points)
        double floodScore = calculateFloodScore(cityName);
        risk.setFloodScore(floodScore);
        
        // 4. Calculate AQI Score (0-30 points)
        double aqiScore = calculateAqiScore(cityName);
        risk.setAqiScore(aqiScore);
        
        // Calculate total and determine level
        risk.calculateTotalRisk();
        
        // Save and return
        return riskRepository.save(risk);
    }
    
    /**
     * Calculate NDVI score component (0-20 points)
     */
    private double calculateNdviScore(String cityName) {
        List<SatelliteData> data = satelliteDataRepository.findByCityName(cityName);
        
        if (data.isEmpty()) return 0.0;
        
        double avgNdvi = data.stream()
                .mapToDouble(SatelliteData::getNdviValue)
                .average()
                .orElse(0.5);
        
        // Healthy vegetation (NDVI > 0.6): 0 points
        // Moderate (0.4-0.6): 10 points
        // Unhealthy (< 0.4): 20 points
        if (avgNdvi > 0.6) return 0.0;
        else if (avgNdvi > 0.4) return 10.0;
        else return 20.0;
    }
    
    /**
     * Calculate deforestation score component (0-25 points)
     */
    private double calculateDeforestationScore(String cityName) {
        List<DeforestationAlert> alerts = deforestationAlertRepository
                .findByCityNameAndIsResolvedFalse(cityName);
        
        if (alerts.isEmpty()) return 0.0;
        
        long highCount = alerts.stream().filter(a -> "HIGH".equals(a.getRiskLevel())).count();
        long moderateCount = alerts.stream().filter(a -> "MODERATE".equals(a.getRiskLevel())).count();
        long lowCount = alerts.stream().filter(a -> "LOW".equals(a.getRiskLevel())).count();
        
        // High: 25 points, Moderate: 15 points, Low: 8 points
        if (highCount > 0) return 25.0;
        else if (moderateCount > 0) return 15.0;
        else if (lowCount > 0) return 8.0;
        else return 0.0;
    }
    
    /**
     * Calculate flood score component (0-25 points)
     */
    private double calculateFloodScore(String cityName) {
        List<FloodAlert> alerts = floodAlertRepository
                .findByCityNameAndIsActiveTrue(cityName);
        
        if (alerts.isEmpty()) return 0.0;
        
        // Check for highest alert level
        boolean hasCritical = alerts.stream().anyMatch(a -> "CRITICAL".equals(a.getAlertLevel()));
        boolean hasWarning = alerts.stream().anyMatch(a -> "WARNING".equals(a.getAlertLevel()));
        boolean hasWatch = alerts.stream().anyMatch(a -> "WATCH".equals(a.getAlertLevel()));
        
        // Critical: 25 points, Warning: 15 points, Watch: 8 points
        if (hasCritical) return 25.0;
        else if (hasWarning) return 15.0;
        else if (hasWatch) return 8.0;
        else return 0.0;
    }
    
    /**
     * Calculate AQI score component (0-30 points)
     */
    private double calculateAqiScore(String cityName) {
        Optional<AqiData> latestAqiOpt = aqiDataRepository
                .findFirstByCityNameOrderByFetchDateDesc(cityName);
        
        if (latestAqiOpt.isEmpty()) return 0.0;
        
        int aqiValue = latestAqiOpt.get().getAqiValue();
        
        // Good (0-50): 0 points
        // Moderate (51-100): 5 points
        // Poor (101-200): 15 points
        // Very Poor (201-300): 25 points
        // Severe (300+): 30 points
        if (aqiValue <= 50) return 0.0;
        else if (aqiValue <= 100) return 5.0;
        else if (aqiValue <= 200) return 15.0;
        else if (aqiValue <= 300) return 25.0;
        else return 30.0;
    }
    
    /**
     * Get risk scores for all cities
     * @return List of all risk records
     */
    public List<EnvironmentalRisk> getAllRisks() {
        return riskRepository.findAllByOrderByTotalRiskScoreDesc();
    }
}

package com.satellite.service;

import com.satellite.dto.AnalysisRequest;
import com.satellite.dto.AnalysisResponse;
import com.satellite.model.SatelliteData;
import com.satellite.model.UserAnalysis;
import com.satellite.repository.SatelliteDataRepository;
import com.satellite.repository.UserAnalysisRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
@Transactional
public class SatelliteAnalysisService {
    
    @Autowired
    private SatelliteDataRepository satelliteDataRepository;
    
    @Autowired
    private UserAnalysisRepository userAnalysisRepository;
    
    public AnalysisResponse analyzeArea(AnalysisRequest request, Long userId) {
        // Calculate area bounds
        Double minLat = Math.min(request.getStartLatitude(), request.getEndLatitude());
        Double maxLat = Math.max(request.getStartLatitude(), request.getEndLatitude());
        Double minLon = Math.min(request.getStartLongitude(), request.getEndLongitude());
        Double maxLon = Math.max(request.getStartLongitude(), request.getEndLongitude());
        
        // Get satellite data for the area from Supabase database
        List<SatelliteData> areaData = satelliteDataRepository.findByCoordinateRange(minLat, maxLat, minLon, maxLon);
        
        if (areaData.isEmpty()) {
            System.out.println("⚠️ No real satellite data found in database for coordinates: " + minLat + "," + minLon + " to " + maxLat + "," + maxLon);
            System.out.println("💡 To populate data: Use Python NDVI backend or upload satellite images via AI Module");
            
            // Return empty analysis response with message
            AnalysisResponse response = new AnalysisResponse();
            response.setStartLatitude(request.getStartLatitude());
            response.setStartLongitude(request.getStartLongitude());
            response.setEndLatitude(request.getEndLatitude());
            response.setEndLongitude(request.getEndLongitude());
            response.setRegionName(request.getRegionName() != null ? request.getRegionName() : "Custom Area");
            response.setAnalysisType(request.getAnalysisType());
            response.setAnalysisDate(LocalDateTime.now());
            response.setAlerts(Arrays.asList(
                "No satellite data available for this region",
                "Upload satellite images via AI Module to analyze this area",
                "Or use Python NDVI backend to fetch Sentinel-2 data"
            ));
            response.setConfidence(0.0);
            return response;
        }
        
        System.out.println("✅ Found " + areaData.size() + " real satellite data points in Supabase database");
        
        // Perform analysis on REAL data
        AnalysisResponse response = performAnalysis(areaData, request);
        
        // Save analysis to database if user is provided
        if (userId != null) {
            saveUserAnalysis(request, response, userId);
        }
        
        return response;
    }
    
    private AnalysisResponse performAnalysis(List<SatelliteData> data, AnalysisRequest request) {
        AnalysisResponse response = new AnalysisResponse();
        
        // Basic calculations
        response.setStartLatitude(request.getStartLatitude());
        response.setStartLongitude(request.getStartLongitude());
        response.setEndLatitude(request.getEndLatitude());
        response.setEndLongitude(request.getEndLongitude());
        response.setRegionName(request.getRegionName() != null ? request.getRegionName() : "Custom Area");
        response.setAnalysisType(request.getAnalysisType());
        response.setAnalysisDate(LocalDateTime.now());
        
        // Calculate area size (approximate)
        double latDiff = Math.abs(request.getEndLatitude() - request.getStartLatitude());
        double lonDiff = Math.abs(request.getEndLongitude() - request.getStartLongitude());
        double areaSizeKm2 = latDiff * lonDiff * 111 * 111; // Rough approximation
        response.setAreaSizeKm2(areaSizeKm2);
        
        // Calculate average NDVI from REAL data
        double avgNdvi = data.stream()
            .mapToDouble(SatelliteData::getNdviValue)
            .average()
            .orElse(0.0);
        response.setAvgNdvi(avgNdvi);
        
        // Calculate land cover breakdown from REAL data
        Map<String, Long> classificationCounts = new HashMap<>();
        for (SatelliteData point : data) {
            String classification = point.getClassification() != null ? point.getClassification().toString() : "UNKNOWN";
            classificationCounts.put(classification, classificationCounts.getOrDefault(classification, 0L) + 1);
        }
        
        Map<String, Double> landCoverBreakdown = new HashMap<>();
        long totalPoints = data.size();
        for (Map.Entry<String, Long> entry : classificationCounts.entrySet()) {
            double percentage = (entry.getValue() * 100.0) / totalPoints;
            landCoverBreakdown.put(entry.getKey().toLowerCase(), percentage);
        }
        response.setLandCoverBreakdown(landCoverBreakdown);
        
        // Calculate forest cover
        double forestCover = landCoverBreakdown.getOrDefault("healthy", 0.0) + 
                           landCoverBreakdown.getOrDefault("moderate", 0.0);
        response.setForestCoverPercent(forestCover);
        
        // Calculate change detection from temporal data
        Map<String, Double> changeDetection = calculateChangeDetection(data);
        response.setChangeDetection(changeDetection);
        
        // Generate alerts based on REAL analysis
        List<String> alerts = new ArrayList<>();
        if (changeDetection.get("forestLoss") > 2.0) {
            alerts.add("⚠️ Significant deforestation detected in the selected area");
        }
        if (changeDetection.get("urbanGrowth") > 2.0) {
            alerts.add("🏙️ Rapid urban expansion observed");
        }
        if (avgNdvi < 0.3) {
            alerts.add("🌡️ Low vegetation health detected - possible drought or degradation");
        }
        if (data.size() > 1000) {
            alerts.add("✅ High-resolution analysis with " + data.size() + " data points");
        }
        response.setAlerts(alerts);
        
        // Set confidence based on data quality and quantity
        double confidence = Math.min(95.0, 60.0 + (data.size() / 100.0) * 10.0);
        response.setConfidence(confidence);
        
        return response;
    }
    
    private Map<String, Double> calculateChangeDetection(List<SatelliteData> data) {
        Map<String, Double> changeDetection = new HashMap<>();
        
        // Sort data by date
        List<SatelliteData> sortedData = new ArrayList<>(data);
        sortedData.sort(Comparator.comparing(SatelliteData::getAnalysisDate));
        
        if (sortedData.size() < 2) {
            // Not enough temporal data for change detection
            changeDetection.put("forestLoss", 0.0);
            changeDetection.put("urbanGrowth", 0.0);
            changeDetection.put("waterChange", 0.0);
            return changeDetection;
        }
        
        // Compare first and last third of data
        int thirdSize = sortedData.size() / 3;
        List<SatelliteData> earlyData = sortedData.subList(0, Math.min(thirdSize, sortedData.size()));
        List<SatelliteData> lateData = sortedData.subList(Math.max(0, sortedData.size() - thirdSize), sortedData.size());
        
        // Calculate changes in classifications
        double earlyForest = countClassification(earlyData, "HEALTHY") + countClassification(earlyData, "MODERATE");
        double lateForest = countClassification(lateData, "HEALTHY") + countClassification(lateData, "MODERATE");
        double forestChange = ((earlyForest - lateForest) / earlyData.size()) * 100.0;
        
        double earlyUrban = countClassification(earlyData, "URBAN");
        double lateUrban = countClassification(lateData, "URBAN");
        double urbanChange = ((lateUrban - earlyUrban) / earlyData.size()) * 100.0;
        
        double earlyWater = countClassification(earlyData, "WATER");
        double lateWater = countClassification(lateData, "WATER");
        double waterChange = ((lateWater - earlyWater) / earlyData.size()) * 100.0;
        
        changeDetection.put("forestLoss", Math.max(0, forestChange));
        changeDetection.put("urbanGrowth", Math.max(0, urbanChange));
        changeDetection.put("waterChange", waterChange);
        
        return changeDetection;
    }
    
    private long countClassification(List<SatelliteData> data, String classification) {
        return data.stream()
            .filter(d -> d.getClassification().toString().equals(classification))
            .count();
    }
    
    private void saveUserAnalysis(AnalysisRequest request, AnalysisResponse response, Long userId) {
        UserAnalysis analysis = new UserAnalysis();
        analysis.setUser(new com.satellite.model.User());
        analysis.getUser().setId(userId);
        analysis.setRegionName(response.getRegionName());
        analysis.setStartLatitude(request.getStartLatitude());
        analysis.setStartLongitude(request.getStartLongitude());
        analysis.setEndLatitude(request.getEndLatitude());
        analysis.setEndLongitude(request.getEndLongitude());
        analysis.setAreaSizeKm2(response.getAreaSizeKm2());
        analysis.setAvgNdvi(response.getAvgNdvi());
        analysis.setForestCoverPercent(response.getForestCoverPercent());
        analysis.setHealthyVegetationPercent(response.getLandCoverBreakdown().getOrDefault("healthy", 0.0));
        analysis.setModerateVegetationPercent(response.getLandCoverBreakdown().getOrDefault("moderate", 0.0));
        analysis.setUnhealthyVegetationPercent(response.getLandCoverBreakdown().getOrDefault("unhealthy", 0.0));
        analysis.setWaterBodiesPercent(response.getLandCoverBreakdown().getOrDefault("water", 0.0));
        analysis.setUrbanAreasPercent(response.getLandCoverBreakdown().getOrDefault("urban", 0.0));
        analysis.setAnalysisType(request.getAnalysisType());
        
        userAnalysisRepository.save(analysis);
        response.setAnalysisId(analysis.getId());
    }
    
    public List<SatelliteData> getSatelliteDataByArea(Double minLat, Double maxLat, Double minLon, Double maxLon) {
        return satelliteDataRepository.findByCoordinateRange(minLat, maxLat, minLon, maxLon);
    }
    
    public List<UserAnalysis> getUserAnalysisHistory(Long userId) {
        return userAnalysisRepository.findTop10ByUserIdOrderByCreatedAtDesc(userId);
    }
}
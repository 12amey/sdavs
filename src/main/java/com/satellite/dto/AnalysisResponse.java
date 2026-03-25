package com.satellite.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public class AnalysisResponse {
    
    private Long analysisId;
    private String regionName;
    private Double startLatitude;
    private Double startLongitude;
    private Double endLatitude;
    private Double endLongitude;
    private Double areaSizeKm2;
    private Double avgNdvi;
    private Double forestCoverPercent;
    private Map<String, Double> landCoverBreakdown;
    private Map<String, Double> changeDetection;
    private List<String> alerts;
    private LocalDateTime analysisDate;
    private String analysisType;
    private Double confidence;
    
    // Constructors
    public AnalysisResponse() {}
    
    // Getters and Setters
    public Long getAnalysisId() { return analysisId; }
    public void setAnalysisId(Long analysisId) { this.analysisId = analysisId; }
    
    public String getRegionName() { return regionName; }
    public void setRegionName(String regionName) { this.regionName = regionName; }
    
    public Double getStartLatitude() { return startLatitude; }
    public void setStartLatitude(Double startLatitude) { this.startLatitude = startLatitude; }
    
    public Double getStartLongitude() { return startLongitude; }
    public void setStartLongitude(Double startLongitude) { this.startLongitude = startLongitude; }
    
    public Double getEndLatitude() { return endLatitude; }
    public void setEndLatitude(Double endLatitude) { this.endLatitude = endLatitude; }
    
    public Double getEndLongitude() { return endLongitude; }
    public void setEndLongitude(Double endLongitude) { this.endLongitude = endLongitude; }
    
    public Double getAreaSizeKm2() { return areaSizeKm2; }
    public void setAreaSizeKm2(Double areaSizeKm2) { this.areaSizeKm2 = areaSizeKm2; }
    
    public Double getAvgNdvi() { return avgNdvi; }
    public void setAvgNdvi(Double avgNdvi) { this.avgNdvi = avgNdvi; }
    
    public Double getForestCoverPercent() { return forestCoverPercent; }
    public void setForestCoverPercent(Double forestCoverPercent) { this.forestCoverPercent = forestCoverPercent; }
    
    public Map<String, Double> getLandCoverBreakdown() { return landCoverBreakdown; }
    public void setLandCoverBreakdown(Map<String, Double> landCoverBreakdown) { this.landCoverBreakdown = landCoverBreakdown; }
    
    public Map<String, Double> getChangeDetection() { return changeDetection; }
    public void setChangeDetection(Map<String, Double> changeDetection) { this.changeDetection = changeDetection; }
    
    public List<String> getAlerts() { return alerts; }
    public void setAlerts(List<String> alerts) { this.alerts = alerts; }
    
    public LocalDateTime getAnalysisDate() { return analysisDate; }
    public void setAnalysisDate(LocalDateTime analysisDate) { this.analysisDate = analysisDate; }
    
    public String getAnalysisType() { return analysisType; }
    public void setAnalysisType(String analysisType) { this.analysisType = analysisType; }
    
    public Double getConfidence() { return confidence; }
    public void setConfidence(Double confidence) { this.confidence = confidence; }
}
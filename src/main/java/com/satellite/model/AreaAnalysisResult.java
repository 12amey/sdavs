package com.satellite.model;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * Result of dynamic area analysis (on-demand, not stored by default)
 */
public class AreaAnalysisResult {
    
    private boolean success;
    private String errorMessage;
    private String areaName;
    private BoundingBox bounds;
    private LocalDateTime analyzedAt;
    
    // Satellite imagery data
    private String satelliteImageUrl;
    private String imageryDate;
    private Double cloudCover;
    
    // NDVI analysis
    private Double ndviMean;
    private String ndviClassification;
    private Map<String, Double> vegetationCoverage; // denseVegetation, urban, water, etc.
    
    // Environmental data
    private Double temperature; // Celsius
    private Integer humidity; // Percentage
    private Integer airQualityIndex;
    private Double pm25;
    private Double pm10;
    
    // Disasters
    private List<Map<String, Object>> disasters;
    
    // Risk assessment
    private Map<String, Object> risks; // flood, deforestation, airPollution, etc.
    
    // Constructors
    public AreaAnalysisResult() {
    }
    
    // Getters and Setters
    public boolean isSuccess() {
        return success;
    }
    
    public void setSuccess(boolean success) {
        this.success = success;
    }
    
    public String getErrorMessage() {
        return errorMessage;
    }
    
    public void setErrorMessage(String errorMessage) {
        this.errorMessage = errorMessage;
    }
    
    public String getAreaName() {
        return areaName;
    }
    
    public void setAreaName(String areaName) {
        this.areaName = areaName;
    }
    
    public BoundingBox getBounds() {
        return bounds;
    }
    
    public void setBounds(BoundingBox bounds) {
        this.bounds = bounds;
    }
    
    public LocalDateTime getAnalyzedAt() {
        return analyzedAt;
    }
    
    public void setAnalyzedAt(LocalDateTime analyzedAt) {
        this.analyzedAt = analyzedAt;
    }
    
    public String getSatelliteImageUrl() {
        return satelliteImageUrl;
    }
    
    public void setSatelliteImageUrl(String satelliteImageUrl) {
        this.satelliteImageUrl = satelliteImageUrl;
    }
    
    public String getImageryDate() {
        return imageryDate;
    }
    
    public void setImageryDate(String imageryDate) {
        this.imageryDate = imageryDate;
    }
    
    public Double getCloudCover() {
        return cloudCover;
    }
    
    public void setCloudCover(Double cloudCover) {
        this.cloudCover = cloudCover;
    }
    
    public Double getNdviMean() {
        return ndviMean;
    }
    
    public void setNdviMean(Double ndviMean) {
        this.ndviMean = ndviMean;
    }
    
    public String getNdviClassification() {
        return ndviClassification;
    }
    
    public void setNdviClassification(String ndviClassification) {
        this.ndviClassification = ndviClassification;
    }
    
    public Map<String, Double> getVegetationCoverage() {
        return vegetationCoverage;
    }
    
    public void setVegetationCoverage(Map<String, Double> vegetationCoverage) {
        this.vegetationCoverage = vegetationCoverage;
    }
    
    public Double getTemperature() {
        return temperature;
    }
    
    public void setTemperature(Double temperature) {
        this.temperature = temperature;
    }
    
    public Integer getHumidity() {
        return humidity;
    }
    
    public void setHumidity(Integer humidity) {
        this.humidity = humidity;
    }
    
    public Integer getAirQualityIndex() {
        return airQualityIndex;
    }
    
    public void setAirQualityIndex(Integer airQualityIndex) {
        this.airQualityIndex = airQualityIndex;
    }
    
    public Double getPm25() {
        return pm25;
    }
    
    public void setPm25(Double pm25) {
        this.pm25 = pm25;
    }
    
    public Double getPm10() {
        return pm10;
    }
    
    public void setPm10(Double pm10) {
        this.pm10 = pm10;
    }
    
    public List<Map<String, Object>> getDisasters() {
        return disasters;
    }
    
    public void setDisasters(List<Map<String, Object>> disasters) {
        this.disasters = disasters;
    }
    
    public Map<String, Object> getRisks() {
        return risks;
    }
    
    public void setRisks(Map<String, Object> risks) {
        this.risks = risks;
    }
}

package com.satellite.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

public class AnalysisRequest {
    
    @NotNull(message = "Start latitude is required")
    @DecimalMin(value = "-90.0", message = "Latitude must be between -90 and 90")
    @DecimalMax(value = "90.0", message = "Latitude must be between -90 and 90")
    private Double startLatitude;
    
    @NotNull(message = "Start longitude is required")
    @DecimalMin(value = "-180.0", message = "Longitude must be between -180 and 180")
    @DecimalMax(value = "180.0", message = "Longitude must be between -180 and 180")
    private Double startLongitude;
    
    @NotNull(message = "End latitude is required")
    @DecimalMin(value = "-90.0", message = "Latitude must be between -90 and 90")
    @DecimalMax(value = "90.0", message = "Latitude must be between -90 and 90")
    private Double endLatitude;
    
    @NotNull(message = "End longitude is required")
    @DecimalMin(value = "-180.0", message = "Longitude must be between -180 and 180")
    @DecimalMax(value = "180.0", message = "Longitude must be between -180 and 180")
    private Double endLongitude;
    
    private String regionName;
    private String analysisType = "NDVI";
    
    // Constructors
    public AnalysisRequest() {}
    
    public AnalysisRequest(Double startLatitude, Double startLongitude, Double endLatitude, Double endLongitude) {
        this.startLatitude = startLatitude;
        this.startLongitude = startLongitude;
        this.endLatitude = endLatitude;
        this.endLongitude = endLongitude;
    }
    
    // Getters and Setters
    public Double getStartLatitude() { return startLatitude; }
    public void setStartLatitude(Double startLatitude) { this.startLatitude = startLatitude; }
    
    public Double getStartLongitude() { return startLongitude; }
    public void setStartLongitude(Double startLongitude) { this.startLongitude = startLongitude; }
    
    public Double getEndLatitude() { return endLatitude; }
    public void setEndLatitude(Double endLatitude) { this.endLatitude = endLatitude; }
    
    public Double getEndLongitude() { return endLongitude; }
    public void setEndLongitude(Double endLongitude) { this.endLongitude = endLongitude; }
    
    public String getRegionName() { return regionName; }
    public void setRegionName(String regionName) { this.regionName = regionName; }
    
    public String getAnalysisType() { return analysisType; }
    public void setAnalysisType(String analysisType) { this.analysisType = analysisType; }
}
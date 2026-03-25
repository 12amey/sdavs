package com.satellite.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "deforestation_alerts")
public class DeforestationAlert {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "city_name", nullable = false, length = 100)
    private String cityName;
    
    @Column(nullable = false)
    private Double latitude;
    
    @Column(nullable = false)
    private Double longitude;
    
    @Column(name = "previous_ndvi", nullable = false)
    private Double previousNdvi;
    
    @Column(name = "current_ndvi", nullable = false)
    private Double currentNdvi;
    
    @Column(name = "ndvi_drop_percent", nullable = false)
    private Double ndviDropPercent;
    
    @Column(name = "risk_level", nullable = false, length = 20)
    private String riskLevel; // LOW, MODERATE, HIGH
    
    @Column(name = "detection_date", nullable = false)
    private LocalDateTime detectionDate;
    
    @Column(name = "is_resolved")
    private Boolean isResolved = false;
    
    // Constructors
    public DeforestationAlert() {
        this.detectionDate = LocalDateTime.now();
    }
    
    public DeforestationAlert(String cityName, Double latitude, Double longitude,
                             Double previousNdvi, Double currentNdvi, String riskLevel) {
        this.cityName = cityName;
        this.latitude = latitude;
        this.longitude = longitude;
        this.previousNdvi = previousNdvi;
        this.currentNdvi = currentNdvi;
        this.ndviDropPercent = ((previousNdvi - currentNdvi) / previousNdvi) * 100;
        this.riskLevel = riskLevel;
        this.detectionDate = LocalDateTime.now();
        this.isResolved = false;
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getCityName() { return cityName; }
    public void setCityName(String cityName) { this.cityName = cityName; }
    
    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }
    
    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }
    
    public Double getPreviousNdvi() { return previousNdvi; }
    public void setPreviousNdvi(Double previousNdvi) { this.previousNdvi = previousNdvi; }
    
    public Double getCurrentNdvi() { return currentNdvi; }
    public void setCurrentNdvi(Double currentNdvi) { this.currentNdvi = currentNdvi; }
    
    public Double getNdviDropPercent() { return ndviDropPercent; }
    public void setNdviDropPercent(Double ndviDropPercent) { this.ndviDropPercent = ndviDropPercent; }
    
    public String getRiskLevel() { return riskLevel; }
    public void setRiskLevel(String riskLevel) { this.riskLevel = riskLevel; }
    
    public LocalDateTime getDetectionDate() { return detectionDate; }
    public void setDetectionDate(LocalDateTime detectionDate) { this.detectionDate = detectionDate; }
    
    public Boolean getIsResolved() { return isResolved; }
    public void setIsResolved(Boolean isResolved) { this.isResolved = isResolved; }
}

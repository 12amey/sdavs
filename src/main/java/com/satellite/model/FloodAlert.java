package com.satellite.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "flood_alerts")
public class FloodAlert {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "city_name", nullable = false, length = 100)
    private String cityName;
    
    @Column(name = "water_increase_percent", nullable = false)
    private Double waterIncreasePercent;
    
    @Column(name = "affected_area_km2")
    private Double affectedAreaKm2;
    
    @Column(name = "alert_level", nullable = false, length = 20)
    private String alertLevel; // WATCH, WARNING, CRITICAL
    
    @Column(name = "detection_date", nullable = false)
    private LocalDateTime detectionDate;
    
    @Column(name = "is_active")
    private Boolean isActive = true;
    
    // Constructors
    public FloodAlert() {
        this.detectionDate = LocalDateTime.now();
    }
    
    public FloodAlert(String cityName, Double waterIncreasePercent, String alertLevel) {
        this.cityName = cityName;
        this.waterIncreasePercent = waterIncreasePercent;
        this.alertLevel = alertLevel;
        this.detectionDate = LocalDateTime.now();
        this.isActive = true;
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getCityName() { return cityName; }
    public void setCityName(String cityName) { this.cityName = cityName; }
    
    public Double getWaterIncreasePercent() { return waterIncreasePercent; }
    public void setWaterIncreasePercent(Double waterIncreasePercent) { 
        this.waterIncreasePercent = waterIncreasePercent; 
    }
    
    public Double getAffectedAreaKm2() { return affectedAreaKm2; }
    public void setAffectedAreaKm2(Double affectedAreaKm2) { 
        this.affectedAreaKm2 = affectedAreaKm2; 
    }
    
    public String getAlertLevel() { return alertLevel; }
    public void setAlertLevel(String alertLevel) { this.alertLevel = alertLevel; }
    
    public LocalDateTime getDetectionDate() { return detectionDate; }
    public void setDetectionDate(LocalDateTime detectionDate) { 
        this.detectionDate = detectionDate; 
    }
    
    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
}

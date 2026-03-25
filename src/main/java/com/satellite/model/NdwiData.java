package com.satellite.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "ndwi_data")
public class NdwiData {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "city_name", nullable = false, length = 100)
    private String cityName;
    
    @Column(nullable = false)
    private Double latitude;
    
    @Column(nullable = false)
    private Double longitude;
    
    @Column(name = "ndwi_value", nullable = false)
    private Double ndwiValue;
    
    @Column(name = "water_area_km2")
    private Double waterAreaKm2;
    
    @Column(name = "analysis_date", nullable = false)
    private LocalDateTime analysisDate;
    
    @Column(name = "is_anomaly")
    private Boolean isAnomaly = false;
    
    // Constructors
    public NdwiData() {
        this.analysisDate = LocalDateTime.now();
    }
    
    public NdwiData(String cityName, Double latitude, Double longitude, Double ndwiValue) {
        this.cityName = cityName;
        this.latitude = latitude;
        this.longitude = longitude;
        this.ndwiValue = ndwiValue;
        this.analysisDate = LocalDateTime.now();
        this.isAnomaly = false;
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
    
    public Double getNdwiValue() { return ndwiValue; }
    public void setNdwiValue(Double ndwiValue) { this.ndwiValue = ndwiValue; }
    
    public Double getWaterAreaKm2() { return waterAreaKm2; }
    public void setWaterAreaKm2(Double waterAreaKm2) { this.waterAreaKm2 = waterAreaKm2; }
    
    public LocalDateTime getAnalysisDate() { return analysisDate; }
    public void setAnalysisDate(LocalDateTime analysisDate) { this.analysisDate = analysisDate; }
    
    public Boolean getIsAnomaly() { return isAnomaly; }
    public void setIsAnomaly(Boolean isAnomaly) { this.isAnomaly = isAnomaly; }
}

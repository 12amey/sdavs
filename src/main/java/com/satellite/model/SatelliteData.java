package com.satellite.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

@Entity
@Table(name = "satellite_data", schema = "public")
public class SatelliteData {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @NotNull
    @DecimalMin(value = "-90.0", message = "Latitude must be between -90 and 90")
    @DecimalMax(value = "90.0", message = "Latitude must be between -90 and 90")
    @Column
    private Double latitude;
    
    @NotNull
    @DecimalMin(value = "-180.0", message = "Longitude must be between -180 and 180")
    @DecimalMax(value = "180.0", message = "Longitude must be between -180 and 180")
    @Column
    private Double longitude;
    
    @DecimalMin(value = "-1.0", message = "NDVI must be between -1 and 1")
    @DecimalMax(value = "1.0", message = "NDVI must be between -1 and 1")
    @Column(name = "ndvi_value")
    private Double ndviValue;

    @Column(name = "ndwi_value")
    private Double ndwiValue;
    
    @Column(name = "red_band")
    private Double redBand;
    
    @Column(name = "nir_band")
    private Double nirBand;
    
    @Column(name = "blue_band")
    private Double blueBand;
    
    @Column(name = "green_band")
    private Double greenBand;
    
    @Enumerated(EnumType.STRING)
    private Classification classification;
    
    @Column(name = "city")
    private String city;

    @Column(name = "state")
    private String state;
    
    @Column(name = "analysis_date")
    private LocalDateTime analysisDate;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    // Deforestation tracking fields
    @Column(name = "previous_ndvi")
    private Double previousNdvi;
    
    @Column(name = "ndvi_change_percent")
    private Double ndviChangePercent;
    
    @Column(name = "last_comparison_date")
    private LocalDateTime lastComparisonDate;
    
    // Environmental monitoring fields
    @Column(name = "air_quality_index")
    private Double airQualityIndex;  // AQI value 0-500
    
    @Column(name = "pm25")
    private Double pm25;  // PM2.5 particulate matter (μg/m³)
    
    @Column(name = "pm10")
    private Double pm10;  // PM10 particulate matter (μg/m³)
    
    @Column(name = "deforestation_risk")
    private String deforestationRisk;  // "LOW", "MEDIUM", "HIGH"
    
    @Column(name = "flood_risk")
    private Double floodRisk;  // Flood probability 0-100
    
    @Column(name = "temperature")
    private Double temperature;  // Temperature in Celsius
    
    @Column(name = "location_name")
    private String locationName;  // City/region name
    
    @Column(name = "data_source")
    private String dataSource;
    
    public enum Classification {
        HEALTHY, MODERATE, UNHEALTHY, WATER, URBAN
    }
    
    // Constructors
    public SatelliteData() {
        this.createdAt = LocalDateTime.now();
    }
    
    public SatelliteData(Double latitude, Double longitude, Double ndviValue, Classification classification) {
        this();
        this.latitude = latitude;
        this.longitude = longitude;
        this.ndviValue = ndviValue;
        this.classification = classification;
        this.analysisDate = LocalDateTime.now();
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }
    
    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }
    
    public Double getNdviValue() { return ndviValue; }
    public void setNdviValue(Double ndviValue) { this.ndviValue = ndviValue; }

    public Double getNdwiValue() { return ndwiValue; }
    public void setNdwiValue(Double ndwiValue) { this.ndwiValue = ndwiValue; }
    
    public Double getRedBand() { return redBand; }
    public void setRedBand(Double redBand) { this.redBand = redBand; }
    
    public Double getNirBand() { return nirBand; }
    public void setNirBand(Double nirBand) { this.nirBand = nirBand; }
    
    public Double getBlueBand() { return blueBand; }
    public void setBlueBand(Double blueBand) { this.blueBand = blueBand; }
    
    public Double getGreenBand() { return greenBand; }
    public void setGreenBand(Double greenBand) { this.greenBand = greenBand; }
    
    public Classification getClassification() { return classification; }
    public void setClassification(Classification classification) { this.classification = classification; }
    
    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public String getState() { return state; }
    public void setState(String state) { this.state = state; }
    
    public LocalDateTime getAnalysisDate() { return analysisDate; }
    public void setAnalysisDate(LocalDateTime analysisDate) { this.analysisDate = analysisDate; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public Double getPreviousNdvi() { return previousNdvi; }
    public void setPreviousNdvi(Double previousNdvi) { this.previousNdvi = previousNdvi; }
    
    public Double getNdviChangePercent() { return ndviChangePercent; }
    public void setNdviChangePercent(Double ndviChangePercent) { this.ndviChangePercent = ndviChangePercent; }
    
    public LocalDateTime getLastComparisonDate() { return lastComparisonDate; }
    public void setLastComparisonDate(LocalDateTime lastComparisonDate) { this.lastComparisonDate = lastComparisonDate; }
    
    // Environmental monitoring getters and setters
    public Double getAirQualityIndex() { return airQualityIndex; }
    public void setAirQualityIndex(Double airQualityIndex) { this.airQualityIndex = airQualityIndex; }
    
    public Double getPm25() { return pm25; }
    public void setPm25(Double pm25) { this.pm25 = pm25; }
    
    public Double getPm10() { return pm10; }
    public void setPm10(Double pm10) { this.pm10 = pm10; }
    
    public String getDeforestationRisk() { return deforestationRisk; }
    public void setDeforestationRisk(String deforestationRisk) { this.deforestationRisk = deforestationRisk; }
    
    public Double getFloodRisk() { return floodRisk; }
    public void setFloodRisk(Double floodRisk) { this.floodRisk = floodRisk; }
    
    public Double getTemperature() { return temperature; }
    public void setTemperature(Double temperature) { this.temperature = temperature; }
    
    public String getLocationName() { return locationName; }
    public void setLocationName(String locationName) { this.locationName = locationName; }
    
    public String getDataSource() { return dataSource; }
    public void setDataSource(String dataSource) { this.dataSource = dataSource; }
}
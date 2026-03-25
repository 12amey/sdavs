package com.satellite.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "environmental_risk")
public class EnvironmentalRisk {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "city_name", nullable = false, unique = true, length = 100)
    private String cityName;
    
    @Column(name = "ndvi_score", nullable = false)
    private Double ndviScore = 0.0;
    
    @Column(name = "deforestation_score", nullable = false)
    private Double deforestationScore = 0.0;
    
    @Column(name = "flood_score", nullable = false)
    private Double floodScore = 0.0;
    
    @Column(name = "aqi_score", nullable = false)
    private Double aqiScore = 0.0;
    
    @Column(name = "total_risk_score", nullable = false)
    private Double totalRiskScore = 0.0;
    
    @Column(name = "risk_level", nullable = false, length = 20)
    private String riskLevel; // SAFE, MODERATE, HIGH_RISK
    
    @Column(name = "calculation_date", nullable = false)
    private LocalDateTime calculationDate;
    
    // Constructors
    public EnvironmentalRisk() {
        this.calculationDate = LocalDateTime.now();
        this.riskLevel = "SAFE";
    }
    
    public EnvironmentalRisk(String cityName) {
        this.cityName = cityName;
        this.calculationDate = LocalDateTime.now();
        this.riskLevel = "SAFE";
    }
    
    // Calculate total risk and level
    public void calculateTotalRisk() {
        this.totalRiskScore = this.ndviScore + this.deforestationScore + 
                               this.floodScore + this.aqiScore;
        
        if (this.totalRiskScore <= 30) {
            this.riskLevel = "SAFE";
        } else if (this.totalRiskScore <= 60) {
            this.riskLevel = "MODERATE";
        } else {
            this.riskLevel = "HIGH_RISK";
        }
        
        this.calculationDate = LocalDateTime.now();
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getCityName() { return cityName; }
    public void setCityName(String cityName) { this.cityName = cityName; }
    
    public Double getNdviScore() { return ndviScore; }
    public void setNdviScore(Double ndviScore) { this.ndviScore = ndviScore; }
    
    public Double getDeforestationScore() { return deforestationScore; }
    public void setDeforestationScore(Double deforestationScore) { 
        this.deforestationScore = deforestationScore; 
    }
    
    public Double getFloodScore() { return floodScore; }
    public void setFloodScore(Double floodScore) { this.floodScore = floodScore; }
    
    public Double getAqiScore() { return aqiScore; }
    public void setAqiScore(Double aqiScore) { this.aqiScore = aqiScore; }
    
    public Double getTotalRiskScore() { return totalRiskScore; }
    public void setTotalRiskScore(Double totalRiskScore) { 
        this.totalRiskScore = totalRiskScore; 
    }
    
    public String getRiskLevel() { return riskLevel; }
    public void setRiskLevel(String riskLevel) { this.riskLevel = riskLevel; }
    
    public LocalDateTime getCalculationDate() { return calculationDate; }
    public void setCalculationDate(LocalDateTime calculationDate) { 
        this.calculationDate = calculationDate; 
    }
}

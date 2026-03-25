package com.satellite.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_analyses", schema = "public")
public class UserAnalysis {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @NotBlank(message = "Region name is required")
    @Column(name = "region_name")
    private String regionName;
    
    @NotNull
    @Column(name = "start_latitude")
    private Double startLatitude;
    
    @NotNull
    @Column(name = "start_longitude")
    private Double startLongitude;
    
    @NotNull
    @Column(name = "end_latitude")
    private Double endLatitude;
    
    @NotNull
    @Column(name = "end_longitude")
    private Double endLongitude;
    
    @Column(name = "area_size_km2")
    private Double areaSizeKm2;
    
    @Column(name = "avg_ndvi")
    private Double avgNdvi;
    
    @Column(name = "forest_cover_percent")
    private Double forestCoverPercent;
    
    @Column(name = "healthy_vegetation_percent")
    private Double healthyVegetationPercent;
    
    @Column(name = "moderate_vegetation_percent")
    private Double moderateVegetationPercent;
    
    @Column(name = "unhealthy_vegetation_percent")
    private Double unhealthyVegetationPercent;
    
    @Column(name = "water_bodies_percent")
    private Double waterBodiesPercent;
    
    @Column(name = "urban_areas_percent")
    private Double urbanAreasPercent;
    
    @Column(name = "analysis_type")
    private String analysisType;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    // Constructors
    public UserAnalysis() {
        this.createdAt = LocalDateTime.now();
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    
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
    
    public Double getHealthyVegetationPercent() { return healthyVegetationPercent; }
    public void setHealthyVegetationPercent(Double healthyVegetationPercent) { this.healthyVegetationPercent = healthyVegetationPercent; }
    
    public Double getModerateVegetationPercent() { return moderateVegetationPercent; }
    public void setModerateVegetationPercent(Double moderateVegetationPercent) { this.moderateVegetationPercent = moderateVegetationPercent; }
    
    public Double getUnhealthyVegetationPercent() { return unhealthyVegetationPercent; }
    public void setUnhealthyVegetationPercent(Double unhealthyVegetationPercent) { this.unhealthyVegetationPercent = unhealthyVegetationPercent; }
    
    public Double getWaterBodiesPercent() { return waterBodiesPercent; }
    public void setWaterBodiesPercent(Double waterBodiesPercent) { this.waterBodiesPercent = waterBodiesPercent; }
    
    public Double getUrbanAreasPercent() { return urbanAreasPercent; }
    public void setUrbanAreasPercent(Double urbanAreasPercent) { this.urbanAreasPercent = urbanAreasPercent; }
    
    public String getAnalysisType() { return analysisType; }
    public void setAnalysisType(String analysisType) { this.analysisType = analysisType; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
package com.satellite.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "aqi_data")
public class AqiData {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "city_name", nullable = false, length = 100)
    private String cityName;
    
    @Column(name = "aqi_value", nullable = false)
    private Integer aqiValue;
    
    @Column(name = "pm25")
    private Double pm25;
    
    @Column(name = "pm10")
    private Double pm10;
    
    @Column(nullable = false, length = 50)
    private String category; // GOOD, MODERATE, POOR, VERY_POOR, SEVERE
    
    @Column(name = "data_source", nullable = false, length = 100)
    private String dataSource;
    
    @Column(name = "fetch_date", nullable = false)
    private LocalDateTime fetchDate;
    
    // Constructors
    public AqiData() {
        this.fetchDate = LocalDateTime.now();
    }
    
    public AqiData(String cityName, Integer aqiValue, String dataSource) {
        this.cityName = cityName;
        this.aqiValue = aqiValue;
        this.category = calculateCategory(aqiValue);
        this.dataSource = dataSource;
        this.fetchDate = LocalDateTime.now();
    }
    
    // Calculate category from AQI value
    private String calculateCategory(Integer aqi) {
        if (aqi <= 50) return "GOOD";
        else if (aqi <= 100) return "MODERATE";
        else if (aqi <= 200) return "POOR";
        else if (aqi <= 300) return "VERY_POOR";
        else return "SEVERE";
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getCityName() { return cityName; }
    public void setCityName(String cityName) { this.cityName = cityName; }
    
    public Integer getAqiValue() { return aqiValue; }
    public void setAqiValue(Integer aqiValue) { 
        this.aqiValue = aqiValue;
        this.category = calculateCategory(aqiValue);
    }
    
    public Double getPm25() { return pm25; }
    public void setPm25(Double pm25) { this.pm25 = pm25; }
    
    public Double getPm10() { return pm10; }
    public void setPm10(Double pm10) { this.pm10 = pm10; }
    
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    
    public String getDataSource() { return dataSource; }
    public void setDataSource(String dataSource) { this.dataSource = dataSource; }
    
    public LocalDateTime getFetchDate() { return fetchDate; }
    public void setFetchDate(LocalDateTime fetchDate) { this.fetchDate = fetchDate; }
}

package com.satellite.service;

import com.satellite.model.AqiData;
import com.satellite.repository.AqiDataRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class AqiService {
    
    @Autowired
    private AqiDataRepository aqiDataRepository;
    
    @Value("${aqi.api.provider:OpenMeteo}")
    private String apiProvider;
    
    /**
     * Fetch AQI data from external API
     * Using Open-Meteo Air Quality API (no API key required)
     * @param cityName City name
     * @param latitude City latitude
     * @param longitude City longitude
     * @return AQI data
     */
    public AqiData fetchAndStoreAqi(String cityName, double latitude, double longitude) {
        try {
            // Open-Meteo Air Quality API endpoint
            String url = String.format(
                "https://air-quality-api.open-meteo.com/v1/air-quality?latitude=%.4f&longitude=%.4f&current=pm10,pm2_5&timezone=auto",
                latitude, longitude
            );
            
            RestTemplate restTemplate = new RestTemplate();
            Map<String, Object> response = restTemplate.getForObject(url, Map.class);
            
            if (response != null && response.containsKey("current")) {
                Map<String, Object> current = (Map<String, Object>) response.get("current");
                
                // Extract PM values
                Double pm25Value = current.get("pm2_5") != null ? 
                    Double.valueOf(current.get("pm2_5").toString()) : null;
                Double pm10Value = current.get("pm10") != null ? 
                    Double.valueOf(current.get("pm10").toString()) : null;
                
                // Calculate AQI from PM2.5 (simplified calculation)
                int aqiValue = calculateAqiFromPM25(pm25Value != null ? pm25Value : 0.0);
                
                // Create and save AQI data
                AqiData aqiData = new AqiData(cityName, aqiValue, "OpenMeteo");
                aqiData.setPm25(pm25Value);
                aqiData.setPm10(pm10Value);
                
                return aqiDataRepository.save(aqiData);
            }
        } catch (Exception e) {
            // If API fails, return error indicator
            System.err.println("Failed to fetch AQI for " + cityName + ": " + e.getMessage());
        }
        
        return null;
    }
    
    /**
     * Calculate AQI from PM2.5 concentration
     * Simplified calculation based on US EPA standards
     * @param pm25 PM2.5 concentration in µg/m³
     * @return AQI value
     */
    private int calculateAqiFromPM25(double pm25) {
        if (pm25 <= 12.0) return (int) (pm25 * 50 / 12.0);
        else if (pm25 <= 35.4) return 50 + (int) ((pm25 - 12.0) * 50 / 23.4);
        else if (pm25 <= 55.4) return 100 + (int) ((pm25 - 35.4) * 50 / 20.0);
        else if (pm25 <= 150.4) return 150 + (int) ((pm25 - 55.4) * 100 / 95.0);
        else if (pm25 <= 250.4) return 200 + (int) ((pm25 - 150.4) * 100 / 100.0);
        else return 300 + (int) ((pm25 - 250.4) * 100 / 99.6);
    }
    
    /**
     * Get latest AQI for a city
     * @param cityName City name
     * @return Latest AQI data or empty
     */
    public Optional<AqiData> getLatestAqi(String cityName) {
        return aqiDataRepository.findFirstByCityNameOrderByFetchDateDesc(cityName);
    }
    
    /**
     * Get 7-day AQI trend
     * @param cityName City name
     * @return List of AQI data
     */
    public List<AqiData> get7DayTrend(String cityName) {
        LocalDateTime sevenDaysAgo = LocalDateTime.now().minusDays(7);
        return aqiDataRepository.findLast7Days(cityName, sevenDaysAgo);
    }
}

package com.satellite.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.RestClientException;

import java.util.Map;

@Service
public class EnvironmentalDataService {
    
    private static final Logger logger = LoggerFactory.getLogger(EnvironmentalDataService.class);
    private final RestTemplate restTemplate = new RestTemplate();

    @org.springframework.beans.factory.annotation.Value("${openweather.api.key:}")
    private String openWeatherApiKey;
    
    /**
     * Fetch air quality data. 
     * Uses OpenWeatherMap if API key is provided, otherwise falls back to Open-Meteo.
     * @param latitude Location latitude
     * @param longitude Location longitude
     * @return Map containing AQI, PM2.5, PM10 values
     */
    public Map<String, Double> fetchAirQuality(double latitude, double longitude) {
        if (openWeatherApiKey != null && !openWeatherApiKey.isEmpty()) {
            return fetchAirQualityFromOpenWeather(latitude, longitude);
        }
        return fetchAirQualityFromOpenMeteo(latitude, longitude);
    }

    private Map<String, Double> fetchAirQualityFromOpenWeather(double latitude, double longitude) {
        try {
            String url = String.format(
                "http://api.openweathermap.org/data/2.5/air_pollution?lat=%.4f&lon=%.4f&appid=%s",
                latitude, longitude, openWeatherApiKey
            );
            
            logger.info("Fetching air quality from OpenWeatherMap for lat={}, lon={}", latitude, longitude);
            
            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.getForObject(url, Map.class);
            
            if (response != null && response.containsKey("list")) {
                @SuppressWarnings("unchecked")
                java.util.List<Map<String, Object>> list = (java.util.List<Map<String, Object>>) response.get("list");
                if (!list.isEmpty()) {
                    Map<String, Object> first = list.get(0);
                    @SuppressWarnings("unchecked")
                    Map<String, Object> main = (Map<String, Object>) first.get("main");
                    @SuppressWarnings("unchecked")
                    Map<String, Object> components = (Map<String, Object>) first.get("components");
                    
                    Double aqi = getDoubleValue(main.get("aqi")); // OWM AQI is 1-5 index
                    Double pm25 = getDoubleValue(components.get("pm2_5"));
                    Double pm10 = getDoubleValue(components.get("pm10"));
                    
                    // Convert OWM 1-5 index to US-AQI scale (roughly) for consistency or keep as is
                    // Let's normalize it to 0-500 scale for UI consistency if needed, 
                    // but for now we'll just return it and note it's OWM index.
                    
                    logger.info("OpenWeather air quality: AQI (1-5)={}, PM2.5={}, PM10={}", aqi, pm25, pm10);
                    
                    return Map.of(
                        "aqi", aqi != null ? aqi : 0.0,
                        "pm25", pm25 != null ? pm25 : 0.0,
                        "pm10", pm10 != null ? pm10 : 0.0
                    );
                }
            }
        } catch (Exception e) {
            logger.error("Error fetching from OpenWeatherMap: {}. Falling back to Open-Meteo.", e.getMessage());
        }
        return fetchAirQualityFromOpenMeteo(latitude, longitude);
    }

    private Map<String, Double> fetchAirQualityFromOpenMeteo(double latitude, double longitude) {
        try {
            String url = String.format(
                "https://air-quality-api.open-meteo.com/v1/air-quality?latitude=%.4f&longitude=%.4f&current=pm10,pm2_5,us_aqi&timezone=Asia/Kolkata",
                latitude, longitude
            );
            
            logger.info("Fetching air quality for lat={}, lon={}", latitude, longitude);
            
            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.getForObject(url, Map.class);
            
            if (response != null && response.containsKey("current")) {
                @SuppressWarnings("unchecked")
                Map<String, Object> current = (Map<String, Object>) response.get("current");
                
                Double pm25 = getDoubleValue(current.get("pm2_5"));
                Double pm10 = getDoubleValue(current.get("pm10"));
                Double aqi = getDoubleValue(current.get("us_aqi"));
                
                logger.info("Air quality data: AQI={}, PM2.5={}, PM10={}", aqi, pm25, pm10);
                
                return Map.of(
                    "aqi", aqi != null ? aqi : 0.0,
                    "pm25", pm25 != null ? pm25 : 0.0,
                    "pm10", pm10 != null ? pm10 : 0.0
                );
            }
            
            logger.warn("No air quality data available for location");
            return getDefaultAirQuality();
            
        } catch (RestClientException e) {
            logger.error("Error fetching air quality data: {}", e.getMessage());
            return getDefaultAirQuality();
        }
    }
    
    /**
     * Fetch current temperature.
     * Uses OpenWeatherMap if API key is provided, otherwise falls back to Open-Meteo.
     * @param latitude Location latitude
     * @param longitude Location longitude
     * @return Temperature in Celsius
     */
    public Double fetchTemperature(double latitude, double longitude) {
        if (openWeatherApiKey != null && !openWeatherApiKey.isEmpty()) {
            return fetchTemperatureFromOpenWeather(latitude, longitude);
        }
        return fetchTemperatureFromOpenMeteo(latitude, longitude);
    }

    private Double fetchTemperatureFromOpenWeather(double latitude, double longitude) {
        try {
            String url = String.format(
                "http://api.openweathermap.org/data/2.5/weather?lat=%.4f&lon=%.4f&appid=%s&units=metric",
                latitude, longitude, openWeatherApiKey
            );
            
            logger.info("Fetching temperature from OpenWeatherMap for lat={}, lon={}", latitude, longitude);
            
            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.getForObject(url, Map.class);
            
            if (response != null && response.containsKey("main")) {
                @SuppressWarnings("unchecked")
                Map<String, Object> main = (Map<String, Object>) response.get("main");
                Double temp = getDoubleValue(main.get("temp"));
                
                logger.info("OpenWeather Temperature: {}°C", temp);
                return temp != null ? temp : 25.0;
            }
        } catch (Exception e) {
            logger.error("Error fetching temperature from OpenWeatherMap: {}. Falling back to Open-Meteo.", e.getMessage());
        }
        return fetchTemperatureFromOpenMeteo(latitude, longitude);
    }

    private Double fetchTemperatureFromOpenMeteo(double latitude, double longitude) {
        try {
            String url = String.format(
                "https://api.open-meteo.com/v1/forecast?latitude=%.4f&longitude=%.4f&current=temperature_2m&timezone=Asia/Kolkata",
                latitude, longitude
            );
            
            logger.info("Fetching temperature for lat={}, lon={}", latitude, longitude);
            
            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.getForObject(url, Map.class);
            
            if (response != null && response.containsKey("current")) {
                @SuppressWarnings("unchecked")
                Map<String, Object> current = (Map<String, Object>) response.get("current");
                Double temp = getDoubleValue(current.get("temperature_2m"));
                
                logger.info("Temperature: {}°C", temp);
                return temp != null ? temp : 25.0; // Default fallback
            }
            
            return 25.0; // Default temperature
            
        } catch (RestClientException e) {
            logger.error("Error fetching temperature: {}", e.getMessage());
            return 25.0;
        }
    }
    
    /**
     * Calculate flood risk based on NDVI and terrain factors
     * Uses NDWI approximation and NDVI patterns
     * @param ndvi Current NDVI value
     * @param previousNdvi Previous NDVI value (for trend)
     * @return Flood risk probability 0-100
     */
    public Double calculateFloodRisk(Double ndvi, Double previousNdvi) {
        if (ndvi == null) {
            return 0.0;
        }
        
        double baseRisk = 0.0;
        
        // Very low NDVI with negative values suggests water presence
        if (ndvi < -0.1) {
            baseRisk = 70.0; // High risk - water detected
        } else if (ndvi < 0.1) {
            baseRisk = 40.0; // Medium risk - bare/wet soil
        } else if (ndvi < 0.3) {
            baseRisk = 20.0; // Low-medium risk - sparse vegetation
        } else {
            baseRisk = 10.0; // Low risk - healthy vegetation
        }
        
        // If NDVI is dropping significantly, increase flood risk
        if (previousNdvi != null && previousNdvi > 0.3 && ndvi < previousNdvi - 0.2) {
            baseRisk += 20.0; // Sudden vegetation loss may indicate flooding
        }
        
        // Cap at 100
        return Math.min(baseRisk, 100.0);
    }
    
    /**
     * Assess deforestation risk based on NDVI change
     * Uses 20-30% threshold as per user guidance
     * @param currentNdvi Current NDVI value
     * @param previousNdvi Previous NDVI value
     * @param changePercent NDVI change percentage
     * @return "LOW", "MEDIUM", or "HIGH"
     */
    public String assessDeforestationRisk(Double currentNdvi, Double previousNdvi, Double changePercent) {
        if (currentNdvi == null || previousNdvi == null || changePercent == null) {
            return "LOW";
        }
        
        // Only consider negative changes (vegetation loss)
        if (changePercent >= 0) {
            return "LOW";
        }
        
        double absChange = Math.abs(changePercent);
        
        // HIGH: >= 30% drop in NDVI
        if (absChange >= 30.0) {
            logger.warn("HIGH deforestation risk detected: {}% NDVI drop", absChange);
            return "HIGH";
        }
        
        // MEDIUM: 20-30% drop in NDVI
        if (absChange >= 20.0) {
            logger.info("MEDIUM deforestation risk detected: {}% NDVI drop", absChange);
            return "MEDIUM";
        }
        
        // LOW: < 20% drop
        return "LOW";
    }
    
    /**
     * Helper method to safely convert Object to Double
     */
    private Double getDoubleValue(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof Number) {
            return ((Number) value).doubleValue();
        }
        try {
            return Double.parseDouble(value.toString());
        } catch (NumberFormatException e) {
            return null;
        }
    }
    
    /**
     * Default air quality values when API fails
     */
    private Map<String, Double> getDefaultAirQuality() {
        return Map.of(
            "aqi", 0.0,
            "pm25", 0.0,
            "pm10", 0.0
        );
    }
}

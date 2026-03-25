package com.satellite.service;

import com.satellite.model.AreaAnalysisResult;
import com.satellite.model.BoundingBox;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

/**
 * Dynamic area analysis service - analyzes ANY area on-demand
 * No pre-storage required - fetches data in real-time from free sources
 */
@Service
public class DynamicAreaAnalysisService {
    
    private static final Logger logger = LoggerFactory.getLogger(DynamicAreaAnalysisService.class);
    
    @Autowired
    private RestTemplate restTemplate;
    
    @Value("${stac.api.url:https://earth-search.aws.element84.com/v1}")
    private String stacApiUrl;
    
    @Value("${python.ml.service.url:http://localhost:5000}")
    private String pythonServiceUrl;
    
    @Value("${openweather.api.key:}")
    private String openWeatherApiKey;
    
    private static final String NASA_EONET_API = "https://eonet.gsfc.nasa.gov/api/v3/events";
    private static final String OPENWEATHER_API = "https://api.openweathermap.org/data/2.5";
    
    /**
     * Main method: Analyze any area on-demand
     */
    public AreaAnalysisResult analyzeArea(double minLat, double maxLat, 
                                          double minLon, double maxLon,
                                          String areaName) {
        logger.info("Starting on-demand analysis for area: {} ({}, {}) to ({}, {})", 
                    areaName, minLat, minLon, maxLat, maxLon);
        
        AreaAnalysisResult result = new AreaAnalysisResult();
        result.setAreaName(areaName != null ? areaName : "Selected Area");
        result.setBounds(new BoundingBox(minLat, maxLat, minLon, maxLon));
        result.setAnalyzedAt(LocalDateTime.now());
        
        try {
            // Calculate center point for weather/environmental data
            double centerLat = (minLat + maxLat) / 2.0;
            double centerLon = (minLon + maxLon) / 2.0;
            
            // Step 1: Fetch latest Sentinel-2 imagery
            logger.info("Fetching Sentinel-2 imagery...");
            Map<String, Object> sentinelData = fetchSentinelImagery(minLat, maxLat, minLon, maxLon);
            
            if (sentinelData != null && sentinelData.containsKey("imagery_url")) {
                result.setSatelliteImageUrl((String) sentinelData.get("imagery_url"));
                result.setImageryDate((String) sentinelData.get("date"));
                
                // Step 2: Calculate NDVI via Python service
                logger.info("Calculating NDVI...");
                Map<String, Object> ndviData = calculateNDVI(sentinelData);
                if (ndviData != null) {
                    result.setNdviMean((Double) ndviData.get("mean"));
                    result.setNdviClassification((String) ndviData.get("classification"));
                    result.setVegetationCoverage((Map<String, Double>) ndviData.get("coverage"));
                }
            } else {
                logger.warn("No recent satellite imagery found for this area");
                result.setNdviMean(null);
                result.setNdviClassification("No imagery available");
            }
            
            // Step 3: Fetch environmental data (weather, air quality)
            logger.info("Fetching environmental data...");
            Map<String, Object> envData = fetchEnvironmentalData(centerLat, centerLon);
            if (envData != null) {
                result.setTemperature((Double) envData.get("temperature"));
                result.setHumidity((Integer) envData.get("humidity"));
                result.setAirQualityIndex((Integer) envData.get("aqi"));
                result.setPm25((Double) envData.get("pm25"));
                result.setPm10((Double) envData.get("pm10"));
            }
            
            // Step 4: Check for natural disasters in area
            logger.info("Checking for disasters...");
            List<Map<String, Object>> disasters = checkDisasters(minLat, maxLat, minLon, maxLon);
            result.setDisasters(disasters);
            
            // Step 5: Assess risks
            logger.info("Assessing risks...");
            Map<String, Object> risks = assessRisks(result);
            result.setRisks(risks);
            
            result.setSuccess(true);
            logger.info("Analysis completed successfully for {}", areaName);
            
        } catch (Exception e) {
            logger.error("Error during area analysis", e);
            result.setSuccess(false);
            result.setErrorMessage(e.getMessage());
        }
        
        return result;
    }
    
    /**
     * Fetch latest Sentinel-2 imagery from AWS STAC API (FREE)
     */
    private Map<String, Object> fetchSentinelImagery(double minLat, double maxLat, 
                                                      double minLon, double maxLon) {
        try {
            String url = stacApiUrl + "/search";
            
            // Build STAC query
            Map<String, Object> query = new HashMap<>();
            query.put("collections", new String[]{"sentinel-2-l2a"});
            query.put("bbox", new double[]{minLon, minLat, maxLon, maxLat});
            
            // Search last 30 days
            LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);
            String datetime = thirtyDaysAgo.format(DateTimeFormatter.ISO_DATE_TIME) + "Z/" + 
                             LocalDateTime.now().format(DateTimeFormatter.ISO_DATE_TIME) + "Z";
            query.put("datetime", datetime);
            query.put("limit", 5);
            
            // Filter for low cloud cover
            Map<String, Object> cloudFilter = new HashMap<>();
            cloudFilter.put("eo:cloud_cover", Map.of("lt", 30));
            query.put("query", cloudFilter);
            
            // Sort by date descending
            query.put("sortby", new Object[]{
                Map.of("field", "properties.datetime", "direction", "desc")
            });
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(query, headers);
            
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.POST, request, Map.class);
            
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                Map<String, Object> body = response.getBody();
                List<?> features = (List<?>) body.get("features");
                
                if (features != null && !features.isEmpty()) {
                    Map<String, Object> feature = (Map<String, Object>) features.get(0);
                    Map<String, Object> assets = (Map<String, Object>) feature.get("assets");
                    Map<String, Object> properties = (Map<String, Object>) feature.get("properties");
                    
                    Map<String, Object> result = new HashMap<>();
                    
                    // Get preview image URL
                    if (assets.containsKey("visual")) {
                        Map<String, Object> visual = (Map<String, Object>) assets.get("visual");
                        result.put("imagery_url", visual.get("href"));
                    } else if (assets.containsKey("thumbnail")) {
                        Map<String, Object> thumbnail = (Map<String, Object>) assets.get("thumbnail");
                        result.put("imagery_url", thumbnail.get("href"));
                    }
                    
                    // Get band URLs for NDVI calculation
                    if (assets.containsKey("B08") && assets.containsKey("B04")) {
                        Map<String, Object> b08 = (Map<String, Object>) assets.get("B08");
                        Map<String, Object> b04 = (Map<String, Object>) assets.get("B04");
                        result.put("nir_band_url", b08.get("href"));
                        result.put("red_band_url", b04.get("href"));
                    }
                    
                    result.put("date", properties.get("datetime"));
                    result.put("cloud_cover", properties.get("eo:cloud_cover"));
                    
                    logger.info("Found Sentinel-2 image from {} with {}% cloud cover", 
                               properties.get("datetime"), properties.get("eo:cloud_cover"));
                    
                    return result;
                }
            }
            
            logger.warn("No Sentinel-2 imagery found for the specified area and time range");
            return null;
            
        } catch (Exception e) {
            logger.error("Error fetching Sentinel-2 imagery", e);
            return null;
        }
    }
    
    /**
     * Calculate NDVI using Python ML service
     */
    private Map<String, Object> calculateNDVI(Map<String, Object> sentinelData) {
        try {
            if (!sentinelData.containsKey("nir_band_url") || !sentinelData.containsKey("red_band_url")) {
                logger.warn("NIR or Red band URLs not available");
                return null;
            }
            
            String url = pythonServiceUrl + "/ndvi?b08_url=" + 
                        sentinelData.get("nir_band_url") + "&b04_url=" + 
                        sentinelData.get("red_band_url");
            
            // Python service will return NDVI statistics
            ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);
            
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                return response.getBody();
            }
            
            return null;
            
        } catch (Exception e) {
            logger.error("Error calculating NDVI", e);
            return null;
        }
    }
    
    /**
     * Fetch environmental data (weather, air quality) from OpenWeatherMap
     */
    private Map<String, Object> fetchEnvironmentalData(double lat, double lon) {
        Map<String, Object> envData = new HashMap<>();
        
        try {
            if (openWeatherApiKey != null && !openWeatherApiKey.isEmpty()) {
                // Fetch weather data
                String weatherUrl = String.format(
                    "%s/weather?lat=%f&lon=%f&appid=%s&units=metric",
                    OPENWEATHER_API, lat, lon, openWeatherApiKey
                );
                
                ResponseEntity<Map> weatherResponse = restTemplate.getForEntity(weatherUrl, Map.class);
                if (weatherResponse.getStatusCode() == HttpStatus.OK && weatherResponse.getBody() != null) {
                    Map<String, Object> weather = weatherResponse.getBody();
                    Map<String, Object> main = (Map<String, Object>) weather.get("main");
                    
                    envData.put("temperature", main.get("temp"));
                    envData.put("humidity", main.get("humidity"));
                }
                
                // Fetch air quality data
                String aqiUrl = String.format(
                    "%s/air_pollution?lat=%f&lon=%f&appid=%s",
                    OPENWEATHER_API, lat, lon, openWeatherApiKey
                );
                
                ResponseEntity<Map> aqiResponse = restTemplate.getForEntity(aqiUrl, Map.class);
                if (aqiResponse.getStatusCode() == HttpStatus.OK && aqiResponse.getBody() != null) {
                    Map<String, Object> aqiData = aqiResponse.getBody();
                    List<?> list = (List<?>) aqiData.get("list");
                    if (list != null && !list.isEmpty()) {
                        Map<String, Object> current = (Map<String, Object>) list.get(0);
                        Map<String, Object> main = (Map<String, Object>) current.get("main");
                        Map<String, Object> components = (Map<String, Object>) current.get("components");
                        
                        envData.put("aqi", main.get("aqi"));
                        envData.put("pm25", components.get("pm2_5"));
                        envData.put("pm10", components.get("pm10"));
                    }
                }
            } else {
                logger.warn("OpenWeatherMap API key not configured - environmental data unavailable");
                envData.put("temperature", null);
                envData.put("humidity", null);
                envData.put("aqi", null);
            }
            
        } catch (Exception e) {
            logger.error("Error fetching environmental data", e);
        }
        
        return envData;
    }
    
    /**
     * Check for natural disasters in area from NASA EONET (FREE)
     */
    private List<Map<String, Object>> checkDisasters(double minLat, double maxLat, 
                                                      double minLon, double maxLon) {
        List<Map<String, Object>> disasters = new ArrayList<>();
        
        try {
            String url = String.format(
                "%s?status=open&bbox=%f,%f,%f,%f",
                NASA_EONET_API, minLon, minLat, maxLon, maxLat
            );
            
            ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);
            
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                Map<String, Object> body = response.getBody();
                List<?> events = (List<?>) body.get("events");
                
                if (events != null) {
                    for (Object eventObj : events) {
                        Map<String, Object> event = (Map<String, Object>) eventObj;
                        
                        Map<String, Object> disaster = new HashMap<>();
                        disaster.put("title", event.get("title"));
                        
                        List<?> categories = (List<?>) event.get("categories");
                        if (categories != null && !categories.isEmpty()) {
                            Map<String, Object> category = (Map<String, Object>) categories.get(0);
                            disaster.put("type", category.get("title"));
                        }
                        
                        disasters.add(disaster);
                    }
                    
                    logger.info("Found {} active disasters in area", disasters.size());
                }
            }
            
        } catch (Exception e) {
            logger.error("Error checking disasters", e);
        }
        
        return disasters;
    }
    
    /**
     * Assess various risks based on collected data
     */
    private Map<String, Object> assessRisks(AreaAnalysisResult result) {
        Map<String, Object> risks = new HashMap<>();
        
        // Flood risk (based on NDVI - low vegetation = high risk)
        if (result.getNdviMean() != null) {
            double floodRisk = (1 - result.getNdviMean()) * 100;
            risks.put("flood", Math.max(0, Math.min(100, floodRisk)));
        } else {
            risks.put("flood", null);
        }
        
        // Deforestation risk
        if (result.getNdviMean() != null) {
            if (result.getNdviMean() < 0.2) {
                risks.put("deforestation", "High");
            } else if (result.getNdviMean() < 0.4) {
                risks.put("deforestation", "Moderate");
            } else {
                risks.put("deforestation", "Low");
            }
        } else {
            risks.put("deforestation", "Unknown");
        }
        
        // Air pollution risk
        if (result.getAirQualityIndex() != null) {
            int aqi = result.getAirQualityIndex();
            if (aqi > 150) {
                risks.put("airPollution", "High");
            } else if (aqi > 100) {
                risks.put("airPollution", "Moderate");
            } else {
                risks.put("airPollution", "Low");
            }
        } else {
            risks.put("airPollution", "Unknown");
        }
        
        return risks;
    }
}

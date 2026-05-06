package com.satellite.service;

import com.satellite.model.CityCoordinates;
import com.satellite.model.DataUpdateLog;
import com.satellite.model.SatelliteData;
import com.satellite.repository.DataUpdateLogRepository;
import com.satellite.repository.SatelliteDataRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

@Service
public class ScheduledDataUpdateService {
    
    private static final Logger logger = LoggerFactory.getLogger(ScheduledDataUpdateService.class);
    
    @Autowired
    private SatelliteDataRepository satelliteDataRepository;
    
    @Autowired
    private DataUpdateLogRepository dataUpdateLogRepository;
    
    @Autowired
    private EnvironmentalDataService environmentalDataService;
    
    @Value("${python.cog.url:http://localhost:5000}")
    private String pythonServiceUrl;
    
    @Value("${stac.api.url:https://earth-search.aws.element84.com/v1}")
    private String stacApiUrl;
    
    @Value("${satellite.update.enabled:true}")
    private boolean updateEnabled;
    
    @Autowired
    private RestTemplate restTemplate;
    
    /**
     * Scheduled task - runs every Sunday at 2 AM
     */
    @Scheduled(cron = "${satellite.update.cron:0 0 2 * * SUN}")
    public void scheduledUpdate() {
        if (!updateEnabled) {
            logger.info("Scheduled updates are disabled");
            return;
        }
        
        logger.info("Starting scheduled Sentinel-2 data update...");
        updateAllCities();
    }
    
    /**
     * Update satellite data for all cities
     * Can be called manually or by scheduler
     */
    public DataUpdateLog updateAllCities() {
        LocalDateTime startTime = LocalDateTime.now();
        Integer citiesUpdated = 0;
        StringBuilder errors = new StringBuilder();
        
        try {
            java.util.List<java.util.concurrent.CompletableFuture<Boolean>> futures = new java.util.ArrayList<>();
            
            for (CityCoordinates city : CityCoordinates.values()) {
                java.util.concurrent.CompletableFuture<Boolean> future = java.util.concurrent.CompletableFuture.supplyAsync(() -> {
                    try {
                        logger.info("Updating data for: {}", city.getCityName());
                        return updateCityData(city);
                    } catch (Exception e) {
                        logger.error("Failed to update {}: {}", city.getCityName(), e.getMessage());
                        synchronized (errors) {
                            errors.append(city.getCityName()).append(": ").append(e.getMessage()).append("; ");
                        }
                        return false;
                    }
                });
                futures.add(future);
            }
            
            // Wait for all updates to complete
            java.util.concurrent.CompletableFuture.allOf(futures.toArray(new java.util.concurrent.CompletableFuture[0])).join();
            
            // Count successes
            for (java.util.concurrent.CompletableFuture<Boolean> future : futures) {
                if (future.getNow(false)) {
                    citiesUpdated++;
                }
            }
            
            DataUpdateLog log = new DataUpdateLog(
                startTime,
                citiesUpdated,
                citiesUpdated > 0 ? "SUCCESS" : "FAILED",
                errors.length() > 0 ? errors.toString() : null
            );
            dataUpdateLogRepository.save(log);
            
            logger.info("Data update completed. Cities updated: {}/{}", citiesUpdated, CityCoordinates.values().length);
            return log;
            
        } catch (Exception e) {
            logger.error("Update process failed", e);
            DataUpdateLog log = new DataUpdateLog(
                startTime,
                citiesUpdated,
                "FAILED",
                e.getMessage()
            );
            dataUpdateLogRepository.save(log);
            return log;
        }
    }
    
    /**
     * Update data for a specific city
     */
    private boolean updateCityData(CityCoordinates city) {
        try {
            // Step 1: Query STAC API for latest imagery
            String tileUrl = queryStacApi(city);
            Double ndvi = null;
            String classification = "MODERATE";
            
            if (tileUrl != null) {
                // Step 2: Calculate NDVI using Python service
                ndvi = calculateNdvi(tileUrl, city);
                if (ndvi != null) {
                    classification = classifyNdvi(ndvi);
                }
            } else {
                logger.warn("No recent imagery found for {}. Saving partial record (AQI/Temp only).", city.getCityName());
            }

            // Step 4: Get previous data for comparison
            SatelliteData data = new SatelliteData();
            
            SatelliteData previousData = satelliteDataRepository.findTopByCityOrderByAnalysisDateDesc(city.getCityName());
            
            Double previousNdvi = (previousData != null) ? previousData.getNdviValue() : null;
            
            // Step 5: Fetch environmental data
            logger.info("Fetching environmental data for {}", city.getCityName());
            
            // Air quality data
            Map<String, Double> airQuality = environmentalDataService.fetchAirQuality(
                city.getLatitude(), city.getLongitude()
            );
            
            // Temperature
            Double temperature = environmentalDataService.fetchTemperature(
                city.getLatitude(), city.getLongitude()
            );
            
            // Flood risk
            Double floodRisk = environmentalDataService.calculateFloodRisk(ndvi, previousNdvi);
            
            // Calculate NDVI change percentage
            Double ndviChangePercent = null;
            if (previousNdvi != null && previousNdvi != 0) {
                ndviChangePercent = ((ndvi - previousNdvi) / previousNdvi) * 100.0;
            }
            
            // Deforestation risk
            String deforestationRisk = environmentalDataService.assessDeforestationRisk(
                ndvi, previousNdvi, ndviChangePercent
            );
            
            // Step 6: Update database with all fields
            data.setLatitude(city.getLatitude());
            data.setLongitude(city.getLongitude());
            if (ndvi != null) {
                data.setNdviValue(ndvi);
                data.setClassification(SatelliteData.Classification.valueOf(classification));
            }
            data.setAnalysisDate(LocalDateTime.now());
            data.setCity(city.getCityName());
            data.setLocationName(city.getCityName() + " (" + city.getRegion() + ")");
            data.setDataSource(tileUrl != null ? "SENTINEL-2" : "SENSOR-ONLY");

            // Set previous NDVI for tracking
            if (previousNdvi != null && ndvi != null) {
                data.setPreviousNdvi(previousNdvi);
                data.setNdviChangePercent(ndviChangePercent);
                data.setLastComparisonDate(LocalDateTime.now());
                data.setNdwiValue(0.12); // Sample NDWI for flood risk logic
            }
            
            // Set environmental data
            data.setAirQualityIndex(airQuality.get("aqi"));
            data.setPm25(airQuality.get("pm25"));
            data.setPm10(airQuality.get("pm10"));
            data.setTemperature(temperature);
            data.setFloodRisk(floodRisk);
            data.setDeforestationRisk(deforestationRisk);
            
            satelliteDataRepository.save(data);
            
            logger.info("Updated {}: NDVI={}, AQI={}, Temp={}°C, FloodRisk={}, DeforestationRisk={}",
                city.getCityName(), ndvi, airQuality.get("aqi"), temperature, floodRisk, deforestationRisk);
            return true;
            
        } catch (Exception e) {
            logger.error("Failed to update city data for {}", city.getCityName(), e);
            throw new RuntimeException("City update failed: " + e.getMessage(), e);
        }
    }
    
    /**
     * Query STAC API for latest Sentinel-2 imagery
     */
    private String queryStacApi(CityCoordinates city) {
        try {
            // Build STAC query
            String url = stacApiUrl + "/search";
            
            double[] bbox = city.getBoundingBox();
            // Use 1000 days to ensure we always find some imagery, even in cloudier regions
            LocalDateTime startWindow = LocalDateTime.now().minusDays(1000);
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss'Z'");
            String dateRange = startWindow.format(formatter) + "/" + LocalDateTime.now().format(formatter);
            
            Map<String, Object> query = new HashMap<>();
            query.put("collections", new String[]{"sentinel-2-l2a"});
            query.put("bbox", bbox);
            query.put("datetime", dateRange);
            query.put("limit", 1);
            
            // Increased cloud cover tolerance to avoid 'no imagery' errors
            Map<String, Object> cloudQuery = new HashMap<>();
            Map<String, Integer> ltFilter = new HashMap<>();
            ltFilter.put("lt", 90);
            cloudQuery.put("eo:cloud_cover", ltFilter);
            query.put("query", cloudQuery);
            
            // Sort by date descending
            Map<String, Object>[] sortBy = new Map[]{
                Map.of("field", "properties.datetime", "direction", "desc")
            };
            query.put("sortby", sortBy);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(query, headers);
            
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.POST, request, Map.class);
            
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                Map<String, Object> body = response.getBody();
                if (body.containsKey("features") && ((java.util.List<?>) body.get("features")).size() > 0) {
                    Map<String, Object> feature = (Map<String, Object>) ((java.util.List<?>) body.get("features")).get(0);
                    Map<String, Object> assets = (Map<String, Object>) feature.get("assets");
                    
                    // Look for NIR band ('nir' or 'B08')
                    Map<String, Object> nirAsset = (Map<String, Object>) assets.get("nir");
                    if (nirAsset == null) {
                        nirAsset = (Map<String, Object>) assets.get("B08");
                    }
                    
                    if (nirAsset != null && nirAsset.containsKey("href")) {
                        return (String) nirAsset.get("href");
                    }
                }
            }
            
            return null;
            
        } catch (Exception e) {
            logger.error("STAC API query failed for {}", city.getCityName(), e);
            return null;
        }
    }
    
    /**
     * Calculate NDVI using Python COG service
     */
    private Double calculateNdvi(String tileUrl, CityCoordinates city) {
        try {
            String url = pythonServiceUrl + "/ndvi-stats";
            
            Map<String, Object> request = new HashMap<>();
            request.put("tile_url", tileUrl); // Assumed B08 for derivation
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(request, headers);
            
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.POST, entity, Map.class);
            
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                Map<String, Object> body = response.getBody();
                Object ndviValue = body.get("ndvi");
                if (ndviValue != null) {
                    return ((Number) ndviValue).doubleValue();
                }
            }
            
            return null;
            
        } catch (Exception e) {
            logger.error("NDVI calculation failed for {}: {}", city.getCityName(), e.getMessage());
            return null;
        }
    }
    
    /**
     * Classify NDVI value
     */
    private String classifyNdvi(double ndvi) {
        if (ndvi >= 0.6) {
            return "HEALTHY";
        } else if (ndvi >= 0.4) {
            return "MODERATE";
        } else {
            return "UNHEALTHY";
        }
    }
}

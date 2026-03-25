package com.satellite.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

import java.util.*;

@Service
public class Sentinel2Service {

    private static final String STAC_API_URL = "https://earth-search.aws.element84.com/v1/search";
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public Sentinel2Service() {
        this.restTemplate = new RestTemplate();
        this.objectMapper = new ObjectMapper();
    }

    public Map<String, Object> searchSentinel2Scenes(Double minLat, Double maxLat, Double minLon, Double maxLon) {
        try {
            // Construct STAC search query
            Map<String, Object> searchBody = new HashMap<>();
            searchBody.put("collections", Collections.singletonList("sentinel-2-l2a"));
            
            // Bounding box: [minLon, minLat, maxLon, maxLat]
            searchBody.put("bbox", Arrays.asList(minLon, minLat, maxLon, maxLat));
            
            // Filter for low cloud cover (< 20%)
            Map<String, Object> query = new HashMap<>();
            Map<String, Object> cloudCover = new HashMap<>();
            cloudCover.put("lt", 20);
            query.put("eo:cloud_cover", cloudCover);
            searchBody.put("query", query);
            
            searchBody.put("limit", 1);
            
            // Sort by date descending
            Map<String, String> sort = new HashMap<>();
            sort.put("field", "properties.datetime");
            sort.put("direction", "desc");
            searchBody.put("sort", Collections.singletonList(sort));

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(searchBody, headers);

            System.out.println("🛰️ Searching Sentinel-2 data for bbox: " + searchBody.get("bbox"));
            
            ResponseEntity<String> response = restTemplate.postForEntity(STAC_API_URL, request, String.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JsonNode root = objectMapper.readTree(response.getBody());
                JsonNode features = root.path("features");

                if (features.isArray() && features.size() > 0) {
                    JsonNode feature = features.get(0);
                    JsonNode properties = feature.path("properties");
                    JsonNode assets = feature.path("assets");

                    Map<String, Object> result = new HashMap<>();
                    result.put("sceneId", feature.path("id").asText());
                    result.put("datetime", properties.path("datetime").asText());
                    result.put("cloudCover", properties.path("eo:cloud_cover").asDouble());
                    result.put("platform", properties.path("platform").asText());
                    
                    // Try to find a visual asset usable in browser
                    // 'thumbnail' is usually a JPEG/PNG
                    // 'visual' is usually a GeoTIFF (not directly displayable in img tag)
                    String visualUrl = "";
                    if (assets.has("thumbnail")) {
                        visualUrl = assets.path("thumbnail").path("href").asText();
                    } else if (assets.has("visual")) {
                        // Fallback to visual, though it might be a TIFF
                        visualUrl = assets.path("visual").path("href").asText();
                    }
                    
                    result.put("visualUrl", visualUrl);
                    
                    // Get geometry center for map positioning if needed
                    result.put("geometry", feature.path("geometry"));

                    System.out.println("✅ Found Sentinel-2 scene: " + result.get("sceneId"));
                    return result;
                }
            }
        } catch (Exception e) {
            System.err.println("❌ Error searching Sentinel-2 data: " + e.getMessage());
            e.printStackTrace();
        }

        return null;
    }
}

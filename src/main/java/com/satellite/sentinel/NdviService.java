package com.satellite.sentinel;

import org.springframework.web.client.RestTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.util.UriComponentsBuilder;

public class NdviService {

    private final RestTemplate restTemplate = new RestTemplate();
    private static final String PYTHON_SERVICE_URL = System.getenv("PYTHON_COG_URL") != null ? 
            System.getenv("PYTHON_COG_URL") + "/ndvi" : "http://localhost:5000/ndvi";

    public byte[] computeNdviPng(String b04Url, String b08Url) throws Exception {
        System.out.println("🐍 Calling Python COG service...");
        
        // Build URL with query parameters
        String url = UriComponentsBuilder.fromHttpUrl(PYTHON_SERVICE_URL)
                .queryParam("b04_url", b04Url)
                .queryParam("b08_url", b08Url)
                .toUriString();
        
        System.out.println("📡 Python service URL: " + url);
        
        // Call Python service
        ResponseEntity<byte[]> response = restTemplate.getForEntity(url, byte[].class);
        
        if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
            System.out.println("✅ Received NDVI PNG from Python service: " + response.getBody().length + " bytes");
            return response.getBody();
        } else {
            throw new Exception("Python service returned error: " + response.getStatusCode());
        }
    }
}

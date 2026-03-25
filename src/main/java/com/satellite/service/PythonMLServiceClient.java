package com.satellite.service;

import com.satellite.dto.PythonMLResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.RestClientException;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.logging.Logger;

/**
 * HTTP Client for Python ML Service
 * Handles communication with Python Flask service on port 5000
 */
@Service
public class PythonMLServiceClient {
    
    private static final Logger logger = Logger.getLogger(PythonMLServiceClient.class.getName());
    
    @Value("${python.ml.service.url:http://localhost:5000}")
    private String pythonServiceUrl;
    
    @Value("${python.ml.service.timeout:30000}")
    private int timeout;
    
    private final RestTemplate restTemplate;
    
    public PythonMLServiceClient() {
        this.restTemplate = new RestTemplate();
    }
    
    /**
     * Check if Python ML service is available
     */
    public boolean isServiceAvailable() {
        try {
            String url = pythonServiceUrl + "/health";
            ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);
            return response.getStatusCode() == HttpStatus.OK;
        } catch (Exception e) {
            logger.warning("Python ML service not available: " + e.getMessage());
            return false;
        }
    }
    
    /**
     * Validate if uploaded image is satellite imagery
     */
    public PythonMLResponse.ValidationResponse validateImage(MultipartFile file) {
        try {
            String url = pythonServiceUrl + "/validate-image";
            
            // Create temp file
            Path tempFile = Files.createTempFile("validate_", file.getOriginalFilename());
            file.transferTo(tempFile.toFile());
            
            try {
                // Prepare multipart request
                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.MULTIPART_FORM_DATA);
                
                MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
                body.add("image", new FileSystemResource(tempFile.toFile()));
                
                HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);
                
                // Call Python service
                ResponseEntity<PythonMLResponse.ValidationResponse> response = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    requestEntity,
                    PythonMLResponse.ValidationResponse.class
                );
                
                return response.getBody();
                
            } finally {
                // Clean up temp file
                Files.deleteIfExists(tempFile);
            }
            
        } catch (IOException e) {
            logger.severe("Error validating image: " + e.getMessage());
            PythonMLResponse.ValidationResponse errorResponse = new PythonMLResponse.ValidationResponse();
            errorResponse.setError("Failed to validate image: " + e.getMessage());
            errorResponse.setSatelliteImagery(false);
            errorResponse.setConfidence(0.0);
            return errorResponse;
        } catch (RestClientException e) {
            logger.severe("Python service error: " + e.getMessage());
            PythonMLResponse.ValidationResponse errorResponse = new PythonMLResponse.ValidationResponse();
            errorResponse.setError("Python service unavailable: " + e.getMessage());
            errorResponse.setSatelliteImagery(false);
            errorResponse.setConfidence(0.0);
            return errorResponse;
        }
    }
    
    /**
     * Classify satellite image using ML
     */
    public PythonMLResponse.ClassificationResponse classifyImage(MultipartFile file) {
        try {
            String url = pythonServiceUrl + "/classify";
            
            // Create temp file
            Path tempFile = Files.createTempFile("classify_", file.getOriginalFilename());
            file.transferTo(tempFile.toFile());
            
            try {
                // Prepare multipart request
                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.MULTIPART_FORM_DATA);
                
                MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
                body.add("image", new FileSystemResource(tempFile.toFile()));
                
                HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);
                
                // Call Python service
                ResponseEntity<PythonMLResponse.ClassificationResponse> response = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    requestEntity,
                    PythonMLResponse.ClassificationResponse.class
                );
                
                return response.getBody();
                
            } finally {
                Files.deleteIfExists(tempFile);
            }
            
        } catch (Exception e) {
            logger.severe("Error classifying image: " + e.getMessage());
            PythonMLResponse.ClassificationResponse errorResponse = new PythonMLResponse.ClassificationResponse();
            errorResponse.setSuccess(false);
            errorResponse.setError("Classification failed: " + e.getMessage());
            return errorResponse;
        }
    }
    
    /**
     * Comprehensive multispectral analysis (NDVI + ML)
     */
    public PythonMLResponse.AnalysisResponse analyzeImage(MultipartFile file) {
        try {
            String url = pythonServiceUrl + "/analyze";
            
            logger.info("Sending image to Python ML service for analysis: " + file.getOriginalFilename());
            
            // Create temp file
            Path tempFile = Files.createTempFile("analyze_", file.getOriginalFilename());
            file.transferTo(tempFile.toFile());
            
            try {
                // Prepare multipart request
                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.MULTIPART_FORM_DATA);
                
                MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
                body.add("image", new FileSystemResource(tempFile.toFile()));
                
                HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);
                
                // Call Python service as String first to log raw JSON if needed
                ResponseEntity<String> rawResponse = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    requestEntity,
                    String.class
                );
                
                logger.info("Raw Python Response: " + rawResponse.getBody());
                
                // Now parse it
                PythonMLResponse.AnalysisResponse result = new com.fasterxml.jackson.databind.ObjectMapper()
                    .readValue(rawResponse.getBody(), PythonMLResponse.AnalysisResponse.class);
                
                if (result != null && result.isSuccess()) {
                    logger.info("✅ Python ML analysis successful!");
                    logger.info("ML Classification: " + 
                        (result.getMlClassification() != null ? result.getMlClassification().getPrimaryClass() : "N/A"));
                    logger.info("NDVI Mean: " + 
                        (result.getNdviStats() != null ? result.getNdviStats().getMean() : "N/A"));
                } else {
                    logger.warning("Python ML analysis returned error: " + 
                        (result != null ? result.getError() : "Unknown error"));
                }
                
                return result;
                
            } finally {
                Files.deleteIfExists(tempFile);
            }
            
        } catch (Exception e) {
            logger.severe("Error analyzing image with Python ML: " + e.getMessage());
            e.printStackTrace();
            
            PythonMLResponse.AnalysisResponse errorResponse = new PythonMLResponse.AnalysisResponse();
            errorResponse.setSuccess(false);
            errorResponse.setError("Analysis failed: " + e.getMessage());
            return errorResponse;
        }
    }
    
    /**
     * Fetch satellite imagery from NASA Earthdata
     */
    public String fetchSatelliteData(double lat, double lng, int daysBack) {
        try {
            String url = String.format(
                "%s/fetch-satellite?lat=%f&lng=%f&days_back=%d",
                pythonServiceUrl, lat, lng, daysBack
            );
            
            ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);
            return response.getBody();
            
        } catch (Exception e) {
            logger.severe("Error fetching satellite data: " + e.getMessage());
            return "{\"success\": false, \"error\": \"" + e.getMessage() + "\"}";
        }
    }
}

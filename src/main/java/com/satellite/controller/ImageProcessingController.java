package com.satellite.controller;

import com.satellite.dto.PythonMLResponse;
import com.satellite.service.ImageProcessingService;
import com.satellite.service.PythonMLServiceClient;
import com.satellite.service.SatelliteImageValidator;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;
import java.util.logging.Logger;

/**
 * REST Controller for Image Processing Operations
 * Handles satellite image uploads and processing with ML validation
 */
@RestController
@RequestMapping("/api/image")
@CrossOrigin(origins = "*")
public class ImageProcessingController {
    private static final Logger logger = Logger.getLogger(ImageProcessingController.class.getName());

    @Autowired
    private ImageProcessingService imageProcessingService;
    
    @Autowired
    private PythonMLServiceClient pythonMLClient;

    @Autowired
    private SatelliteImageValidator satelliteImageValidator;
    
    @Value("${python.ml.service.enabled:true}")
    private boolean mlServiceEnabled;

    /**
     * Upload and process satellite image with ML validation
     * Extracts NDVI, classification, and anomalies using Python ML service
     */
    @PostMapping(value = "/process", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, Object>> processImage(
            @RequestParam("image") MultipartFile file) {
        
        try {
            if (file.isEmpty()) {
                Map<String, Object> error = new HashMap<>();
                error.put("error", "Please select an image file to upload");
                error.put("success", false);
                return ResponseEntity.badRequest().body(error);
            }

            // Validate file type
            String contentType = file.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                Map<String, Object> error = new HashMap<>();
                error.put("error", "File must be an image (JPEG, PNG, TIFF, etc.)");
                error.put("success", false);
                return ResponseEntity.badRequest().body(error);
            }

            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("filename", file.getOriginalFilename());
            
            // Extract basic metadata (no rejection)
            double confidenceScore = 50.0; // Default moderate confidence
            String confidenceCategory = "Unknown";
            
            try {
                com.satellite.model.ImageMetadata metadata = satelliteImageValidator.extractMetadata(file);
                logger.info("Image metadata extracted: " + metadata.getWidth() + "x" + metadata.getHeight());
                
                result.put("width", metadata.getWidth());
                result.put("height", metadata.getHeight());
                result.put("format", metadata.getFormat());
            } catch (Exception e) {
                logger.warning("Metadata extraction failed: " + e.getMessage());
            }

            // Try Python ML validation (but NEVER reject)
            if (mlServiceEnabled && pythonMLClient.isServiceAvailable()) {
                logger.info("Python ML service available - checking confidence");
                
                try {
                    PythonMLResponse.ValidationResponse validation = pythonMLClient.validateImage(file);
                    
                    if (validation != null && validation.getError() == null) {
                        confidenceScore = validation.getConfidence();
                        
                        // Categorize confidence
                        if (confidenceScore >= 75.0) {
                            confidenceCategory = "High Confidence Satellite Imagery";
                        } else if (confidenceScore >= 50.0) {
                            confidenceCategory = "Moderate Confidence";
                        } else if (confidenceScore >= 25.0) {
                            confidenceCategory = "Low Confidence";
                        } else {
                            confidenceCategory = "Likely Not Satellite Imagery";
                        }
                        
                        result.put("satelliteConfidence", confidenceScore);
                        result.put("confidenceCategory", confidenceCategory);
                        result.put("isSatelliteImagery", validation.isSatelliteImagery());
                        result.put("validationReasons", validation.getReasons());
                    }
                } catch (Exception e) {
                    logger.warning("ML validation check failed: " + e.getMessage());
                }

                // Try ML Analysis (but don't reject on failure)
                try {
                    PythonMLResponse.AnalysisResponse analysis = pythonMLClient.analyzeImage(file);
                    
                    if (analysis != null && analysis.isSuccess()) {
                        result.put("width", analysis.getDimensions().getWidth());
                        result.put("height", analysis.getDimensions().getHeight());
                        result.put("bands", analysis.getBands());
                        result.put("ndviStats", analysis.getNdviStats());
                        result.put("vegetationClassification", analysis.getVegetationClassification());
                        result.put("mlClassification", analysis.getMlClassification());
                        result.put("landCover", analysis.getLandCover());
                        result.put("primaryLandUse", analysis.getPrimaryLandUse());
                        result.put("processingMethod", "Python ML Analysis");
                        result.put("mlProcessed", true);
                        
                        logger.info("ML analysis completed successfully");
                        return ResponseEntity.ok(result);
                    }
                } catch (Exception e) {
                    logger.warning("ML analysis failed, using Java fallback: " + e.getMessage());
                }
            }
            
            // Fallback to Java processing (ALWAYS works)
            logger.info("Using Java processing for image analysis");
            Map<String, Object> javaResult = imageProcessingService.processImage(file);
            result.putAll(javaResult);
            result.put("processingMethod", "Java Basic Processing");
            result.put("mlProcessed", false);
            result.put("satelliteConfidence", confidenceScore);
            result.put("confidenceCategory", confidenceCategory);
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Failed to process image: " + e.getMessage());
            error.put("success", false);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    /**
     * Apply filter to satellite image
     * Filters: grayscale, sharpen, blur, enhance, edge
     */
    @PostMapping(value = "/filter", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<byte[]> applyFilter(
            @RequestParam("image") MultipartFile file,
            @RequestParam("filterType") String filterType) {
        
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().build();
            }

            byte[] filteredImage = imageProcessingService.applyFilter(file, filterType);
            
            return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_PNG)
                .body(filteredImage);
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Resize satellite image
     */
    @PostMapping(value = "/resize", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<byte[]> resizeImage(
            @RequestParam("image") MultipartFile file,
            @RequestParam("width") int width,
            @RequestParam("height") int height) {
        
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().build();
            }

            if (width <= 0 || height <= 0 || width > 4000 || height > 4000) {
                return ResponseEntity.badRequest().build();
            }

            byte[] resizedImage = imageProcessingService.resizeImage(file, width, height);
            
            return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_PNG)
                .body(resizedImage);
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Health check for image processing service
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> healthCheck() {
        Map<String, Object> health = new HashMap<>();
        health.put("status", "OK");
        health.put("service", "Image Processing Service");
        health.put("features", new String[]{
            "NDVI Calculation",
            "Vegetation Classification",
            "Anomaly Detection",
            "Image Filtering (grayscale, sharpen, blur, enhance, edge)",
            "Image Resizing"
        });
        health.put("supportedFormats", new String[]{"JPEG", "PNG", "TIFF", "BMP"});
        health.put("timestamp", System.currentTimeMillis());
        
        return ResponseEntity.ok(health);
    }
}

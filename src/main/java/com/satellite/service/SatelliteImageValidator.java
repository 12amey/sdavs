package com.satellite.service;

import com.satellite.exception.InvalidSatelliteImageException;
import com.satellite.model.ImageMetadata;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import javax.imageio.ImageReader;
import javax.imageio.metadata.IIOMetadata;
import javax.imageio.stream.ImageInputStream;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.*;
import java.util.logging.Logger;

/**
 * Service to validate if uploaded images are actual satellite imagery
 * Checks metadata, format, spectral bands, and geospatial information
 */
@Service
public class SatelliteImageValidator {
    
    private static final Logger logger = Logger.getLogger(SatelliteImageValidator.class.getName());
    
    // Supported satellite image formats
    private static final Set<String> SATELLITE_FORMATS = Set.of(
        "image/tiff", "image/tif", "image/geotiff",
        "image/jp2", "image/jpeg2000", // JPEG2000 for Sentinel-2
        "image/png", "image/jpeg" // RGB exports (with warnings)
    );
    
    // Minimum resolution for satellite imagery (in pixels)
    private static final int MIN_SATELLITE_RESOLUTION = 64;
    
    /**
     * Validate if uploaded file is satellite imagery
     */
    public ImageMetadata validateSatelliteImage(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new InvalidSatelliteImageException("No file provided");
        }
        
        // Extract metadata
        ImageMetadata metadata = extractMetadata(file);
        
        // Validate format
        validateFormat(metadata, file);
        
        // Check if it's likely satellite imagery
        boolean isSatellite = isSatelliteImagery(metadata);
        metadata.setSatelliteImagery(isSatellite);
        
        if (!isSatellite) {
            String message = buildValidationMessage(metadata);
            metadata.setValidationMessage(message);
            throw new InvalidSatelliteImageException(
                message,
                "Please upload satellite imagery from sources like Sentinel-2, Landsat, or MODIS. " +
                "Supported formats: GeoTIFF (.tif), JPEG2000 (.jp2), COG"
            );
        }
        
        metadata.setValidationMessage("Valid satellite imagery detected");
        return metadata;
    }
    
    /**
     * Extract metadata from uploaded image
     */
    public ImageMetadata extractMetadata(MultipartFile file) throws IOException {
        ImageMetadata.ImageMetadataBuilder builder = ImageMetadata.builder()
            .fileName(file.getOriginalFilename())
            .format(file.getContentType())
            .fileSizeBytes(file.getSize());
        
        // Create temporary file for analysis
        Path tempFile = Files.createTempFile("satellite_upload_", getFileExtension(file.getOriginalFilename()));
        try {
            file.transferTo(tempFile.toFile());
            
            // Try to read as GeoTIFF first
            if (isGeoTiff(file.getContentType(), file.getOriginalFilename())) {
                extractGeoTiffMetadata(tempFile.toFile(), builder);
            } else {
                // Standard image metadata
                extractStandardImageMetadata(tempFile.toFile(), builder);
            }
            
        } finally {
            Files.deleteIfExists(tempFile);
        }
        
        return builder.build();
    }
    
    /**
     * Extract metadata from GeoTIFF files
     */
    private void extractGeoTiffMetadata(File file, ImageMetadata.ImageMetadataBuilder builder) {
        try (ImageInputStream iis = ImageIO.createImageInputStream(file)) {
            Iterator<ImageReader> readers = ImageIO.getImageReaders(iis);
            
            if (readers.hasNext()) {
                ImageReader reader = readers.next();
                reader.setInput(iis);
                
                // Basic dimensions
                int width = reader.getWidth(0);
                int height = reader.getHeight(0);
                builder.width(width).height(height);
                
                // Try to get metadata
                IIOMetadata metadata = reader.getImageMetadata(0);
                if (metadata != null) {
                    // Check for geospatial tags
                    String[] metadataFormats = metadata.getMetadataFormatNames();
                    boolean hasGeoTags = Arrays.stream(metadataFormats)
                        .anyMatch(format -> format.toLowerCase().contains("geo") || 
                                           format.toLowerCase().contains("tiff"));
                    
                    builder.hasGeospatialInfo(hasGeoTags);
                    
                    if (hasGeoTags) {
                        logger.info("GeoTIFF tags detected in image");
                        // Mark as likely satellite imagery
                        builder.confidenceScore(85.0);
                    }
                }
                
                reader.dispose();
            }
        } catch (Exception e) {
            logger.warning("Could not extract GeoTIFF metadata: " + e.getMessage());
        }
    }
    
    /**
     * Extract metadata from standard image formats (JPEG, PNG)
     */
    private void extractStandardImageMetadata(File file, ImageMetadata.ImageMetadataBuilder builder) {
        try {
            BufferedImage image = ImageIO.read(file);
            if (image != null) {
                int width = image.getWidth();
                int height = image.getHeight();
                builder.width(width)
                       .height(height);
                
                // Analyze color model to detect bands
                int bands = image.getColorModel().getNumComponents();
                builder.bands(bands);
                
                // RGB images could be satellite imagery exports (Landsat, Google Earth, etc.)
                // Give higher confidence to large, high-resolution images
                if (bands == 3) {
                    builder.hasRedBand(true)
                           .hasGreenBand(true)
                           .hasBlueBand(true)
                           .hasNIRBand(false);
                    
                    // High-resolution imagery is likely satellite data export
                    if (width >= 1024 && height >= 1024) {
                        builder.confidenceScore(50.0); // Moderate confidence for large RGB images
                        logger.info("High-resolution RGB image detected: " + width + "x" + height);
                    } else {
                        builder.confidenceScore(20.0); // Low confidence for small images
                    }
                }
                
                // Check EXIF data
                extractExifData(file, builder);
            }
        } catch (Exception e) {
            logger.warning("Could not extract image metadata: " + e.getMessage());
        }
    }
    
    /**
     * Extract EXIF data if available
     */
    private void extractExifData(File file, ImageMetadata.ImageMetadataBuilder builder) {
        // EXIF extraction would require additional library (like metadata-extractor)
        // For now, we'll mark as having minimal metadata
        builder.hasGeospatialInfo(false);
    }
    
    /**
     * Determine if image is likely satellite imagery
     */
    private boolean isSatelliteImagery(ImageMetadata metadata) {
        double score = metadata.getConfidenceScore();
        
        // High confidence if:
        // 1. GeoTIFF format with geospatial tags
        if (metadata.isHasGeospatialInfo()) {
            score += 40.0;
        }
        
        // 2. Has multiple spectral bands (more than RGB)
        if (metadata.getBands() > 3) {
            score += 30.0;
        }
        
        // 3. Large resolution (satellite imagery is usually high-res)
        if (metadata.getWidth() >= 512 && metadata.getHeight() >= 512) {
            score += 20.0;
        }
        
        // 4. Format is typical for satellite data
        if (metadata.getFormat() != null && 
            (metadata.getFormat().contains("tiff") || 
             metadata.getFormat().contains("jp2"))) {
            score += 20.0;
        }
        
        // 5. File size indicates multi-band data
        if (metadata.getFileSizeBytes() > 1_000_000) { // > 1MB
            score += 10.0;
        }
        
        // Update confidence score
        metadata.setConfidenceScore(Math.min(100.0, score));
        
        // Consider it satellite imagery if confidence > 60%
        return score >= 60.0;
    }
    
    /**
     * Validate file format
     */
    private void validateFormat(ImageMetadata metadata, MultipartFile file) {
        String contentType = file.getContentType();
        
        if (contentType == null || !SATELLITE_FORMATS.contains(contentType.toLowerCase())) {
            // Check file extension as backup
            String filename = file.getOriginalFilename();
            if (filename != null && 
                (filename.toLowerCase().endsWith(".tif") || 
                 filename.toLowerCase().endsWith(".tiff") ||
                 filename.toLowerCase().endsWith(".jp2"))) {
                // Accept based on extension
                return;
            }
            
            throw new InvalidSatelliteImageException(
                "Unsupported file format: " + contentType,
                "Please upload GeoTIFF (.tif), JPEG2000 (.jp2), or other satellite imagery formats"
            );
        }
    }
    
    /**
     * Build validation error message
     */
    private String buildValidationMessage(ImageMetadata metadata) {
        List<String> issues = new ArrayList<>();
        
        if (!metadata.isHasGeospatialInfo()) {
            issues.add("No geospatial metadata found");
        }
        
        if (metadata.getBands() <= 3) {
            issues.add("Only RGB bands detected (no NIR or other spectral bands)");
        }
        
        if (metadata.getWidth() < MIN_SATELLITE_RESOLUTION || 
            metadata.getHeight() < MIN_SATELLITE_RESOLUTION) {
            issues.add("Resolution too low for satellite imagery");
        }
        
        // Only flag small JPEG images as likely photos
        if (metadata.getFormat() != null && metadata.getFormat().contains("jpeg") && 
            !metadata.getFormat().contains("jpeg2000")) {
            if (metadata.getWidth() < 1024 || metadata.getHeight() < 1024) {
                issues.add("Small JPEG format detected (likely a photo or screenshot, not satellite data)");
            }
        }
        
        return "Invalid satellite imagery detected: " + String.join(", ", issues) + 
               ". Confidence score: " + String.format("%.1f%%", metadata.getConfidenceScore());
    }
    
    /**
     * Check if file is GeoTIFF
     */
    private boolean isGeoTiff(String contentType, String filename) {
        if (contentType != null && contentType.toLowerCase().contains("tiff")) {
            return true;
        }
        if (filename != null && 
            (filename.toLowerCase().endsWith(".tif") || 
             filename.toLowerCase().endsWith(".tiff"))) {
            return true;
        }
        return false;
    }
    
    /**
     * Get file extension
     */
    private String getFileExtension(String filename) {
        if (filename == null) return "";
        int lastDot = filename.lastIndexOf('.');
        return lastDot > 0 ? filename.substring(lastDot) : "";
    }
}

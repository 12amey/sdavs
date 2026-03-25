package com.satellite.model;

import java.util.Map;
import java.util.List;
import java.util.ArrayList;

/**
 * Metadata extracted from satellite imagery
 */
public class ImageMetadata {
    private String fileName;
    private String format; // GeoTIFF, COG, JPEG, PNG, etc.
    private long fileSizeBytes;
    
    // Image dimensions
    private int width;
    private int height;
    private int bands; // Number of spectral bands
    
    // Geospatial metadata
    private boolean hasGeospatialInfo;
    private String coordinateSystem; // e.g., EPSG:4326
    private Double latitude;
    private Double longitude;
    private Double pixelSizeX;
    private Double pixelSizeY;
    
    // Spectral information
    private List<SpectralBand> spectralBands = new ArrayList<>();
    private boolean hasNIRBand; // Near-Infrared
    private boolean hasRedBand;
    private boolean hasGreenBand;
    private boolean hasBlueBand;
    
    // Metadata from EXIF/GeoTIFF tags
    private String acquisitionDate;
    private String satellite; // e.g., Sentinel-2A, Landsat-8
    private String sensor;
    private Map<String, String> additionalMetadata;
    
    // Validation results
    private boolean isSatelliteImagery;
    private String validationMessage;
    private double confidenceScore; // 0-100
    
    public ImageMetadata() {}

    // Getters and Setters
    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }
    public String getFormat() { return format; }
    public void setFormat(String format) { this.format = format; }
    public long getFileSizeBytes() { return fileSizeBytes; }
    public void setFileSizeBytes(long fileSizeBytes) { this.fileSizeBytes = fileSizeBytes; }
    public int getWidth() { return width; }
    public void setWidth(int width) { this.width = width; }
    public int getHeight() { return height; }
    public void setHeight(int height) { this.height = height; }
    public int getBands() { return bands; }
    public void setBands(int bands) { this.bands = bands; }
    public boolean isHasGeospatialInfo() { return hasGeospatialInfo; }
    public void setHasGeospatialInfo(boolean hasGeospatialInfo) { this.hasGeospatialInfo = hasGeospatialInfo; }
    public String getCoordinateSystem() { return coordinateSystem; }
    public void setCoordinateSystem(String coordinateSystem) { this.coordinateSystem = coordinateSystem; }
    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }
    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }
    public Double getPixelSizeX() { return pixelSizeX; }
    public void setPixelSizeX(Double pixelSizeX) { this.pixelSizeX = pixelSizeX; }
    public Double getPixelSizeY() { return pixelSizeY; }
    public void setPixelSizeY(Double pixelSizeY) { this.pixelSizeY = pixelSizeY; }
    public List<SpectralBand> getSpectralBands() { return spectralBands; }
    public void setSpectralBands(List<SpectralBand> spectralBands) { this.spectralBands = spectralBands; }
    public boolean isHasNIRBand() { return hasNIRBand; }
    public void setHasNIRBand(boolean hasNIRBand) { this.hasNIRBand = hasNIRBand; }
    public boolean isHasRedBand() { return hasRedBand; }
    public void setHasRedBand(boolean hasRedBand) { this.hasRedBand = hasRedBand; }
    public boolean isHasGreenBand() { return hasGreenBand; }
    public void setHasGreenBand(boolean hasGreenBand) { this.hasGreenBand = hasGreenBand; }
    public boolean isHasBlueBand() { return hasBlueBand; }
    public void setHasBlueBand(boolean hasBlueBand) { this.hasBlueBand = hasBlueBand; }
    public String getAcquisitionDate() { return acquisitionDate; }
    public void setAcquisitionDate(String acquisitionDate) { this.acquisitionDate = acquisitionDate; }
    public String getSatellite() { return satellite; }
    public void setSatellite(String satellite) { this.satellite = satellite; }
    public String getSensor() { return sensor; }
    public void setSensor(String sensor) { this.sensor = sensor; }
    public Map<String, String> getAdditionalMetadata() { return additionalMetadata; }
    public void setAdditionalMetadata(Map<String, String> additionalMetadata) { this.additionalMetadata = additionalMetadata; }
    public boolean isSatelliteImagery() { return isSatelliteImagery; }
    public void setSatelliteImagery(boolean satelliteImagery) { isSatelliteImagery = satelliteImagery; }
    public String getValidationMessage() { return validationMessage; }
    public void setValidationMessage(String validationMessage) { this.validationMessage = validationMessage; }
    public double getConfidenceScore() { return confidenceScore; }
    public void setConfidenceScore(double confidenceScore) { this.confidenceScore = confidenceScore; }

    public static class SpectralBand {
        private int bandNumber;
        private String name; // e.g., "B04 - Red", "B08 - NIR"
        private double centerWavelength; // in nanometers
        private double bandwidth;
        private String description;

        public SpectralBand() {}
        public int getBandNumber() { return bandNumber; }
        public void setBandNumber(int bandNumber) { this.bandNumber = bandNumber; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public double getCenterWavelength() { return centerWavelength; }
        public void setCenterWavelength(double centerWavelength) { this.centerWavelength = centerWavelength; }
        public double getBandwidth() { return bandwidth; }
        public void setBandwidth(double bandwidth) { this.bandwidth = bandwidth; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
    }

    // Builder pattern implementation (manually added search replacements helper)
    public static ImageMetadataBuilder builder() {
        return new ImageMetadataBuilder();
    }

    public static class ImageMetadataBuilder {
        private ImageMetadata instance = new ImageMetadata();

        public ImageMetadataBuilder fileName(String fileName) { instance.setFileName(fileName); return this; }
        public ImageMetadataBuilder format(String format) { instance.setFormat(format); return this; }
        public ImageMetadataBuilder fileSizeBytes(long fileSizeBytes) { instance.setFileSizeBytes(fileSizeBytes); return this; }
        public ImageMetadataBuilder width(int width) { instance.setWidth(width); return this; }
        public ImageMetadataBuilder height(int height) { instance.setHeight(height); return this; }
        public ImageMetadataBuilder bands(int bands) { instance.setBands(bands); return this; }
        public ImageMetadataBuilder hasGeospatialInfo(boolean hasGeospatialInfo) { instance.setHasGeospatialInfo(hasGeospatialInfo); return this; }
        public ImageMetadataBuilder hasRedBand(boolean hasRedBand) { instance.setHasRedBand(hasRedBand); return this; }
        public ImageMetadataBuilder hasGreenBand(boolean hasGreenBand) { instance.setHasGreenBand(hasGreenBand); return this; }
        public ImageMetadataBuilder hasBlueBand(boolean hasBlueBand) { instance.setHasBlueBand(hasBlueBand); return this; }
        public ImageMetadataBuilder hasNIRBand(boolean hasNIRBand) { instance.setHasNIRBand(hasNIRBand); return this; }
        public ImageMetadataBuilder confidenceScore(double confidenceScore) { instance.setConfidenceScore(confidenceScore); return this; }
        
        public ImageMetadata build() { return instance; }
    }
}

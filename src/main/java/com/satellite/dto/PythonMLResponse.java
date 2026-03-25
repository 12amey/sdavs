package com.satellite.dto;

import java.util.Map;
import java.util.List;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * Response DTOs for Python ML Service
 */
public class PythonMLResponse {
    
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class AnalysisResponse {
        private boolean success;
        private String filename;
        private Dimensions dimensions;
        private int bands;
        
        @JsonProperty("ndvi_stats")
        private NdviStats ndviStats;
        
        @JsonProperty("vegetation_classification")
        private Map<String, Double> vegetationClassification;
        
        @JsonProperty("ml_classification")
        private MLClassification mlClassification;
        
        @JsonProperty("land_cover")
        private Map<String, Double> landCover;
        
        @JsonProperty("primary_land_use")
        private String primaryLandUse;
        
        @JsonProperty("validation_confidence")
        private double validationConfidence;
        
        private String method;
        
        @JsonProperty("is_satellite_imagery")
        private boolean isSatelliteImagery;
        
        private String error;

        public AnalysisResponse() {}

        public boolean isSuccess() { return success; }
        public void setSuccess(boolean success) { this.success = success; }
        public String getFilename() { return filename; }
        public void setFilename(String filename) { this.filename = filename; }
        public Dimensions getDimensions() { return dimensions; }
        public void setDimensions(Dimensions dimensions) { this.dimensions = dimensions; }
        public int getBands() { return bands; }
        public void setBands(int bands) { this.bands = bands; }
        public NdviStats getNdviStats() { return ndviStats; }
        public void setNdviStats(NdviStats ndviStats) { this.ndviStats = ndviStats; }
        public Map<String, Double> getVegetationClassification() { return vegetationClassification; }
        public void setVegetationClassification(Map<String, Double> vegetationClassification) { this.vegetationClassification = vegetationClassification; }
        public MLClassification getMlClassification() { return mlClassification; }
        public void setMlClassification(MLClassification mlClassification) { this.mlClassification = mlClassification; }
        public Map<String, Double> getLandCover() { return landCover; }
        public void setLandCover(Map<String, Double> landCover) { this.landCover = landCover; }
        public String getPrimaryLandUse() { return primaryLandUse; }
        public void setPrimaryLandUse(String primaryLandUse) { this.primaryLandUse = primaryLandUse; }
        public double getValidationConfidence() { return validationConfidence; }
        public void setValidationConfidence(double validationConfidence) { this.validationConfidence = validationConfidence; }
        public String getMethod() { return method; }
        public void setMethod(String method) { this.method = method; }
        public boolean isSatelliteImagery() { return isSatelliteImagery; }
        public void setSatelliteImagery(boolean satelliteImagery) { isSatelliteImagery = satelliteImagery; }
        public String getError() { return error; }
        public void setError(String error) { this.error = error; }
    }
    
    public static class Dimensions {
        private int width;
        private int height;

        public Dimensions() {}
        public int getWidth() { return width; }
        public void setWidth(int width) { this.width = width; }
        public int getHeight() { return height; }
        public void setHeight(int height) { this.height = height; }
    }
    
    public static class NdviStats {
        private double mean;
        private double median;
        private double std;
        private double min;
        private double max;

        public NdviStats() {}
        public double getMean() { return mean; }
        public void setMean(double mean) { this.mean = mean; }
        public double getMedian() { return median; }
        public void setMedian(double median) { this.median = median; }
        public double getStd() { return std; }
        public void setStd(double std) { this.std = std; }
        public double getMin() { return min; }
        public void setMin(double min) { this.min = min; }
        public double getMax() { return max; }
        public void setMax(double max) { this.max = max; }
    }
    
    public static class MLClassification {
        private boolean success;
        
        @JsonProperty("primary_class")
        private String primaryClass;
        
        private double confidence;
        
        @JsonProperty("all_predictions")
        private List<Prediction> allPredictions;
        
        private String method;
        
        @JsonProperty("bands_used")
        private List<String> bandsUsed;
        
        private String error;

        public MLClassification() {}
        public boolean isSuccess() { return success; }
        public void setSuccess(boolean success) { this.success = success; }
        public String getPrimaryClass() { return primaryClass; }
        public void setPrimaryClass(String primaryClass) { this.primaryClass = primaryClass; }
        public double getConfidence() { return confidence; }
        public void setConfidence(double confidence) { this.confidence = confidence; }
        public List<Prediction> getAllPredictions() { return allPredictions; }
        public void setAllPredictions(List<Prediction> allPredictions) { this.allPredictions = allPredictions; }
        public String getMethod() { return method; }
        public void setMethod(String method) { this.method = method; }
        public List<String> getBandsUsed() { return bandsUsed; }
        public void setBandsUsed(List<String> bandsUsed) { this.bandsUsed = bandsUsed; }
        public String getError() { return error; }
        public void setError(String error) { this.error = error; }
    }
    
    public static class Prediction {
        @JsonProperty("class")
        private String className;
        
        private double confidence;

        public Prediction() {}
        public String getClassName() { return className; }
        public void setClassName(String className) { this.className = className; }
        public double getConfidence() { return confidence; }
        public void setConfidence(double confidence) { this.confidence = confidence; }
    }
    
    public static class ValidationResponse {
        @JsonProperty("is_satellite_imagery")
        private boolean isSatelliteImagery;
        private double confidence;
        private List<String> reasons;
        private ValidationMetadata metadata;
        private String error;

        public ValidationResponse() {}
        public boolean isSatelliteImagery() { return isSatelliteImagery; }
        public void setSatelliteImagery(boolean satelliteImagery) { isSatelliteImagery = satelliteImagery; }
        public double getConfidence() { return confidence; }
        public void setConfidence(double confidence) { this.confidence = confidence; }
        public List<String> getReasons() { return reasons; }
        public void setReasons(List<String> reasons) { this.reasons = reasons; }
        public ValidationMetadata getMetadata() { return metadata; }
        public void setMetadata(ValidationMetadata metadata) { this.metadata = metadata; }
        public String getError() { return error; }
        public void setError(String error) { this.error = error; }
    }
    
    public static class ValidationMetadata {
        private int width;
        private int height;
        private int bands;
        
        @JsonProperty("has_geospatial_info")
        private boolean hasGeospatialInfo;

        public ValidationMetadata() {}
        public int getWidth() { return width; }
        public void setWidth(int width) { this.width = width; }
        public int getHeight() { return height; }
        public void setHeight(int height) { this.height = height; }
        public int getBands() { return bands; }
        public void setBands(int bands) { this.bands = bands; }
        public boolean isHasGeospatialInfo() { return hasGeospatialInfo; }
        public void setHasGeospatialInfo(boolean hasGeospatialInfo) { this.hasGeospatialInfo = hasGeospatialInfo; }
    }
    
    public static class ClassificationResponse {
        private boolean success;
        private String primaryClass;
        private double confidence;
        private List<Prediction> allPredictions;
        private String method;
        private String error;

        public ClassificationResponse() {}
        public boolean isSuccess() { return success; }
        public void setSuccess(boolean success) { this.success = success; }
        public String getPrimaryClass() { return primaryClass; }
        public void setPrimaryClass(String primaryClass) { this.primaryClass = primaryClass; }
        public double getConfidence() { return confidence; }
        public void setConfidence(double confidence) { this.confidence = confidence; }
        public List<Prediction> getAllPredictions() { return allPredictions; }
        public void setAllPredictions(List<Prediction> allPredictions) { this.allPredictions = allPredictions; }
        public String getMethod() { return method; }
        public void setMethod(String method) { this.method = method; }
        public String getError() { return error; }
        public void setError(String error) { this.error = error; }
    }
}

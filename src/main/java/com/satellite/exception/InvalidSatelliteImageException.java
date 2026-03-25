package com.satellite.exception;

/**
 * Exception thrown when uploaded image is not valid satellite imagery
 */
public class InvalidSatelliteImageException extends RuntimeException {
    
    private final String reason;
    private final String suggestion;
    
    public InvalidSatelliteImageException(String message) {
        super(message);
        this.reason = message;
        this.suggestion = "Please upload valid satellite imagery (GeoTIFF, COG, or multispectral formats)";
    }
    
    public InvalidSatelliteImageException(String message, String suggestion) {
        super(message);
        this.reason = message;
        this.suggestion = suggestion;
    }
    
    public InvalidSatelliteImageException(String message, Throwable cause) {
        super(message, cause);
        this.reason = message;
        this.suggestion = "Please check the image format and try again";
    }
    
    public String getReason() {
        return reason;
    }
    
    public String getSuggestion() {
        return suggestion;
    }
}

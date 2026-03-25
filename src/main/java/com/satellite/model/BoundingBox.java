package com.satellite.model;

/**
 * Geographic bounding box for area selection
 */
public class BoundingBox {
    
    private double minLat;
    private double maxLat;
    private double minLon;
    private double maxLon;
    
    public BoundingBox() {
    }
    
    public BoundingBox(double minLat, double maxLat, double minLon, double maxLon) {
        this.minLat = minLat;
        this.maxLat = maxLat;
        this.minLon = minLon;
        this.maxLon = maxLon;
    }
    
    // Getters and Setters
    public double getMinLat() {
        return minLat;
    }
    
    public void setMinLat(double minLat) {
        this.minLat = minLat;
    }
    
    public double getMaxLat() {
        return maxLat;
    }
    
    public void setMaxLat(double maxLat) {
        this.maxLat = maxLat;
    }
    
    public double getMinLon() {
        return minLon;
    }
    
    public void setMinLon(double minLon) {
        this.minLon = minLon;
    }
    
    public double getMaxLon() {
        return maxLon;
    }
    
    public void setMaxLon(double maxLon) {
        this.maxLon = maxLon;
    }
    
    // Utility methods
    public double getCenterLat() {
        return (minLat + maxLat) / 2.0;
    }
    
    public double getCenterLon() {
        return (minLon + maxLon) / 2.0;
    }
    
    public double getWidth() {
        return maxLon - minLon;
    }
    
    public double getHeight() {
        return maxLat - minLat;
    }
    
    @Override
    public String toString() {
        return String.format("BoundingBox[lat: %.4f to %.4f, lon: %.4f to %.4f]",
                           minLat, maxLat, minLon, maxLon);
    }
}

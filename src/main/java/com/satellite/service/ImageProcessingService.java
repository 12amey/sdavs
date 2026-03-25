package com.satellite.service;

import org.imgscalr.Scalr;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.*;
import java.util.List;

/**
 * Real Image Processing Service for Satellite Imagery
 * Provides NDVI calculation, band extraction, classification, and analysis
 */
@Service
public class ImageProcessingService {

    /**
     * Process satellite image and extract NDVI values
     * NDVI = (NIR - Red) / (NIR + Red)
     */
    public Map<String, Object> processImage(MultipartFile file) throws IOException {
        BufferedImage image = ImageIO.read(file.getInputStream());
        
        if (image == null) {
            throw new IOException("Unable to read image file");
        }

        Map<String, Object> result = new HashMap<>();
        result.put("width", image.getWidth());
        result.put("height", image.getHeight());
        result.put("format", file.getContentType());
        result.put("size", file.getSize());
        
        // Extract RGB bands
        double[][] redBand = extractBand(image, 0);  // Red channel
        double[][] greenBand = extractBand(image, 1); // Green channel
        double[][] blueBand = extractBand(image, 2);  // Blue channel
        
        // Simulate NIR band (Near-Infrared) - in real satellite imagery this would be a separate band
        // For RGB images, we approximate NIR using green channel with adjustments
        double[][] nirBand = simulateNIRBand(image, greenBand);
        
        // Calculate NDVI
        double[][] ndviMatrix = calculateNDVI(nirBand, redBand);
        
        // Calculate statistics
        Map<String, Double> ndviStats = calculateStatistics(ndviMatrix);
        result.put("ndviStats", ndviStats);
        
        // Classify vegetation
        Map<String, Object> classification = classifyVegetation(ndviMatrix);
        result.put("classification", classification);
        
        // Detect anomalies
        List<Map<String, Object>> anomalies = detectAnomalies(ndviMatrix);
        result.put("anomalies", anomalies);
        
        // Generate heatmap data
        List<List<Double>> heatmapData = generateHeatmapData(ndviMatrix);
        result.put("heatmap", heatmapData);
        
        result.put("timestamp", System.currentTimeMillis());
        result.put("processed", true);
        
        return result;
    }

    /**
     * Extract a specific color band from the image
     */
    private double[][] extractBand(BufferedImage image, int band) {
        int width = image.getWidth();
        int height = image.getHeight();
        double[][] bandData = new double[height][width];
        
        for (int y = 0; y < height; y++) {
            for (int x = 0; x < width; x++) {
                int rgb = image.getRGB(x, y);
                int value;
                
                switch (band) {
                    case 0: // Red
                        value = (rgb >> 16) & 0xFF;
                        break;
                    case 1: // Green
                        value = (rgb >> 8) & 0xFF;
                        break;
                    case 2: // Blue
                        value = rgb & 0xFF;
                        break;
                    default:
                        value = 0;
                }
                
                // Normalize to 0-1 range
                bandData[y][x] = value / 255.0;
            }
        }
        
        return bandData;
    }

    /**
     * Simulate NIR band from RGB image
     * This is an approximation - real satellite imagery has separate NIR bands
     */
    private double[][] simulateNIRBand(BufferedImage image, double[][] greenBand) {
        int width = image.getWidth();
        int height = image.getHeight();
        double[][] nirBand = new double[height][width];
        
        for (int y = 0; y < height; y++) {
            for (int x = 0; x < width; x++) {
                int rgb = image.getRGB(x, y);
                int red = (rgb >> 16) & 0xFF;
                int green = (rgb >> 8) & 0xFF;
                
                // Approximate NIR: vegetation reflects more in NIR than red
                // Healthy vegetation: high NIR, low red
                double approximateNIR = (green / 255.0) * 1.5 - (red / 255.0) * 0.3;
                approximateNIR = Math.max(0.0, Math.min(1.0, approximateNIR));
                
                nirBand[y][x] = approximateNIR;
            }
        }
        
        return nirBand;
    }

    /**
     * Calculate NDVI from NIR and Red bands
     * NDVI = (NIR - Red) / (NIR + Red)
     * Range: -1 to 1 (higher values = healthier vegetation)
     */
    private double[][] calculateNDVI(double[][] nirBand, double[][] redBand) {
        int height = nirBand.length;
        int width = nirBand[0].length;
        double[][] ndvi = new double[height][width];
        
        for (int y = 0; y < height; y++) {
            for (int x = 0; x < width; x++) {
                double nir = nirBand[y][x];
                double red = redBand[y][x];
                
                double denominator = nir + red;
                if (denominator == 0) {
                    ndvi[y][x] = 0;
                } else {
                    ndvi[y][x] = (nir - red) / denominator;
                }
                
                // Clamp to valid range
                ndvi[y][x] = Math.max(-1.0, Math.min(1.0, ndvi[y][x]));
            }
        }
        
        return ndvi;
    }

    /**
     * Calculate statistics from NDVI matrix
     */
    private Map<String, Double> calculateStatistics(double[][] ndvi) {
        int height = ndvi.length;
        int width = ndvi[0].length;
        int totalPixels = height * width;
        
        double sum = 0;
        double min = Double.MAX_VALUE;
        double max = Double.MIN_VALUE;
        
        List<Double> values = new ArrayList<>();
        
        for (int y = 0; y < height; y++) {
            for (int x = 0; x < width; x++) {
                double value = ndvi[y][x];
                sum += value;
                min = Math.min(min, value);
                max = Math.max(max, value);
                values.add(value);
            }
        }
        
        double mean = sum / totalPixels;
        
        // Calculate standard deviation
        double varianceSum = 0;
        for (double value : values) {
            varianceSum += Math.pow(value - mean, 2);
        }
        double stdDev = Math.sqrt(varianceSum / totalPixels);
        
        // Calculate median
        Collections.sort(values);
        double median = values.get(totalPixels / 2);
        
        Map<String, Double> stats = new HashMap<>();
        stats.put("mean", mean);
        stats.put("median", median);
        stats.put("min", min);
        stats.put("max", max);
        stats.put("stdDev", stdDev);
        
        return stats;
    }

    /**
     * Classify vegetation based on NDVI values
     */
    private Map<String, Object> classifyVegetation(double[][] ndvi) {
        int height = ndvi.length;
        int width = ndvi[0].length;
        int totalPixels = height * width;
        
        int water = 0;
        int urban = 0;
        int bareSoil = 0;
        int sparseVegetation = 0;
        int moderateVegetation = 0;
        int denseVegetation = 0;
        
        for (int y = 0; y < height; y++) {
            for (int x = 0; x < width; x++) {
                double value = ndvi[y][x];
                
                if (value < -0.1) {
                    water++;
                } else if (value < 0.1) {
                    urban++;
                } else if (value < 0.2) {
                    bareSoil++;
                } else if (value < 0.4) {
                    sparseVegetation++;
                } else if (value < 0.6) {
                    moderateVegetation++;
                } else {
                    denseVegetation++;
                }
            }
        }
        
        Map<String, Object> classification = new HashMap<>();
        Map<String, Double> percentages = new HashMap<>();
        
        percentages.put("water", (water * 100.0) / totalPixels);
        percentages.put("urban", (urban * 100.0) / totalPixels);
        percentages.put("bareSoil", (bareSoil * 100.0) / totalPixels);
        percentages.put("sparseVegetation", (sparseVegetation * 100.0) / totalPixels);
        percentages.put("moderateVegetation", (moderateVegetation * 100.0) / totalPixels);
        percentages.put("denseVegetation", (denseVegetation * 100.0) / totalPixels);
        
        classification.put("percentages", percentages);
        classification.put("totalPixels", totalPixels);
        
        // Determine dominant class
        String dominantClass = percentages.entrySet().stream()
            .max(Map.Entry.comparingByValue())
            .map(Map.Entry::getKey)
            .orElse("unknown");
        
        classification.put("dominantClass", dominantClass);
        
        return classification;
    }

    /**
     * Detect anomalies in NDVI data
     */
    private List<Map<String, Object>> detectAnomalies(double[][] ndvi) {
        List<Map<String, Object>> anomalies = new ArrayList<>();
        int height = ndvi.length;
        int width = ndvi[0].length;
        
        // Calculate mean and std dev for threshold
        double sum = 0;
        int count = 0;
        for (int y = 0; y < height; y++) {
            for (int x = 0; x < width; x++) {
                sum += ndvi[y][x];
                count++;
            }
        }
        double mean = sum / count;
        
        double varianceSum = 0;
        for (int y = 0; y < height; y++) {
            for (int x = 0; x < width; x++) {
                varianceSum += Math.pow(ndvi[y][x] - mean, 2);
            }
        }
        double stdDev = Math.sqrt(varianceSum / count);
        
        // Detect outliers (more than 2 std devs from mean)
        double threshold = stdDev * 2;
        
        for (int y = 0; y < height; y += 10) { // Sample every 10 pixels
            for (int x = 0; x < width; x += 10) {
                double value = ndvi[y][x];
                double deviation = Math.abs(value - mean);
                
                if (deviation > threshold) {
                    Map<String, Object> anomaly = new HashMap<>();
                    anomaly.put("x", x);
                    anomaly.put("y", y);
                    anomaly.put("value", value);
                    anomaly.put("deviation", deviation);
                    anomaly.put("type", value < mean ? "unhealthy" : "exceptional");
                    anomalies.add(anomaly);
                }
            }
        }
        
        return anomalies;
    }

    /**
     * Generate heatmap data for visualization
     */
    private List<List<Double>> generateHeatmapData(double[][] ndvi) {
        int height = ndvi.length;
        int width = ndvi[0].length;
        
        // Downsample for performance (max 50x50 grid)
        int maxDimension = 50;
        int stepY = Math.max(1, height / maxDimension);
        int stepX = Math.max(1, width / maxDimension);
        
        List<List<Double>> heatmap = new ArrayList<>();
        
        for (int y = 0; y < height; y += stepY) {
            List<Double> row = new ArrayList<>();
            for (int x = 0; x < width; x += stepX) {
                row.add(ndvi[y][x]);
            }
            heatmap.add(row);
        }
        
        return heatmap;
    }

    /**
     * Apply filters to satellite image
     */
    public byte[] applyFilter(MultipartFile file, String filterType) throws IOException {
        BufferedImage image = ImageIO.read(file.getInputStream());
        
        if (image == null) {
            throw new IOException("Unable to read image file");
        }

        BufferedImage filtered;
        
        switch (filterType.toLowerCase()) {
            case "grayscale":
                filtered = convertToGrayscale(image);
                break;
            case "sharpen":
                filtered = sharpenImage(image);
                break;
            case "blur":
                filtered = blurImage(image);
                break;
            case "enhance":
                filtered = enhanceContrast(image);
                break;
            case "edge":
                filtered = detectEdges(image);
                break;
            default:
                filtered = image;
        }
        
        // Convert to byte array
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(filtered, "png", baos);
        return baos.toByteArray();
    }

    private BufferedImage convertToGrayscale(BufferedImage image) {
        BufferedImage gray = new BufferedImage(
            image.getWidth(), image.getHeight(), BufferedImage.TYPE_BYTE_GRAY
        );
        Graphics2D g = gray.createGraphics();
        g.drawImage(image, 0, 0, null);
        g.dispose();
        return gray;
    }

    private BufferedImage sharpenImage(BufferedImage image) {
        return Scalr.apply(image, Scalr.OP_ANTIALIAS);
    }

    private BufferedImage blurImage(BufferedImage image) {
        int width = image.getWidth();
        int height = image.getHeight();
        BufferedImage blurred = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        
        int kernelSize = 5;
        int offset = kernelSize / 2;
        
        for (int y = offset; y < height - offset; y++) {
            for (int x = offset; x < width - offset; x++) {
                int r = 0, g = 0, b = 0, count = 0;
                
                for (int ky = -offset; ky <= offset; ky++) {
                    for (int kx = -offset; kx <= offset; kx++) {
                        int rgb = image.getRGB(x + kx, y + ky);
                        r += (rgb >> 16) & 0xFF;
                        g += (rgb >> 8) & 0xFF;
                        b += rgb & 0xFF;
                        count++;
                    }
                }
                
                r /= count;
                g /= count;
                b /= count;
                
                int newRgb = (r << 16) | (g << 8) | b;
                blurred.setRGB(x, y, newRgb);
            }
        }
        
        return blurred;
    }

    private BufferedImage enhanceContrast(BufferedImage image) {
        int width = image.getWidth();
        int height = image.getHeight();
        BufferedImage enhanced = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        
        double contrast = 1.5;
        
        for (int y = 0; y < height; y++) {
            for (int x = 0; x < width; x++) {
                int rgb = image.getRGB(x, y);
                int r = (rgb >> 16) & 0xFF;
                int g = (rgb >> 8) & 0xFF;
                int b = rgb & 0xFF;
                
                r = (int) Math.min(255, Math.max(0, ((r - 128) * contrast) + 128));
                g = (int) Math.min(255, Math.max(0, ((g - 128) * contrast) + 128));
                b = (int) Math.min(255, Math.max(0, ((b - 128) * contrast) + 128));
                
                int newRgb = (r << 16) | (g << 8) | b;
                enhanced.setRGB(x, y, newRgb);
            }
        }
        
        return enhanced;
    }

    private BufferedImage detectEdges(BufferedImage image) {
        int width = image.getWidth();
        int height = image.getHeight();
        BufferedImage edges = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        
        // Sobel operator
        int[][] sobelX = {{-1, 0, 1}, {-2, 0, 2}, {-1, 0, 1}};
        int[][] sobelY = {{-1, -2, -1}, {0, 0, 0}, {1, 2, 1}};
        
        for (int y = 1; y < height - 1; y++) {
            for (int x = 1; x < width - 1; x++) {
                int gx = 0, gy = 0;
                
                for (int ky = -1; ky <= 1; ky++) {
                    for (int kx = -1; kx <= 1; kx++) {
                        int rgb = image.getRGB(x + kx, y + ky);
                        int gray = ((rgb >> 16) & 0xFF + (rgb >> 8) & 0xFF + (rgb & 0xFF)) / 3;
                        
                        gx += gray * sobelX[ky + 1][kx + 1];
                        gy += gray * sobelY[ky + 1][kx + 1];
                    }
                }
                
                int magnitude = (int) Math.sqrt(gx * gx + gy * gy);
                magnitude = Math.min(255, magnitude);
                
                int edgeRgb = (magnitude << 16) | (magnitude << 8) | magnitude;
                edges.setRGB(x, y, edgeRgb);
            }
        }
        
        return edges;
    }

    /**
     * Resize image for processing
     */
    public byte[] resizeImage(MultipartFile file, int targetWidth, int targetHeight) throws IOException {
        BufferedImage image = ImageIO.read(file.getInputStream());
        
        if (image == null) {
            throw new IOException("Unable to read image file");
        }

        BufferedImage resized = Scalr.resize(
            image,
            Scalr.Method.QUALITY,
            Scalr.Mode.FIT_EXACT,
            targetWidth,
            targetHeight
        );
        
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(resized, "png", baos);
        return baos.toByteArray();
    }
}

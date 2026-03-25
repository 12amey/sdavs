package com.satellite.sentinel;

/**
 * Simplified MGRS tile finder for Sentinel-2
 * Uses direct UTM zone calculation instead of full MGRS library
 */
public class TileUtils {

    public static String latLonToTile(double lat, double lon) {
        // Direct Sentinel-2 tile ID calculation
        // Format: {UTM}{LATBAND}{100km-grid}
        
        String utm = String.format("%02d", getUTMZone(lon));
        String latBand = getLatitudeBand(lat);
        String grid = getGridSquare(lat, lon);
        
        return utm + latBand + grid;
    }

    private static int getUTMZone(double lon) {
        // Standard UTM zone calculation
        return (int) Math.floor((lon + 180) / 6) + 1;
    }

    private static String getLatitudeBand(double lat) {
        // MGRS latitude bands (C-X, excluding I and O)
        String[] bands = {"C", "D", "E", "F", "G", "H", "J", "K", "L", "M", 
                         "N", "P", "Q", "R", "S", "T", "U", "V", "W", "X"};
        int index = (int) Math.floor((lat + 80) / 8);
        if (index < 0) index = 0;
        if (index >= bands.length) index = bands.length - 1;
        return bands[index];
    }

    private static String getGridSquare(double lat, double lon) {
        // Simplified 100km grid square calculation
        // This is an approximation - for production, use actual MGRS library
        int utmZone = getUTMZone(lon);
        double centralMeridian = (utmZone - 1) * 6 - 180 + 3;
        
        // Easting/Northing approximation
        double easting = (lon - centralMeridian) * 111320 * Math.cos(Math.toRadians(lat));
        double northing = lat * 110540;
        
        // Convert to 100km grid
        int eastGrid = ((int) Math.abs(easting / 100000)) % 8;
        int northGrid = ((int) Math.abs(northing / 100000)) % 20;
        
        // MGRS grid letters (simplified)
        String eastLetters = "ABCDEFGH";
        String northLetters = "ABCDEFGHJKLMNPQRSTUV";
        
        char eastLetter = eastLetters.charAt(eastGrid);
        char northLetter = northLetters.charAt(northGrid);
        
        return "" + eastLetter + northLetter;
    }

    public static String utmZone(String tile) {
        return tile.substring(0, 2);
    }

    public static String latBand(String tile) {
        return tile.substring(2, 3);
    }

    public static String grid(String tile) {
        return tile.substring(3, 5);
    }
}

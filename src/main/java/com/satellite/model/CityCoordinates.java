package com.satellite.model;

public enum CityCoordinates {
    DELHI("Delhi", "NCR", 28.6139, 77.2090),
    MUMBAI("Mumbai", "Maharashtra", 19.0760, 72.8777),
    BANGALORE("Bangalore", "Karnataka", 12.9716, 77.5946),
    CHENNAI("Chennai", "Tamil Nadu", 13.0827, 80.2707),
    KOLKATA("Kolkata", "West Bengal", 22.5726, 88.3639),
    HYDERABAD("Hyderabad", "Telangana", 17.3850, 78.4867),
    PUNE("Pune", "Maharashtra", 18.5204, 73.8567),
    AHMEDABAD("Ahmedabad", "Gujarat", 23.0225, 72.5714),
    JAIPUR("Jaipur", "Rajasthan", 26.9124, 75.7873),
    LUCKNOW("Lucknow", "Uttar Pradesh", 26.8467, 80.9462),
    NOIDA("Noida", "Uttar Pradesh", 28.5355, 77.3910),
    JAYSINGPUR("Jaysingpur", "Kolhapur", 16.7667, 74.5500),
    SANGLI("Sangli", "Maharashtra", 16.8524, 74.5815),
    SHIROL("Shirol", "Kolhapur", 16.7182, 74.4580),
    KOLHAPUR("Kolhapur", "Maharashtra", 16.7050, 74.2433),
    SATARA("Satara", "Maharashtra", 17.6805, 73.9915),
    NOIDA_EXT("Noida Extension", "NCR", 28.5900, 77.4500),
    GURUGRAM("Gurugram", "NCR", 28.4595, 77.0266),
    
    // Central
    NAGPUR("Nagpur", "Maharashtra", 21.1458, 79.0882),
    BHOPAL("Bhopal", "Madhya Pradesh", 23.2599, 77.4126),
    INDORE("Indore", "Madhya Pradesh", 22.7196, 75.8577),
    
    // Northeast
    GUWAHATI("Guwahati", "Assam", 26.1445, 91.7362),
    SHILLONG("Shillong", "Meghalaya", 25.5788, 91.8833),
    
    // Special
    SUNDARBANS("Sundarbans", "West Bengal", 21.9497, 88.9100),
    KAZIRANGA("Kaziranga", "Assam", 26.5775, 93.1711);

    private final String cityName;
    private final String region;
    private final double latitude;
    private final double longitude;

    CityCoordinates(String cityName, String region, double latitude, double longitude) {
        this.cityName = cityName;
        this.region = region;
        this.latitude = latitude;
        this.longitude = longitude;
    }

    public String getCityName() {
        return cityName;
    }

    public String getRegion() {
        return region;
    }

    public double getLatitude() {
        return latitude;
    }

    public double getLongitude() {
        return longitude;
    }

    // Bounding box for STAC API query (approx 0.1 degree buffer)
    public double[] getBoundingBox() {
        return new double[]{
            longitude - 0.1,
            latitude - 0.1,
            longitude + 0.1,
            latitude + 0.1
        };
    }
}

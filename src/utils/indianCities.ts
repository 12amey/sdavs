export interface City {
    name: string;
    lat: number;
    lon: number;
    state: string;
    region: 'North' | 'South' | 'West' | 'East' | 'Central' | 'Northeast' | 'Special';
    area?: string;
    displayName?: string;
}

function makeCity(name: string, lat: number, lon: number, state: string, region: City['region'], area?: string): City {
    return {
        name,
        lat,
        lon,
        state,
        region,
        area,
        displayName: area ? `${name} (${area})` : name
    };
}

export const INDIAN_CITIES: City[] = [
    // Mumbai and sub-areas (West)
    makeCity('Mumbai', 19.0760, 72.8777, 'Maharashtra', 'West', 'Colaba'),
    makeCity('Mumbai', 19.0596, 72.8295, 'Maharashtra', 'West', 'Worli'),
    makeCity('Mumbai', 19.1136, 72.8697, 'Maharashtra', 'West', 'Dadar'),
    makeCity('Mumbai', 19.1197, 72.9051, 'Maharashtra', 'West', 'Kurla'),
    makeCity('Mumbai', 19.1726, 72.9534, 'Maharashtra', 'West', 'Ghatkopar'),
    makeCity('Mumbai', 19.1840, 72.8412, 'Maharashtra', 'West', 'Andheri'),
    makeCity('Mumbai', 19.2284, 72.8579, 'Maharashtra', 'West', 'Goregaon'),
    makeCity('Mumbai', 19.2500, 72.8548, 'Maharashtra', 'West', 'Malad'),
    makeCity('Mumbai', 19.2813, 72.8488, 'Maharashtra', 'West', 'Kandivali'),
    makeCity('Mumbai', 19.3183, 72.8488, 'Maharashtra', 'West', 'Borivali'),
    makeCity('Mumbai', 19.3636, 72.8197, 'Maharashtra', 'West', 'Dahisar'),
    makeCity('Mumbai', 19.3919, 72.8397, 'Maharashtra', 'West', 'Vasai'),
    makeCity('Mumbai', 19.4562, 72.8101, 'Maharashtra', 'West', 'Virar'),
    makeCity('Mumbai', 19.2950, 72.8544, 'Maharashtra', 'West', 'Mira Road'),
    makeCity('Mumbai', 19.3259, 72.8600, 'Maharashtra', 'West', 'Bhayandar'),
    makeCity('Mumbai', 19.1503, 72.8601, 'Maharashtra', 'West', 'Bandra'),
    makeCity('Mumbai', 19.1724, 72.8402, 'Maharashtra', 'West', 'Santacruz'),
    makeCity('Mumbai', 19.0912, 72.8727, 'Maharashtra', 'West', 'Sion'),
    makeCity('Mumbai', 19.2000, 72.9700, 'Maharashtra', 'West', 'Powai'),
    makeCity('Mumbai', 19.1080, 72.8360, 'Maharashtra', 'West', 'Mahim'),
    makeCity('Mumbai', 19.0178, 72.8478, 'Maharashtra', 'West', 'Cuffe Parade'),
    makeCity('Mumbai', 18.9750, 72.8258, 'Maharashtra', 'West', 'Churchgate'),
    makeCity('Mumbai', 18.9640, 72.8293, 'Maharashtra', 'West', 'Nariman Point'),

    // Delhi and sub-areas (North)
    makeCity('Delhi', 28.7041, 77.1025, 'Delhi', 'North', 'Central Delhi'),
    makeCity('Delhi', 28.6448, 77.2167, 'Delhi', 'North', 'New Delhi'),
    makeCity('Delhi', 28.7495, 77.1196, 'Delhi', 'North', 'North Delhi'),
    makeCity('Delhi', 28.5706, 77.3260, 'Delhi', 'North', 'East Delhi'),
    makeCity('Delhi', 28.5672, 77.0900, 'Delhi', 'North', 'South Delhi'),
    makeCity('Delhi', 28.6800, 77.0800, 'Delhi', 'North', 'West Delhi'),
    makeCity('Delhi', 28.6800, 77.0800, 'Delhi', 'North', 'Old Delhi'),
    makeCity('Delhi', 28.6238, 77.2090, 'Delhi', 'North', 'Connaught Place'),
    makeCity('Delhi', 28.5355, 77.3910, 'Delhi', 'North', 'Noida Border'),
    makeCity('Delhi', 28.5197, 77.3910, 'Delhi', 'North', 'Sahibabad'),
    makeCity('Delhi', 28.5672, 77.2130, 'Delhi', 'North', 'Lajpat Nagar'),
    makeCity('Delhi', 28.7041, 77.2600, 'Delhi', 'North', 'Yamuna Vihar'),

    // Bangalore and sub-areas (South)
    makeCity('Bangalore', 12.9716, 77.5946, 'Karnataka', 'South', 'MG Road'),
    makeCity('Bangalore', 13.0299, 77.5550, 'Karnataka', 'South', 'Malleshwaram'),
    makeCity('Bangalore', 12.9352, 77.6245, 'Karnataka', 'South', 'Koramangala'),
    makeCity('Bangalore', 12.9279, 77.6271, 'Karnataka', 'South', 'HSR Layout'),
    makeCity('Bangalore', 12.9081, 77.6476, 'Karnataka', 'South', 'Electronic City'),
    makeCity('Bangalore', 13.0140, 77.6602, 'Karnataka', 'South', 'Whitefield'),
    makeCity('Bangalore', 13.0100, 77.5500, 'Karnataka', 'South', 'Rajajinagar'),
    makeCity('Bangalore', 12.9784, 77.7280, 'Karnataka', 'South', 'Marathahalli'),
    makeCity('Bangalore', 13.0591, 77.6440, 'Karnataka', 'South', 'Hebbal'),
    makeCity('Bangalore', 12.9343, 77.5352, 'Karnataka', 'South', 'Jayanagar'),
    makeCity('Bangalore', 13.0732, 77.5785, 'Karnataka', 'South', 'Yelahanka'),

    // Pune and sub-areas (West)
    makeCity('Pune', 18.5204, 73.8567, 'Maharashtra', 'West', 'Shivajinagar'),
    makeCity('Pune', 18.5596, 73.8169, 'Maharashtra', 'West', 'Aundh'),
    makeCity('Pune', 18.5431, 73.8862, 'Maharashtra', 'West', 'Hadapsar'),
    makeCity('Pune', 18.4898, 73.9273, 'Maharashtra', 'West', 'Kharadi'),
    makeCity('Pune', 18.6150, 73.7389, 'Maharashtra', 'West', 'Hinjewadi'),
    makeCity('Pune', 18.4655, 73.8596, 'Maharashtra', 'West', 'Bibwewadi'),
    makeCity('Pune', 18.5333, 73.8667, 'Maharashtra', 'West', 'Kothrud'),
    makeCity('Pune', 18.5793, 73.9080, 'Maharashtra', 'West', 'Viman Nagar'),
    makeCity('Pune', 18.6047, 73.9100, 'Maharashtra', 'West', 'Wagholi'),
    makeCity('Pune', 18.5195, 73.7850, 'Maharashtra', 'West', 'Wakad'),
    makeCity('Pune', 18.5791, 73.7712, 'Maharashtra', 'West', 'Pimpri'),
    makeCity('Pune', 18.6186, 73.8037, 'Maharashtra', 'West', 'Chinchwad'),

    // Hyderabad and sub-areas (South)
    makeCity('Hyderabad', 17.3850, 78.4867, 'Telangana', 'South', 'Charminar'),
    makeCity('Hyderabad', 17.4126, 78.4671, 'Telangana', 'South', 'Banjara Hills'),
    makeCity('Hyderabad', 17.4325, 78.4682, 'Telangana', 'South', 'Jubilee Hills'),
    makeCity('Hyderabad', 17.4900, 78.3600, 'Telangana', 'South', 'Kukatpally'),
    makeCity('Hyderabad', 17.3916, 78.3900, 'Telangana', 'South', 'Madhapur'),
    makeCity('Hyderabad', 17.4416, 78.3810, 'Telangana', 'South', 'Kondapur'),
    makeCity('Hyderabad', 17.4848, 78.5700, 'Telangana', 'South', 'Uppal'),
    makeCity('Hyderabad', 17.3600, 78.4780, 'Telangana', 'South', 'Falaknuma'),
    makeCity('Hyderabad', 17.5050, 78.5180, 'Telangana', 'South', 'ECIL'),

    // Chennai and sub-areas (South)
    makeCity('Chennai', 13.0827, 80.2707, 'Tamil Nadu', 'South', 'Anna Salai'),
    makeCity('Chennai', 13.0119, 80.2320, 'Tamil Nadu', 'South', 'Adyar'),
    makeCity('Chennai', 13.1186, 80.1509, 'Tamil Nadu', 'South', 'Ambattur'),
    makeCity('Chennai', 13.0674, 80.2076, 'Tamil Nadu', 'South', 'T Nagar'),
    makeCity('Chennai', 13.1525, 80.2818, 'Tamil Nadu', 'South', 'Perambur'),
    makeCity('Chennai', 12.9165, 80.2325, 'Tamil Nadu', 'South', 'Velachery'),
    makeCity('Chennai', 12.9279, 80.1449, 'Tamil Nadu', 'South', 'Tambaram'),
    makeCity('Chennai', 13.0827, 80.3000, 'Tamil Nadu', 'South', 'Sholinganallur'),

    // Kolkata and sub-areas (East)
    makeCity('Kolkata', 22.5726, 88.3639, 'West Bengal', 'East', 'Park Street'),
    makeCity('Kolkata', 22.6241, 88.4040, 'West Bengal', 'East', 'Dum Dum'),
    makeCity('Kolkata', 22.5550, 88.4215, 'West Bengal', 'East', 'Salt Lake'),
    makeCity('Kolkata', 22.5958, 88.2636, 'West Bengal', 'East', 'Howrah'),
    makeCity('Kolkata', 22.4800, 88.3300, 'West Bengal', 'East', 'New Alipore'),
    makeCity('Kolkata', 22.5270, 88.3900, 'West Bengal', 'East', 'Tollygunge'),
    makeCity('Kolkata', 22.6449, 88.4453, 'West Bengal', 'East', 'Rajarhat'),
    makeCity('Kolkata', 22.5092, 88.3900, 'West Bengal', 'East', 'Jadavpur'),

    // Ahmedabad and sub-areas (West)
    makeCity('Ahmedabad', 23.0225, 72.5714, 'Gujarat', 'West', 'Relief Road'),
    makeCity('Ahmedabad', 23.0600, 72.5800, 'Gujarat', 'West', 'Chandkheda'),
    makeCity('Ahmedabad', 23.0470, 72.5050, 'Gujarat', 'West', 'Satellite'),
    makeCity('Ahmedabad', 22.9950, 72.5900, 'Gujarat', 'West', 'Maninagar'),
    makeCity('Ahmedabad', 23.0400, 72.5300, 'Gujarat', 'West', 'Vastrapur'),
    makeCity('Ahmedabad', 23.0800, 72.6000, 'Gujarat', 'West', 'Naroda'),

    // Thane and sub-areas (West)
    makeCity('Thane', 19.2183, 72.9781, 'Maharashtra', 'West', 'Thane West'),
    makeCity('Thane', 19.2438, 72.9985, 'Maharashtra', 'West', 'Thane East'),
    makeCity('Thane', 19.2083, 73.0700, 'Maharashtra', 'West', 'Dombivli'),
    makeCity('Thane', 19.2302, 73.1213, 'Maharashtra', 'West', 'Kalyan'),
    makeCity('Thane', 19.1710, 73.0858, 'Maharashtra', 'West', 'Ambernath'),
    makeCity('Thane', 19.1961, 73.1648, 'Maharashtra', 'West', 'Badlapur'),
    makeCity('Thane', 19.2400, 72.9600, 'Maharashtra', 'West', 'Ghodbunder'),

    // Navi Mumbai and sub-areas (West)
    makeCity('Navi Mumbai', 19.0330, 73.0297, 'Maharashtra', 'West', 'Vashi'),
    makeCity('Navi Mumbai', 19.0596, 73.0598, 'Maharashtra', 'West', 'Airoli'),
    makeCity('Navi Mumbai', 19.0206, 73.0176, 'Maharashtra', 'West', 'Nerul'),
    makeCity('Navi Mumbai', 18.9930, 73.0268, 'Maharashtra', 'West', 'Belapur'),
    makeCity('Navi Mumbai', 18.9700, 73.0050, 'Maharashtra', 'West', 'Kharghar'),
    makeCity('Navi Mumbai', 18.9100, 73.0800, 'Maharashtra', 'West', 'Panvel'),
    makeCity('Navi Mumbai', 19.0700, 73.0200, 'Maharashtra', 'West', 'Ghansoli'),
    makeCity('Navi Mumbai', 19.0400, 73.0600, 'Maharashtra', 'West', 'Kopar Khairane'),

    // Nagpur (West/Central)
    makeCity('Nagpur', 21.1458, 79.0882, 'Maharashtra', 'Central', 'Civil Lines'),
    makeCity('Nagpur', 21.1800, 79.0550, 'Maharashtra', 'Central', 'Dharampeth'),

    // North cities
    makeCity('Jaipur', 26.9124, 75.7873, 'Rajasthan', 'North', 'Pink City'),
    makeCity('Lucknow', 26.8467, 80.9462, 'Uttar Pradesh', 'North', 'Hazratganj'),
    makeCity('Noida', 28.5355, 77.3910, 'Uttar Pradesh', 'North', 'Sector 18'),
    makeCity('Gurgaon', 28.4595, 77.0266, 'Haryana', 'North', 'DLF City'),
    makeCity('Srinagar', 34.0837, 74.7973, 'Jammu and Kashmir', 'North', 'Dal Lake'),
    makeCity('Amritsar', 31.6340, 74.8723, 'Punjab', 'North', 'Golden Temple Area'),

    // Others
    makeCity('Guwahati', 26.1445, 91.7362, 'Assam', 'Northeast', 'Paltan Bazar'),
    makeCity('Kaziranga', 26.5775, 93.1711, 'Assam', 'Northeast', 'National Park'),
    makeCity('Sundarbans', 21.9497, 88.9100, 'West Bengal', 'Special', 'Mangrove Reserve'),
    makeCity('Western Ghats', 15.5000, 74.0000, 'Karnataka', 'Special', 'Coorg Forest'),
    makeCity('Thar Desert', 27.0000, 71.0000, 'Rajasthan', 'Special', 'Jaisalmer Region'),
].sort((a, b) => a.name.localeCompare(b.name));

/**
 * Get the nearest city/area to a coordinate with a specific radius check.
 * Returns the displayName (e.g., "Mumbai (Vasai)") of the nearest location.
 */
export const getNearestAreaName = (lat: number, lon: number): string => {
    let nearest = INDIAN_CITIES[0];
    let minDistance = Infinity;

    INDIAN_CITIES.forEach(city => {
        const distance = Math.sqrt(Math.pow(city.lat - lat, 2) + Math.pow(city.lon - lon, 2));
        if (distance < minDistance) {
            minDistance = distance;
            nearest = city;
        }
    });

    // If within roughly 30km (0.27 degrees), use the specific area name
    if (minDistance < 0.27) {
        return nearest.displayName || nearest.name;
    }

    // If farther, just use the city name
    return nearest.name;
};

/**
 * Get cities within a bounding box - useful for finding what areas are covered
 */
export const getCitiesInBounds = (
    minLat: number, maxLat: number, minLon: number, maxLon: number
): City[] => {
    return INDIAN_CITIES.filter(city =>
        city.lat >= minLat && city.lat <= maxLat &&
        city.lon >= minLon && city.lon <= maxLon
    );
};

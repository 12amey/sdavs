export interface City {
    name: string;
    lat: number;
    lon: number;
    state: string;
    area?: string; // Sub-area/district name
    displayName?: string; // Full display name like "Mumbai (Vasai)"
}

// Helper to create the displayName automatically
function makeCity(name: string, lat: number, lon: number, state: string, area?: string): City {
    return {
        name,
        lat,
        lon,
        state,
        area,
        displayName: area ? `${name} (${area})` : name
    };
}

export const INDIAN_CITIES: City[] = [
    // Mumbai and sub-areas
    makeCity('Mumbai', 19.0760, 72.8777, 'Maharashtra', 'Colaba'),
    makeCity('Mumbai', 19.0596, 72.8295, 'Maharashtra', 'Worli'),
    makeCity('Mumbai', 19.1136, 72.8697, 'Maharashtra', 'Dadar'),
    makeCity('Mumbai', 19.1197, 72.9051, 'Maharashtra', 'Kurla'),
    makeCity('Mumbai', 19.1726, 72.9534, 'Maharashtra', 'Ghatkopar'),
    makeCity('Mumbai', 19.1840, 72.8412, 'Maharashtra', 'Andheri'),
    makeCity('Mumbai', 19.2284, 72.8579, 'Maharashtra', 'Goregaon'),
    makeCity('Mumbai', 19.2500, 72.8548, 'Maharashtra', 'Malad'),
    makeCity('Mumbai', 19.2813, 72.8488, 'Maharashtra', 'Kandivali'),
    makeCity('Mumbai', 19.3183, 72.8488, 'Maharashtra', 'Borivali'),
    makeCity('Mumbai', 19.3636, 72.8197, 'Maharashtra', 'Dahisar'),
    makeCity('Mumbai', 19.3919, 72.8397, 'Maharashtra', 'Vasai'),
    makeCity('Mumbai', 19.4562, 72.8101, 'Maharashtra', 'Virar'),
    makeCity('Mumbai', 19.2950, 72.8544, 'Maharashtra', 'Mira Road'),
    makeCity('Mumbai', 19.3259, 72.8600, 'Maharashtra', 'Bhayandar'),
    makeCity('Mumbai', 19.1503, 72.8601, 'Maharashtra', 'Bandra'),
    makeCity('Mumbai', 19.1724, 72.8402, 'Maharashtra', 'Santacruz'),
    makeCity('Mumbai', 19.0912, 72.8727, 'Maharashtra', 'Sion'),
    makeCity('Mumbai', 19.2000, 72.9700, 'Maharashtra', 'Powai'),
    makeCity('Mumbai', 19.1080, 72.8360, 'Maharashtra', 'Mahim'),
    makeCity('Mumbai', 19.0178, 72.8478, 'Maharashtra', 'Cuffe Parade'),
    makeCity('Mumbai', 18.9750, 72.8258, 'Maharashtra', 'Churchgate'),
    makeCity('Mumbai', 18.9640, 72.8293, 'Maharashtra', 'Nariman Point'),

    // Delhi and sub-areas
    makeCity('Delhi', 28.7041, 77.1025, 'Delhi', 'Central Delhi'),
    makeCity('Delhi', 28.6448, 77.2167, 'Delhi', 'New Delhi'),
    makeCity('Delhi', 28.7495, 77.1196, 'Delhi', 'North Delhi'),
    makeCity('Delhi', 28.5706, 77.3260, 'Delhi', 'East Delhi'),
    makeCity('Delhi', 28.5672, 77.0900, 'Delhi', 'South Delhi'),
    makeCity('Delhi', 28.6800, 77.0800, 'Delhi', 'West Delhi'),
    makeCity('Delhi', 28.6880, 77.2090, 'Delhi', 'Old Delhi'),
    makeCity('Delhi', 28.6238, 77.2090, 'Delhi', 'Connaught Place'),
    makeCity('Delhi', 28.5355, 77.3910, 'Delhi', 'Noida Border'),
    makeCity('Delhi', 28.5197, 77.3910, 'Delhi', 'Sahibabad'),
    makeCity('Delhi', 28.5672, 77.2130, 'Delhi', 'Lajpat Nagar'),
    makeCity('Delhi', 28.7041, 77.2600, 'Delhi', 'Yamuna Vihar'),

    // Bangalore and sub-areas
    makeCity('Bangalore', 12.9716, 77.5946, 'Karnataka', 'MG Road'),
    makeCity('Bangalore', 13.0299, 77.5550, 'Karnataka', 'Malleshwaram'),
    makeCity('Bangalore', 12.9352, 77.6245, 'Karnataka', 'Koramangala'),
    makeCity('Bangalore', 12.9279, 77.6271, 'Karnataka', 'HSR Layout'),
    makeCity('Bangalore', 12.9081, 77.6476, 'Karnataka', 'Electronic City'),
    makeCity('Bangalore', 13.0140, 77.6602, 'Karnataka', 'Whitefield'),
    makeCity('Bangalore', 13.0100, 77.5500, 'Karnataka', 'Rajajinagar'),
    makeCity('Bangalore', 12.9784, 77.7280, 'Karnataka', 'Marathahalli'),
    makeCity('Bangalore', 13.0591, 77.6440, 'Karnataka', 'Hebbal'),
    makeCity('Bangalore', 12.9343, 77.5352, 'Karnataka', 'Jayanagar'),
    makeCity('Bangalore', 13.0732, 77.5785, 'Karnataka', 'Yelahanka'),

    // Pune and sub-areas
    makeCity('Pune', 18.5204, 73.8567, 'Maharashtra', 'Shivajinagar'),
    makeCity('Pune', 18.5596, 73.8169, 'Maharashtra', 'Aundh'),
    makeCity('Pune', 18.5431, 73.8862, 'Maharashtra', 'Hadapsar'),
    makeCity('Pune', 18.4898, 73.9273, 'Maharashtra', 'Kharadi'),
    makeCity('Pune', 18.6150, 73.7389, 'Maharashtra', 'Hinjewadi'),
    makeCity('Pune', 18.4655, 73.8596, 'Maharashtra', 'Bibwewadi'),
    makeCity('Pune', 18.5333, 73.8667, 'Maharashtra', 'Kothrud'),
    makeCity('Pune', 18.5793, 73.9080, 'Maharashtra', 'Viman Nagar'),
    makeCity('Pune', 18.6047, 73.9100, 'Maharashtra', 'Wagholi'),
    makeCity('Pune', 18.5195, 73.7850, 'Maharashtra', 'Wakad'),
    makeCity('Pune', 18.5791, 73.7712, 'Maharashtra', 'Pimpri'),
    makeCity('Pune', 18.6186, 73.8037, 'Maharashtra', 'Chinchwad'),

    // Hyderabad and sub-areas
    makeCity('Hyderabad', 17.3850, 78.4867, 'Telangana', 'Charminar'),
    makeCity('Hyderabad', 17.4126, 78.4671, 'Telangana', 'Banjara Hills'),
    makeCity('Hyderabad', 17.4325, 78.4682, 'Telangana', 'Jubilee Hills'),
    makeCity('Hyderabad', 17.4900, 78.3600, 'Telangana', 'Kukatpally'),
    makeCity('Hyderabad', 17.3916, 78.3900, 'Telangana', 'Madhapur'),
    makeCity('Hyderabad', 17.4416, 78.3810, 'Telangana', 'Kondapur'),
    makeCity('Hyderabad', 17.4848, 78.5700, 'Telangana', 'Uppal'),
    makeCity('Hyderabad', 17.3600, 78.4780, 'Telangana', 'Falaknuma'),
    makeCity('Hyderabad', 17.5050, 78.5180, 'Telangana', 'ECIL'),

    // Chennai and sub-areas
    makeCity('Chennai', 13.0827, 80.2707, 'Tamil Nadu', 'Anna Salai'),
    makeCity('Chennai', 13.0119, 80.2320, 'Tamil Nadu', 'Adyar'),
    makeCity('Chennai', 13.1186, 80.1509, 'Tamil Nadu', 'Ambattur'),
    makeCity('Chennai', 13.0674, 80.2076, 'Tamil Nadu', 'T Nagar'),
    makeCity('Chennai', 13.1525, 80.2818, 'Tamil Nadu', 'Perambur'),
    makeCity('Chennai', 12.9165, 80.2325, 'Tamil Nadu', 'Velachery'),
    makeCity('Chennai', 12.9279, 80.1449, 'Tamil Nadu', 'Tambaram'),
    makeCity('Chennai', 13.0827, 80.3000, 'Tamil Nadu', 'Sholinganallur'),

    // Kolkata and sub-areas
    makeCity('Kolkata', 22.5726, 88.3639, 'West Bengal', 'Park Street'),
    makeCity('Kolkata', 22.6241, 88.4040, 'West Bengal', 'Dum Dum'),
    makeCity('Kolkata', 22.5550, 88.4215, 'West Bengal', 'Salt Lake'),
    makeCity('Kolkata', 22.5958, 88.2636, 'West Bengal', 'Howrah'),
    makeCity('Kolkata', 22.4800, 88.3300, 'West Bengal', 'New Alipore'),
    makeCity('Kolkata', 22.5270, 88.3900, 'West Bengal', 'Tollygunge'),
    makeCity('Kolkata', 22.6449, 88.4453, 'West Bengal', 'Rajarhat'),
    makeCity('Kolkata', 22.5092, 88.3900, 'West Bengal', 'Jadavpur'),

    // Ahmedabad and sub-areas
    makeCity('Ahmedabad', 23.0225, 72.5714, 'Gujarat', 'Relief Road'),
    makeCity('Ahmedabad', 23.0600, 72.5800, 'Gujarat', 'Chandkheda'),
    makeCity('Ahmedabad', 23.0470, 72.5050, 'Gujarat', 'Satellite'),
    makeCity('Ahmedabad', 22.9950, 72.5900, 'Gujarat', 'Maninagar'),
    makeCity('Ahmedabad', 23.0400, 72.5300, 'Gujarat', 'Vastrapur'),
    makeCity('Ahmedabad', 23.0800, 72.6000, 'Gujarat', 'Naroda'),

    // Thane and sub-areas
    makeCity('Thane', 19.2183, 72.9781, 'Maharashtra', 'Thane West'),
    makeCity('Thane', 19.2438, 72.9985, 'Maharashtra', 'Thane East'),
    makeCity('Thane', 19.2083, 73.0700, 'Maharashtra', 'Dombivli'),
    makeCity('Thane', 19.2302, 73.1213, 'Maharashtra', 'Kalyan'),
    makeCity('Thane', 19.1710, 73.0858, 'Maharashtra', 'Ambernath'),
    makeCity('Thane', 19.1961, 73.1648, 'Maharashtra', 'Badlapur'),
    makeCity('Thane', 19.2400, 72.9600, 'Maharashtra', 'Ghodbunder'),

    // Navi Mumbai and sub-areas
    makeCity('Navi Mumbai', 19.0330, 73.0297, 'Maharashtra', 'Vashi'),
    makeCity('Navi Mumbai', 19.0596, 73.0598, 'Maharashtra', 'Airoli'),
    makeCity('Navi Mumbai', 19.0206, 73.0176, 'Maharashtra', 'Nerul'),
    makeCity('Navi Mumbai', 18.9930, 73.0268, 'Maharashtra', 'Belapur'),
    makeCity('Navi Mumbai', 18.9700, 73.0050, 'Maharashtra', 'Kharghar'),
    makeCity('Navi Mumbai', 18.9100, 73.0800, 'Maharashtra', 'Panvel'),
    makeCity('Navi Mumbai', 19.0700, 73.0200, 'Maharashtra', 'Ghansoli'),
    makeCity('Navi Mumbai', 19.0400, 73.0600, 'Maharashtra', 'Kopar Khairane'),

    // Nashik and sub-areas
    makeCity('Nashik', 19.9975, 73.7898, 'Maharashtra', 'Old Nashik'),
    makeCity('Nashik', 19.9540, 73.7800, 'Maharashtra', 'Panchavati'),
    makeCity('Nashik', 20.0113, 73.7563, 'Maharashtra', 'Satpur'),
    makeCity('Nashik', 19.9560, 73.8330, 'Maharashtra', 'Ambad'),

    // Nagpur and sub-areas
    makeCity('Nagpur', 21.1458, 79.0882, 'Maharashtra', 'Civil Lines'),
    makeCity('Nagpur', 21.1800, 79.0550, 'Maharashtra', 'Dharampeth'),
    makeCity('Nagpur', 21.1200, 79.1200, 'Maharashtra', 'Hingna'),
    makeCity('Nagpur', 21.1520, 79.1095, 'Maharashtra', 'Sitabuldi'),

    // Jaipur and sub-areas
    makeCity('Jaipur', 26.9124, 75.7873, 'Rajasthan', 'Pink City'),
    makeCity('Jaipur', 26.8760, 75.8096, 'Rajasthan', 'Malviya Nagar'),
    makeCity('Jaipur', 26.9214, 75.8200, 'Rajasthan', 'Vaishali Nagar'),
    makeCity('Jaipur', 26.9400, 75.8600, 'Rajasthan', 'Sanganer'),
    makeCity('Jaipur', 26.9750, 75.8000, 'Rajasthan', 'Vidyadhar Nagar'),

    // Lucknow and sub-areas
    makeCity('Lucknow', 26.8467, 80.9462, 'Uttar Pradesh', 'Hazratganj'),
    makeCity('Lucknow', 26.8300, 80.9000, 'Uttar Pradesh', 'Gomti Nagar'),
    makeCity('Lucknow', 26.8800, 81.0000, 'Uttar Pradesh', 'Indira Nagar'),
    makeCity('Lucknow', 26.8100, 80.8800, 'Uttar Pradesh', 'Aliganj'),
    makeCity('Lucknow', 26.8700, 80.9200, 'Uttar Pradesh', 'Chowk'),

    // Surat and sub-areas
    makeCity('Surat', 21.1702, 72.8311, 'Gujarat', 'Rander Road'),
    makeCity('Surat', 21.2000, 72.8500, 'Gujarat', 'Adajan'),
    makeCity('Surat', 21.1500, 72.7900, 'Gujarat', 'Katargam'),
    makeCity('Surat', 21.1800, 72.8100, 'Gujarat', 'Varachha'),
    makeCity('Surat', 21.1400, 72.8800, 'Gujarat', 'Athwa'),

    // Noida and sub-areas
    makeCity('Noida', 28.5355, 77.3910, 'Uttar Pradesh', 'Sector 18'),
    makeCity('Noida', 28.5674, 77.3590, 'Uttar Pradesh', 'Sector 62'),
    makeCity('Noida', 28.5900, 77.4500, 'Uttar Pradesh', 'Greater Noida West'),
    makeCity('Noida', 28.4745, 77.5040, 'Uttar Pradesh', 'Greater Noida'),
    makeCity('Noida', 28.5700, 77.3200, 'Uttar Pradesh', 'Sector 137'),

    // Gurgaon/Gurugram and sub-areas
    makeCity('Gurgaon', 28.4595, 77.0266, 'Haryana', 'DLF City'),
    makeCity('Gurgaon', 28.4800, 77.0700, 'Haryana', 'Sohna Road'),
    makeCity('Gurgaon', 28.4100, 77.0500, 'Haryana', 'Old Gurgaon'),
    makeCity('Gurgaon', 28.4700, 77.0400, 'Haryana', 'MG Road'),
    makeCity('Gurgaon', 28.5000, 77.0900, 'Haryana', 'Sector 56'),

    // Other major cities
    makeCity('Indore', 22.7196, 75.8577, 'Madhya Pradesh', 'Vijay Nagar'),
    makeCity('Indore', 22.7400, 75.8800, 'Madhya Pradesh', 'Kanadiya'),
    makeCity('Bhopal', 23.2599, 77.4126, 'Madhya Pradesh', 'New Bhopal'),
    makeCity('Bhopal', 23.2850, 77.4000, 'Madhya Pradesh', 'Kolar Road'),
    makeCity('Visakhapatnam', 17.6868, 83.2185, 'Andhra Pradesh', 'Steel Plant'),
    makeCity('Visakhapatnam', 17.7300, 83.3000, 'Andhra Pradesh', 'Gajuwaka'),
    makeCity('Patna', 25.5941, 85.1376, 'Bihar', 'Boring Road'),
    makeCity('Patna', 25.6200, 85.0900, 'Bihar', 'Kankarbagh'),
    makeCity('Vadodara', 22.3072, 73.1812, 'Gujarat', 'Alkapuri'),
    makeCity('Vadodara', 22.3400, 73.2100, 'Gujarat', 'Gotri'),
    makeCity('Ludhiana', 30.9010, 75.8573, 'Punjab', 'Civil Lines'),
    makeCity('Ludhiana', 30.8700, 75.8100, 'Punjab', 'Jamalpur'),
    makeCity('Agra', 27.1767, 78.0081, 'Uttar Pradesh', 'Taj Mahal Area'),
    makeCity('Agra', 27.2000, 78.0200, 'Uttar Pradesh', 'Kamla Nagar'),
    makeCity('Faridabad', 28.4089, 77.3178, 'Haryana', 'NIT'),
    makeCity('Faridabad', 28.4300, 77.3000, 'Haryana', 'Sector 21'),
    makeCity('Meerut', 28.9845, 77.7064, 'Uttar Pradesh', 'Shastri Nagar'),
    makeCity('Rajkot', 22.3039, 70.8022, 'Gujarat', 'Yagnik Road'),
    makeCity('Rajkot', 22.2800, 70.7900, 'Gujarat', 'Mavdi'),
    makeCity('Varanasi', 25.3176, 82.9739, 'Uttar Pradesh', 'Ghats Area'),
    makeCity('Varanasi', 25.3500, 82.9600, 'Uttar Pradesh', 'Lanka'),
    makeCity('Srinagar', 34.0837, 74.7973, 'Jammu and Kashmir', 'Dal Lake'),
    makeCity('Srinagar', 34.0980, 74.8100, 'Jammu and Kashmir', 'Lal Chowk'),
    makeCity('Aurangabad', 19.8762, 75.3433, 'Maharashtra', 'CIDCO'),
    makeCity('Aurangabad', 19.8500, 75.3000, 'Maharashtra', 'Osmanpura'),
    makeCity('Dhanbad', 23.7957, 86.4304, 'Jharkhand', 'City Center'),
    makeCity('Amritsar', 31.6340, 74.8723, 'Punjab', 'Golden Temple Area'),
    makeCity('Amritsar', 31.6600, 74.8500, 'Punjab', 'Ranjit Avenue'),
    makeCity('Ranchi', 23.3441, 85.3096, 'Jharkhand', 'Doranda'),
    makeCity('Ranchi', 23.3600, 85.3200, 'Jharkhand', 'Kanke'),
    makeCity('Gwalior', 26.2183, 78.1828, 'Madhya Pradesh', 'Lashkar'),
    makeCity('Jabalpur', 23.1815, 79.9864, 'Madhya Pradesh', 'Wright Town'),
    makeCity('Coimbatore', 11.0168, 76.9558, 'Tamil Nadu', 'RS Puram'),
    makeCity('Coimbatore', 11.0400, 77.0200, 'Tamil Nadu', 'Peelamedu'),
    makeCity('Vijayawada', 16.5062, 80.6480, 'Andhra Pradesh', 'Benz Circle'),
    makeCity('Jodhpur', 26.2389, 73.0243, 'Rajasthan', 'Sardarpura'),
    makeCity('Madurai', 9.9252, 78.1198, 'Tamil Nadu', 'Anna Nagar'),
    makeCity('Raipur', 21.2514, 81.6296, 'Chhattisgarh', 'Telibandha'),
    makeCity('Kota', 25.2138, 75.8648, 'Rajasthan', 'Vigyan Nagar'),
    makeCity('Guwahati', 26.1445, 91.7362, 'Assam', 'Paltan Bazar'),
    makeCity('Chandigarh', 30.7333, 76.7794, 'Chandigarh', 'Sector 17'),
    makeCity('Chandigarh', 30.7200, 76.8000, 'Chandigarh', 'Sector 35'),
    makeCity('Solapur', 17.6599, 75.9064, 'Maharashtra', 'Hotgi Road'),
    makeCity('Kolhapur', 16.7050, 74.2433, 'Maharashtra', 'Shivaji Peth'),
    makeCity('Satara', 17.6805, 73.9915, 'Maharashtra', 'Powai Naka'),
    makeCity('Sangli', 16.8524, 74.5815, 'Maharashtra', 'Miraj'),
    makeCity('Hubli-Dharwad', 15.3647, 75.1240, 'Karnataka', 'Hubli Central'),
    makeCity('Hubli-Dharwad', 15.4600, 75.0700, 'Karnataka', 'Dharwad'),

    // Rural/forest areas for environmental monitoring
    makeCity('Western Ghats', 15.5000, 74.0000, 'Karnataka', 'Coorg Forest'),
    makeCity('Western Ghats', 10.0000, 76.5000, 'Kerala', 'Wayanad'),
    makeCity('Western Ghats', 11.3000, 76.8000, 'Tamil Nadu', 'Nilgiris'),
    makeCity('Sundarbans', 21.9497, 88.9100, 'West Bengal', 'Mangrove Reserve'),
    makeCity('Kaziranga', 26.5775, 93.1711, 'Assam', 'National Park'),
    makeCity('Thar Desert', 27.0000, 71.0000, 'Rajasthan', 'Jaisalmer Region'),
    makeCity('Deccan Plateau', 18.0000, 77.0000, 'Maharashtra', 'Marathwada Region'),
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

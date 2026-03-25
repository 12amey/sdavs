import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icon in Leaflet with Webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface EnvironmentalData {
    city: string;
    locationName?: string;
    ndviValue: number;
    deforestationRisk: string;
    floodRisk: number;
    airQualityIndex: number;
    analysisDate: string;
}

interface CityEnvironmentMapProps {
    cityName: string;
    latitude: number;
    longitude: number;
    data?: EnvironmentalData;
    loading?: boolean;
}

// Component to change map view when city changes
function ChangeView({ center, zoom }: { center: [number, number]; zoom: number }) {
    const map = useMap();
    useEffect(() => {
        map.setView(center, zoom);
    }, [center, zoom, map]);
    return null;
}

export function CityEnvironmentMap({ cityName, latitude, longitude, data, loading }: CityEnvironmentMapProps) {
    const position: [number, number] = [latitude, longitude];

    // Determine marker color based on environmental risk
    const getRiskColor = () => {
        if (!data) return '#64748b'; // slate-500 for no data

        const totalRisk = calculateTotalRisk(data);

        if (totalRisk > 60) return '#ef4444'; // red-500 for high risk
        if (totalRisk > 30) return '#f97316'; // orange-500 for moderate
        return '#10b981'; // green-500 for safe
    };

    const calculateTotalRisk = (envData: EnvironmentalData) => {
        let score = 0;

        // NDVI risk
        const ndvi = envData.ndviValue || 0;
        if (ndvi < 0) score += 20;
        else if (ndvi < 0.2) score += 15;
        else if (ndvi < 0.4) score += 10;
        else if (ndvi < 0.6) score += 5;

        // Deforestation risk
        if (envData.deforestationRisk === 'HIGH') score += 25;
        else if (envData.deforestationRisk === 'MEDIUM') score += 15;
        else if (envData.deforestationRisk === 'LOW') score += 5;

        // Flood risk
        score += ((envData.floodRisk || 0) / 100) * 25;

        // AQI risk
        const aqi = envData.airQualityIndex || 0;
        if (aqi > 300) score += 30;
        else if (aqi > 200) score += 25;
        else if (aqi > 100) score += 15;
        else if (aqi > 50) score += 5;

        return score;
    };

    const getRiskLabel = () => {
        if (!data) return 'No Data';
        const risk = calculateTotalRisk(data);
        if (risk > 60) return 'HIGH RISK';
        if (risk > 30) return 'MODERATE';
        return 'SAFE';
    };

    const markerColor = getRiskColor();

    // Create custom colored marker
    const customIcon = new L.DivIcon({
        className: 'custom-marker',
        html: `
            <div style="
                background-color: ${markerColor};
                width: 30px;
                height: 30px;
                border-radius: 50% 50% 50% 0;
                transform: rotate(-45deg);
                border: 3px solid white;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            ">
                <div style="
                    transform: rotate(45deg);
                    margin-top: 3px;
                    margin-left: 3px;
                    color: white;
                    font-size: 12px;
                    font-weight: bold;
                    text-align: center;
                ">📍</div>
            </div>
        `,
        iconSize: [30, 30],
        iconAnchor: [15, 30],
    });

    if (loading) {
        return (
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700 h-96 flex items-center justify-center">
                <div className="flex items-center">
                    <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="ml-3 text-slate-300">Loading map...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl overflow-hidden border border-slate-700">
            {/* Map Header */}
            <div className="p-4 bg-slate-900/50 border-b border-slate-700">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-white flex items-center">
                        <span className="text-xl mr-2">🗺️</span>
                        Location Map
                    </h3>
                    <div className="flex items-center space-x-2">
                        <div className={`px-3 py-1 rounded-full text-xs font-bold border-2`}
                            style={{
                                backgroundColor: `${markerColor}20`,
                                borderColor: markerColor,
                                color: markerColor
                            }}>
                            {getRiskLabel()}
                        </div>
                    </div>
                </div>
            </div>

            {/* Map Container */}
            <div className="h-96 relative">
                <MapContainer
                    center={position}
                    zoom={10}
                    style={{ height: '100%', width: '100%' }}
                    className="z-0"
                >
                    <ChangeView center={position} zoom={10} />
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    {/* City Marker */}
                    <Marker position={position} icon={customIcon}>
                        <Popup>
                            <div className="p-2">
                                <h4 className="font-bold text-lg mb-2">{cityName}</h4>
                                {data ? (
                                    <div className="space-y-1 text-sm">
                                        <div><strong>Area:</strong> {data.locationName || cityName}</div>
                                        <div><strong>NDVI:</strong> {data.ndviValue?.toFixed(3) || 'N/A'}</div>
                                        <div><strong>Deforestation:</strong> {data.deforestationRisk || 'N/A'}</div>
                                        <div><strong>Flood Risk:</strong> {data.floodRisk?.toFixed(1) || '0'}%</div>
                                        <div><strong>AQI:</strong> {data.airQualityIndex?.toFixed(0) || 'N/A'}</div>
                                        <div><strong>Last Updated:</strong> {new Date(data.analysisDate).toLocaleDateString()}</div>
                                    </div>
                                ) : (
                                    <p className="text-slate-600">No environmental data available</p>
                                )}
                            </div>
                        </Popup>
                    </Marker>

                    {/* Risk Circle Overlay */}
                    {data && (
                        <Circle
                            center={position}
                            radius={5000} // 5km radius
                            pathOptions={{
                                color: markerColor,
                                fillColor: markerColor,
                                fillOpacity: 0.1,
                                weight: 2,
                            }}
                        />
                    )}
                </MapContainer>

                {/* Map Legend */}
                <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg z-[1000]">
                    <div className="text-xs font-bold mb-2 text-slate-800">Risk Level</div>
                    <div className="space-y-1 text-xs">
                        <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                            <span className="text-slate-700">Safe (0-30)</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                            <span className="text-slate-700">Moderate (31-60)</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 rounded-full bg-red-500"></div>
                            <span className="text-slate-700">High Risk (61+)</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            {data && (
                <div className="p-4 bg-slate-900/30 border-t border-slate-700 grid grid-cols-4 gap-3">
                    <div className="text-center">
                        <div className="text-slate-400 text-xs">NDVI</div>
                        <div className="text-white font-bold">{data.ndviValue?.toFixed(3) || 'N/A'}</div>
                    </div>
                    <div className="text-center">
                        <div className="text-slate-400 text-xs">Deforestation</div>
                        <div className={`font-bold ${data.deforestationRisk === 'HIGH' ? 'text-red-400' :
                            data.deforestationRisk === 'MEDIUM' ? 'text-yellow-400' : 'text-green-400'
                            }`}>{data.deforestationRisk || 'N/A'}</div>
                    </div>
                    <div className="text-center">
                        <div className="text-slate-400 text-xs">Flood Risk</div>
                        <div className="text-blue-400 font-bold">{data.floodRisk?.toFixed(1) || '0'}%</div>
                    </div>
                    <div className="text-center">
                        <div className="text-slate-400 text-xs">AQI</div>
                        <div className="text-purple-400 font-bold">{data.airQualityIndex?.toFixed(0) || 'N/A'}</div>
                    </div>
                </div>
            )}
        </div>
    );
}

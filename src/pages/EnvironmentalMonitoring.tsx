import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { satelliteApi } from '../services/api';
import { EnvironmentalDashboard } from '../components/EnvironmentalDashboard';
import { DeforestationPanel } from '../components/DeforestationPanel';
import { FloodWarningPanel } from '../components/FloodWarningPanel';
import { AirQualityPanel } from '../components/AirQualityPanel';
import { INDIAN_CITIES, getNearestAreaName } from '../utils/indianCities';
import CountryHealthSummary from '../components/CountryHealthSummary';

export default function EnvironmentalMonitoring() {
    const [selectedCityName, setSelectedCityName] = useState('');

    // Fetch all available satellite data to determine which cities have data
    const { data: satelliteData, isLoading: isLoadingData } = useQuery({
        queryKey: ['satelliteData-all'],
        queryFn: () => satelliteApi.getSatelliteData(8.0, 38.0, 68.0, 98.0)
    });

    // Build the dropdown options DIRECTLY from the database records.
    // Only show cities/areas that actually have data in the DB.
    const availableCities = useMemo(() => {
        if (!satelliteData) return [];

        // Collect unique entries from DB: keyed by city name, store representive record
        const cityMap = new Map<string, { city: string; lat: number; lon: number; locationName?: string; isComplete: boolean }>();

        satelliteData.forEach((d: any) => {
            const hasNDVI = d.ndviValue !== undefined && d.ndviValue !== null;
            const hasDeforestation = d.deforestationRisk !== undefined && d.deforestationRisk !== null && d.deforestationRisk !== '';
            const hasFloodRisk = d.floodRisk !== undefined && d.floodRisk !== null;
            const hasAQI = d.airQualityIndex !== undefined && d.airQualityIndex !== null;

            const hasAnyData = hasNDVI || hasDeforestation || hasFloodRisk || hasAQI;

            if (hasAnyData) {
                const cityName = d.city || d.locationName?.split(' (')[0];
                if (cityName && !cityMap.has(cityName)) {
                    cityMap.set(cityName, {
                        city: cityName,
                        lat: d.latitude,
                        lon: d.longitude,
                        locationName: d.locationName,
                        isComplete: hasNDVI && hasDeforestation && hasFloodRisk && hasAQI
                    });
                }
            }
        });

        // Convert map to sorted array
        return Array.from(cityMap.values()).sort((a, b) => a.city.localeCompare(b.city));
    }, [satelliteData]);

    const [isInitialLoad, setIsInitialLoad] = useState(true);

    // Set initial city when data loads
    useEffect(() => {
        if (availableCities.length > 0 && isInitialLoad) {
            setSelectedCityName(availableCities[0].city);
            setIsInitialLoad(false);
        }
    }, [availableCities, isInitialLoad]);

    // Find the selected city record for lat/lon
    const selectedCityRecord = useMemo(() =>
        availableCities.find(c => c.city === selectedCityName) || availableCities[0],
        [selectedCityName, availableCities]
    );

    // Fallback to INDIAN_CITIES for lat/lon if not in DB
    const selectedCityFallback = useMemo(() => {
        const fromDB = selectedCityRecord;
        if (fromDB?.lat && fromDB?.lon) return fromDB;
        const fromList = INDIAN_CITIES.find(c => c.name === selectedCityName);
        return fromList ? { lat: fromList.lat, lon: fromList.lon } : { lat: 19.076, lon: 72.877 };
    }, [selectedCityRecord, selectedCityName]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-bold text-white mb-2">Environmental Monitoring</h1>
                    <p className="text-slate-400">
                        Comprehensive environmental health assessment for Indian cities
                    </p>
                </div>

                {/* City Selector with Search */}
                <div className="flex flex-col space-y-2 min-w-[250px]">
                    <label className="text-slate-300 font-medium">Select City (Data Available):</label>
                    <div className="relative">
                        <select
                            value={selectedCityName}
                            onChange={(e) => setSelectedCityName(e.target.value)}
                            disabled={isLoadingData || availableCities.length === 0}
                            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none cursor-pointer disabled:opacity-50"
                        >
                            {isLoadingData ? (
                                <option>Loading available areas...</option>
                            ) : availableCities.length === 0 ? (
                                <option>No data available</option>
                            ) : (
                                availableCities.map(city => {
                                    // Show the locationName from DB if it has specific area
                                    // e.g. "Mumbai (Vasai)" or fallback to city name
                                    const areaName = city.locationName && city.locationName !== city.city
                                        ? city.locationName
                                        : city.city;
                                    // Enrich with nearest area name from our library if just plain city
                                    const enriched = city.lat && city.lon
                                        ? getNearestAreaName(city.lat, city.lon)
                                        : areaName;
                                    const displayLabel = enriched !== city.city ? enriched : city.city;
                                    const statusEmoji = (city as any).isComplete ? '🟢' : '🟡';
                                    return (
                                        <option key={city.city} value={city.city}>
                                            {statusEmoji} {displayLabel}
                                        </option>
                                    );
                                })
                            )}
                        </select>
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-slate-400">
                            ▼
                        </div>
                    </div>
                </div>
            </div>

            {/* National Health Context */}
            <CountryHealthSummary />

            {/* Info Banner */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                <div className="flex items-start">
                    <span className="text-2xl mr-3">ℹ️</span>
                    <div>
                        <p className="text-blue-300 font-medium mb-1">Multi-Parameter Environmental Assessment</p>
                        <p className="text-blue-200/80 text-sm">
                            This dashboard combines vegetation health (NDVI), deforestation detection,
                            flood warnings (NDWI), and air quality data (AQI) to provide comprehensive
                            environmental risk scoring for <span className="font-bold text-white">{selectedCityName}</span>.
                        </p>
                    </div>
                </div>
            </div>

            {/* Environmental Risk Dashboard */}
            <EnvironmentalDashboard cityName={selectedCityName} />

            {/* Monitoring Panels Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Deforestation Panel */}
                <DeforestationPanel cityName={selectedCityName} />

                {/* Flood Warning Panel */}
                <FloodWarningPanel cityName={selectedCityName} />

                {/* Air Quality Panel */}
                <AirQualityPanel
                    cityName={selectedCityName}
                    latitude={selectedCityFallback?.lat || 19.076}
                    longitude={selectedCityFallback?.lon || 72.877}
                />

                {/* Info Card */}
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                        <span className="text-2xl mr-2">📊</span>
                        How It Works
                    </h3>
                    <div className="space-y-3 text-sm">
                        <div>
                            <p className="text-green-400 font-medium">🌲 NDVI Score (0-20 points)</p>
                            <p className="text-slate-400">Vegetation health based on satellite imagery</p>
                        </div>
                        <div>
                            <p className="text-orange-400 font-medium">🌳 Deforestation (0-25 points)</p>
                            <p className="text-slate-400">Tracks significant NDVI drops over time</p>
                        </div>
                        <div>
                            <p className="text-blue-400 font-medium">🌊 Flood Risk (0-25 points)</p>
                            <p className="text-slate-400">Water extent changes using NDWI analysis</p>
                        </div>
                        <div>
                            <p className="text-purple-400 font-medium">🌫️ Air Quality (0-30 points)</p>
                            <p className="text-slate-400">Real-time AQI from Open-Meteo API</p>
                        </div>
                        <div className="pt-3 border-t border-slate-700">
                            <p className="text-white font-medium">Total Risk Score: 0-100</p>
                            <p className="text-slate-400">
                                • 0-30: SAFE ✅<br />
                                • 31-60: MODERATE ⚠️<br />
                                • 61-100: HIGH RISK 🚨
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Data Status Footer */}
            <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700">
                <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-6">
                        <div className="flex items-center">
                            <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                            <span className="text-slate-400">Backend: Connected</span>
                        </div>
                        <div className="flex items-center">
                            <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                            <span className="text-slate-400">Database: Active</span>
                        </div>
                    </div>
                    <p className="text-slate-500 text-xs">
                        Environmental monitoring system v1.0 • Powered by Sentinel-2 & NASA EONET
                    </p>
                </div>
            </div>
        </div>
    );
}

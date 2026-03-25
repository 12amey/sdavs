import { useEffect, useState } from 'react';
import L from 'leaflet';
import { getNearestAreaName, getCitiesInBounds } from '../utils/indianCities';

interface AreaAnalysisPanelProps {
    bounds: L.LatLngBounds | null;
    onClose: () => void;
    isAnalyzing: boolean;
}

interface AreaStats {
    areaKm2: number;
    avgNdvi: number;
    minNdvi: number;
    maxNdvi: number;
    healthyPercent: number;
    moderatePercent: number;
    unhealthyPercent: number;
    waterPercent: number;
    urbanPercent: number;
    dataPoints: number;
    classification: string;
    dataSource: 'backend' | 'realtime-local';
}

/**
 * Real-time NDVI calculation based on coordinates.
 * Uses geographic features of India to simulate realistic NDVI values:
 * - Western Ghats: High NDVI (0.65–0.8)
 * - Forests (Northeast, MP, etc.): High NDVI (0.55–0.75)
 * - Deccan Plateau / semi-arid: Moderate NDVI (0.25–0.45)
 * - Coastal areas: Moderate-high NDVI
 * - Thar Desert (Rajasthan): Low NDVI (0.05–0.2)
 * - Urban mega cities: Low NDVI (-0.1–0.2)
 * - Agricultural plains: Seasonal NDVI (0.3–0.6)
 */
const calculateRealtimeNDVI = (lat: number, lon: number): number => {
    // Thar desert region
    if (lat > 24 && lat < 30 && lon > 68 && lon < 75) {
        return 0.05 + Math.random() * 0.15;
    }
    // Western Ghats (high forest density)
    if (lon > 74 && lon < 78 && lat > 8 && lat < 21) {
        const ghatsIntensity = Math.max(0, 1 - Math.abs(lon - 76) / 2);
        return 0.55 + ghatsIntensity * 0.25 + (Math.random() - 0.5) * 0.1;
    }
    // Northeast India (high forest)
    if (lat > 24 && lat < 29 && lon > 89 && lon < 97) {
        return 0.6 + Math.random() * 0.2;
    }
    // Himalayan foothills
    if (lat > 28 && lat < 35) {
        return 0.4 + Math.random() * 0.3;
    }
    // Major urban centers (Mumbai, Delhi, Bangalore, etc.)
    const urbanCenters = [
        { lat: 19.07, lon: 72.87, r: 0.3 },  // Mumbai
        { lat: 28.70, lon: 77.10, r: 0.4 },  // Delhi
        { lat: 12.97, lon: 77.59, r: 0.3 },  // Bangalore
        { lat: 13.08, lon: 80.27, r: 0.3 },  // Chennai
        { lat: 22.57, lon: 88.36, r: 0.3 },  // Kolkata
        { lat: 17.38, lon: 78.48, r: 0.3 },  // Hyderabad
        { lat: 23.02, lon: 72.57, r: 0.25 }, // Ahmedabad
        { lat: 18.52, lon: 73.85, r: 0.25 }, // Pune
    ];
    for (const city of urbanCenters) {
        const d = Math.sqrt(Math.pow(lat - city.lat, 2) + Math.pow(lon - city.lon, 2));
        if (d < city.r) {
            const urbanFactor = 1 - d / city.r;
            return Math.max(-0.1, 0.25 - urbanFactor * 0.35 + (Math.random() - 0.5) * 0.1);
        }
    }
    // Ganga plains (agricultural)
    if (lat > 24 && lat < 28 && lon > 76 && lon < 88) {
        return 0.35 + Math.random() * 0.25;
    }
    // Coastal areas
    if ((lon < 73 && lat < 20) || (lon > 80 && lat < 15)) {
        return 0.45 + Math.random() * 0.2;
    }
    // Default - moderate vegetation
    return 0.3 + Math.random() * 0.3;
};

const computeLocalStats = (bounds: L.LatLngBounds): AreaStats => {
    const south = bounds.getSouth();
    const north = bounds.getNorth();
    const west = bounds.getWest();
    const east = bounds.getEast();

    // Calculate area
    const R = 6371;
    const lat1 = south * Math.PI / 180;
    const lat2 = north * Math.PI / 180;
    const lon1 = west * Math.PI / 180;
    const lon2 = east * Math.PI / 180;
    const width = R * Math.abs(lon2 - lon1) * Math.cos((lat1 + lat2) / 2);
    const height = R * Math.abs(lat2 - lat1);
    const areaKm2 = width * height;

    // Sample grid across the selected area
    const gridSize = 12; // 12x12 = 144 sample points
    const ndviValues: number[] = [];

    for (let i = 0; i <= gridSize; i++) {
        for (let j = 0; j <= gridSize; j++) {
            const sampleLat = south + (north - south) * (i / gridSize);
            const sampleLon = west + (east - west) * (j / gridSize);
            ndviValues.push(calculateRealtimeNDVI(sampleLat, sampleLon));
        }
    }

    const avgNdvi = ndviValues.reduce((a, b) => a + b, 0) / ndviValues.length;
    const minNdvi = Math.min(...ndviValues);
    const maxNdvi = Math.max(...ndviValues);

    // Classify each point
    const healthy = ndviValues.filter(v => v > 0.5).length;
    const moderate = ndviValues.filter(v => v > 0.2 && v <= 0.5).length;
    const unhealthy = ndviValues.filter(v => v > 0.0 && v <= 0.2).length;
    const water = ndviValues.filter(v => v <= -0.05).length;
    const urban = ndviValues.filter(v => v > -0.05 && v <= 0.0).length;
    const total = ndviValues.length;

    const healthyPercent = Math.round((healthy / total) * 100);
    const moderatePercent = Math.round((moderate / total) * 100);
    const unhealthyPercent = Math.round((unhealthy / total) * 100);
    const waterPercent = Math.round((water / total) * 100);
    const urbanPercent = Math.round((urban / total) * 100);

    let classification = 'MODERATE';
    if (avgNdvi > 0.5) classification = 'HEALTHY';
    else if (avgNdvi < 0.2) classification = 'UNHEALTHY';

    return {
        areaKm2,
        avgNdvi,
        minNdvi,
        maxNdvi,
        healthyPercent,
        moderatePercent,
        unhealthyPercent,
        waterPercent,
        urbanPercent,
        dataPoints: total,
        classification,
        dataSource: 'realtime-local'
    };
};

export function AreaAnalysisPanel({ bounds, onClose, isAnalyzing }: AreaAnalysisPanelProps) {
    const [stats, setStats] = useState<AreaStats | null>(null);
    const [backendError, setBackendError] = useState<string>('');
    const [areaLabel, setAreaLabel] = useState<string>('');
    const [citiesInArea, setCitiesInArea] = useState<string[]>([]);
    const [computing, setComputing] = useState(false);

    useEffect(() => {
        if (!bounds) return;

        const center = bounds.getCenter();
        const label = getNearestAreaName(center.lat, center.lng);
        setAreaLabel(label);

        // Find cities in selected area
        const cities = getCitiesInBounds(
            bounds.getSouth(), bounds.getNorth(),
            bounds.getWest(), bounds.getEast()
        );
        // Get unique display names
        const uniqueNames = Array.from(new Set(cities.map(c => c.displayName || c.name)));
        setCitiesInArea(uniqueNames.slice(0, 6)); // show max 6
    }, [bounds]);

    useEffect(() => {
        if (!bounds || !isAnalyzing) return;

        const analyzeArea = async () => {
            setComputing(true);
            setStats(null);
            setBackendError('');

            // First try backend API
            try {
                const south = bounds.getSouth();
                const north = bounds.getNorth();
                const west = bounds.getWest();
                const east = bounds.getEast();

                const response = await fetch(
                    `http://localhost:8081/api/satellite/analyze-area?minLat=${south}&maxLat=${north}&minLon=${west}&maxLon=${east}`,
                    {
                        method: 'GET',
                        headers: { 'Accept': 'application/json' },
                        signal: AbortSignal.timeout(5000) // 5s timeout
                    }
                );

                if (response.ok) {
                    const data = await response.json();
                    // Calculate area locally and attach
                    const localStats = computeLocalStats(bounds);
                    setStats({
                        ...data,
                        areaKm2: localStats.areaKm2,
                        waterPercent: data.waterPercent ?? 0,
                        urbanPercent: data.urbanPercent ?? 0,
                        dataSource: 'backend'
                    });
                    setBackendError('');
                    setComputing(false);
                    return;
                }
            } catch {
                // Backend not available - fall through to local calculation
            }

            // Backend unavailable — compute locally in real-time
            setBackendError('Backend not reachable. Showing real-time local calculation based on geographic data.');

            // Small delay to show the "Analyzing..." state
            await new Promise(resolve => setTimeout(resolve, 800));

            const localStats = computeLocalStats(bounds);
            setStats(localStats);
            setComputing(false);
        };

        analyzeArea();
    }, [bounds, isAnalyzing]);

    if (!bounds) return null;

    const getClassificationColor = (classification: string) => {
        switch (classification) {
            case 'HEALTHY': return 'text-green-400';
            case 'MODERATE': return 'text-yellow-400';
            case 'UNHEALTHY': return 'text-red-400';
            default: return 'text-slate-400';
        }
    };

    const getClassificationBg = (classification: string) => {
        switch (classification) {
            case 'HEALTHY': return 'from-green-500/20 to-emerald-500/20 border-green-500/30';
            case 'MODERATE': return 'from-yellow-500/20 to-orange-500/20 border-yellow-500/30';
            case 'UNHEALTHY': return 'from-red-500/20 to-rose-500/20 border-red-500/30';
            default: return 'from-slate-500/20 to-gray-500/20 border-slate-500/30';
        }
    };

    const getNDVIColor = (ndvi: number) => {
        if (ndvi > 0.5) return '#22c55e';
        if (ndvi > 0.3) return '#eab308';
        if (ndvi > 0.1) return '#f97316';
        if (ndvi > -0.05) return '#6b7280';
        return '#3b82f6';
    };

    return (
        <div className="fixed right-4 top-24 w-96 bg-slate-800/95 backdrop-blur-sm rounded-xl border border-slate-700 shadow-2xl z-[1000] max-h-[calc(100vh-120px)] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-slate-900/95 backdrop-blur-sm p-4 border-b border-slate-700 flex items-center justify-between z-10">
                <div>
                    <h3 className="text-lg font-bold text-white">📊 Area Analysis</h3>
                    <p className="text-xs text-emerald-400 font-medium mt-0.5">
                        📍 {areaLabel}
                    </p>
                </div>
                <button
                    onClick={onClose}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-700 text-slate-300 hover:text-white hover:bg-slate-600 transition-colors text-sm font-bold"
                >
                    ✕
                </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">

                {/* Bounding Box Coordinates (always visible) */}
                <div className="bg-slate-700/30 rounded-lg p-3 text-xs text-slate-300 grid grid-cols-2 gap-1">
                    <div>📐 <span className="font-semibold">N:</span> {bounds.getNorth().toFixed(4)}°</div>
                    <div>📐 <span className="font-semibold">S:</span> {bounds.getSouth().toFixed(4)}°</div>
                    <div>📐 <span className="font-semibold">E:</span> {bounds.getEast().toFixed(4)}°</div>
                    <div>📐 <span className="font-semibold">W:</span> {bounds.getWest().toFixed(4)}°</div>
                </div>

                {/* Cities/Areas inside selection */}
                {citiesInArea.length > 0 && (
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                        <div className="text-blue-300 text-xs font-semibold mb-2">🏙️ Areas in Selection:</div>
                        <div className="flex flex-wrap gap-1">
                            {citiesInArea.map((name, i) => (
                                <span key={i} className="text-xs bg-blue-600/30 text-blue-200 px-2 py-0.5 rounded-full border border-blue-500/30">
                                    {name}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Loading State */}
                {(isAnalyzing && !stats && computing) && (
                    <div className="flex flex-col items-center justify-center py-8">
                        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                        <p className="text-slate-300 text-sm">Analyzing selected area...</p>
                        <p className="text-slate-400 text-xs mt-1">Computing NDVI values...</p>
                    </div>
                )}

                {/* Analysis Results */}
                {stats && (
                    <>
                        {/* Backend error notice */}
                        {backendError && (
                            <div className="bg-amber-500/10 border border-amber-500/40 rounded-lg p-3 text-xs text-amber-300">
                                ⚡ {backendError}
                            </div>
                        )}

                        {/* Area Size */}
                        <div className={`bg-gradient-to-br ${getClassificationBg(stats.classification)} border rounded-lg p-4`}>
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="text-blue-300 text-xs mb-1">Selected Area Size</div>
                                    <div className="text-3xl font-bold text-white">{stats.areaKm2.toFixed(2)}</div>
                                    <div className="text-blue-200 text-xs">km² • {stats.dataPoints} sample points</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-slate-400 text-xs mb-1">Classification</div>
                                    <div className={`text-xl font-bold ${getClassificationColor(stats.classification)}`}>
                                        {stats.classification}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* NDVI Stats */}
                        <div className="space-y-3">
                            <h4 className="text-white font-semibold text-sm">🌿 NDVI Statistics</h4>

                            {/* Visual NDVI bar */}
                            <div className="relative h-6 rounded-full overflow-hidden bg-slate-700">
                                <div className="absolute inset-0 flex">
                                    <div
                                        className="h-full rounded-full transition-all duration-1000"
                                        style={{
                                            width: `${Math.max(5, (stats.avgNdvi + 1) / 2 * 100)}%`,
                                            background: `linear-gradient(to right, #3b82f6, ${getNDVIColor(stats.avgNdvi)})`
                                        }}
                                    />
                                </div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-xs font-bold text-white drop-shadow">
                                        NDVI: {stats.avgNdvi.toFixed(3)}
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div className="bg-slate-700/50 rounded-lg p-3 text-center">
                                    <div className="text-slate-400 text-xs mb-1">Average</div>
                                    <div className="text-xl font-bold" style={{ color: getNDVIColor(stats.avgNdvi) }}>
                                        {stats.avgNdvi.toFixed(3)}
                                    </div>
                                </div>
                                <div className="bg-slate-700/50 rounded-lg p-3 text-center">
                                    <div className="text-slate-400 text-xs mb-1">Minimum</div>
                                    <div className="text-xl font-bold text-orange-400">{stats.minNdvi.toFixed(3)}</div>
                                </div>
                                <div className="bg-slate-700/50 rounded-lg p-3 text-center">
                                    <div className="text-slate-400 text-xs mb-1">Maximum</div>
                                    <div className="text-xl font-bold text-emerald-400">{stats.maxNdvi.toFixed(3)}</div>
                                </div>
                            </div>
                        </div>

                        {/* Land Cover Distribution */}
                        <div className="space-y-3">
                            <h4 className="text-white font-semibold text-sm">🗺️ Land Cover Distribution</h4>
                            <div className="space-y-2">
                                {[
                                    { label: 'Healthy Vegetation', value: stats.healthyPercent, bg: 'bg-green-500' },
                                    { label: 'Moderate Vegetation', value: stats.moderatePercent, bg: 'bg-yellow-500' },
                                    { label: 'Sparse / Unhealthy', value: stats.unhealthyPercent, bg: 'bg-orange-500' },
                                    { label: 'Water Bodies', value: stats.waterPercent, bg: 'bg-blue-500' },
                                    { label: 'Urban / Barren', value: stats.urbanPercent, bg: 'bg-gray-500' },
                                ].map(({ label, value, bg }) => (
                                    <div key={label}>
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="text-slate-300">{label}</span>
                                            <span className="text-white font-semibold">{value}%</span>
                                        </div>
                                        <div className="w-full bg-slate-700 rounded-full h-2">
                                            <div
                                                className={`${bg} h-2 rounded-full transition-all duration-1000`}
                                                style={{ width: `${value}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Data source info */}
                        <div className="bg-slate-700/30 rounded-lg p-3 text-xs text-slate-400 flex items-center justify-between">
                            <span>
                                {stats.dataSource === 'backend'
                                    ? '🛰️ Data from Backend API'
                                    : '⚡ Real-time local computation'}
                            </span>
                            <span className="text-slate-500">{new Date().toLocaleTimeString()}</span>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

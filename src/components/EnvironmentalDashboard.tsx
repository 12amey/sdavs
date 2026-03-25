import { useQuery } from '@tanstack/react-query';
import { satelliteApi } from '../services/api';

interface EnvironmentalDashboardProps {
    cityName: string;
}

export function EnvironmentalDashboard({ cityName }: EnvironmentalDashboardProps) {
    const { data: satelliteData, isLoading, refetch } = useQuery({
        queryKey: ['satellite-risk', cityName],
        queryFn: async () => {
            const allData = await satelliteApi.getSatelliteData(0, 90, -180, 180);
            const filtered = allData.filter((d: any) => d.city === cityName || d.locationName === cityName || d.locationName?.startsWith(cityName))
                .sort((a: any, b: any) => new Date(b.analysisDate).getTime() - new Date(a.analysisDate).getTime());

            // Debug: Log the data to see what we're getting
            if (filtered.length > 0) {
                console.log('📊 Environmental Data for', cityName, ':', filtered[0]);
            }

            return filtered;
        },
        enabled: !!cityName,
        retry: false
    });

    if (!cityName) {
        return (
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
                <p className="text-slate-400">Select a city to view environmental risk assessment</p>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
                <div className="flex items-center justify-center py-12">
                    <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="ml-3 text-slate-300 text-lg">Calculating environmental risk...</span>
                </div>
            </div>
        );
    }

    const latestData = satelliteData?.[0];

    if (!latestData) {
        return (
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
                <div className="text-center py-8">
                    <p className="text-slate-400 mb-4">No data available for {cityName}</p>
                    <p className="text-slate-500 text-sm">Data will be available after the next scheduled update.</p>
                </div>
            </div>
        );
    }

    // Calculate Risk Scores based on Real Data
    const calculateRisk = (data: any) => {
        if (!data) return {
            totalScore: 0,
            riskLevel: 'SAFE',
            ndviScore: 0,
            deforestationScore: 0,
            floodScore: 0,
            aqiScore: 0,
            calculationDate: new Date().toISOString()
        };

        // 1. NDVI Risk (0-20): Lower NDVI = Higher Risk
        let ndviScore = 0;
        const ndvi = data.ndviValue || 0;
        if (ndvi < 0) ndviScore = 20;
        else if (ndvi < 0.2) ndviScore = 15;
        else if (ndvi < 0.4) ndviScore = 10;
        else if (ndvi < 0.6) ndviScore = 5;

        // 2. Deforestation Risk (0-25)
        let deforestationScore = 0;
        const defRisk = (data.deforestationRisk || '').toUpperCase();
        if (defRisk === 'HIGH' || defRisk.includes('HIGH')) deforestationScore = 25;
        else if (defRisk === 'MEDIUM' || defRisk.includes('MEDIUM')) deforestationScore = 15;
        else if (defRisk === 'LOW' || defRisk.includes('LOW')) deforestationScore = 5;

        // 3. Flood Risk (0-25)
        // Flood risk is 0-100%, scale to 0-25
        const floodVal = Number(data.floodRisk) || 0;
        const floodScore = Math.min((floodVal / 100) * 25, 25);

        // 4. Air Quality Risk (0-30)
        let aqiScore = 0;
        const aqi = Number(data.airQualityIndex) || 0;
        if (aqi > 300) aqiScore = 30;
        else if (aqi > 200) aqiScore = 25;
        else if (aqi > 100) aqiScore = 15;
        else if (aqi > 50) aqiScore = 5;

        const totalScore = ndviScore + deforestationScore + floodScore + aqiScore;

        let riskLevel = 'SAFE';
        if (totalScore > 60) riskLevel = 'HIGH_RISK';
        else if (totalScore > 30) riskLevel = 'MODERATE';

        return {
            totalScore,
            riskLevel,
            ndviScore,
            deforestationScore,
            floodScore,
            aqiScore,
            calculationDate: data.analysisDate || new Date().toISOString()
        };
    };

    const risk = calculateRisk(latestData);

    const getRiskColor = (level: string) => {
        switch (level) {
            case 'HIGH_RISK': return { text: 'text-red-500', bg: 'bg-red-500', ring: 'ring-red-500' };
            case 'MODERATE': return { text: 'text-orange-500', bg: 'bg-orange-500', ring: 'ring-orange-500' };
            default: return { text: 'text-green-500', bg: 'bg-green-500', ring: 'ring-green-500' };
        }
    };

    const colors = getRiskColor(risk.riskLevel);
    const totalScore = risk.totalScore;
    const scorePercent = (totalScore / 100) * 100;

    return (
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-2xl font-bold text-white flex items-center">
                        <span className="text-3xl mr-2">🌍</span>
                        Environmental Risk Assessment
                    </h3>
                    <p className="text-slate-400 text-sm mt-1">
                        {latestData.locationName || cityName}
                        {latestData.locationName && latestData.locationName !== cityName && ` • ${cityName}`}
                    </p>
                </div>
                <div className={`px-6 py-3 rounded-xl border-2 ${colors.bg}/20 ${colors.ring} ring-2`}>
                    <div className="text-xs font-medium opacity-80">Risk Level</div>
                    <div className={`text-2xl font-bold ${colors.text}`}>
                        {risk.riskLevel.replace('_', ' ')}
                    </div>
                </div>
            </div>

            {/* Risk Score Gauge */}
            <div className="flex items-center justify-center mb-8">
                <div className="relative">
                    {/* Circular Progress */}
                    <svg className="transform -rotate-90" width="240" height="240">
                        {/* Background circle */}
                        <circle
                            cx="120"
                            cy="120"
                            r="100"
                            stroke="#374151"
                            strokeWidth="20"
                            fill="none"
                        />
                        {/* Progress circle */}
                        <circle
                            cx="120"
                            cy="120"
                            r="100"
                            stroke={totalScore > 60 ? '#ef4444' : totalScore > 30 ? '#f97316' : '#10b981'}
                            strokeWidth="20"
                            fill="none"
                            strokeDasharray={`${scorePercent * 6.28} ${628 - scorePercent * 6.28}`}
                            strokeLinecap="round"
                            className="transition-all duration-1000"
                        />
                    </svg>
                    {/* Score Display */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <div className={`text-6xl font-bold ${colors.text}`}>
                            {totalScore.toFixed(0)}
                        </div>
                        <div className="text-slate-400 text-sm mt-1">out of 100</div>
                    </div>
                </div>
            </div>

            {/* Score Breakdown */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-slate-300 text-sm">🌲 NDVI Score</span>
                        <span className="text-white font-bold">{risk.ndviScore.toFixed(1)}/20</span>
                    </div>
                    <div className="w-full bg-slate-600 rounded-full h-2">
                        <div
                            className="bg-green-500 h-2 rounded-full transition-all"
                            style={{ width: `${(risk.ndviScore / 20) * 100}%` }}
                        />
                    </div>
                </div>

                <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-slate-300 text-sm">🌳 Deforestation</span>
                        <span className="text-white font-bold">{risk.deforestationScore.toFixed(1)}/25</span>
                    </div>
                    <div className="w-full bg-slate-600 rounded-full h-2">
                        <div
                            className="bg-orange-500 h-2 rounded-full transition-all"
                            style={{ width: `${(risk.deforestationScore / 25) * 100}%` }}
                        />
                    </div>
                </div>

                <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-slate-300 text-sm">🌊 Flood Risk</span>
                        <span className="text-white font-bold">{risk.floodScore.toFixed(1)}/25</span>
                    </div>
                    <div className="w-full bg-slate-600 rounded-full h-2">
                        <div
                            className="bg-blue-500 h-2 rounded-full transition-all"
                            style={{ width: `${(risk.floodScore / 25) * 100}%` }}
                        />
                    </div>
                </div>

                <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-slate-300 text-sm">🌫️ Air Quality</span>
                        <span className="text-white font-bold">{risk.aqiScore.toFixed(1)}/30</span>
                    </div>
                    <div className="w-full bg-slate-600 rounded-full h-2">
                        <div
                            className="bg-purple-500 h-2 rounded-full transition-all"
                            style={{ width: `${(risk.aqiScore / 30) * 100}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* interpretation */}
            <div className={`p-4 rounded-lg border ${colors.bg}/10 ${colors.ring}/30 border`}>
                <p className={`font-bold  mb-2 ${colors.text}`}>
                    {risk.riskLevel === 'SAFE' && '✅ Environment is in good condition'}
                    {risk.riskLevel === 'MODERATE' && '⚠️ Moderate environmental concerns detected'}
                    {risk.riskLevel === 'HIGH_RISK' && '🚨 High environmental risk - action required'}
                </p>
                <p className="text-slate-300 text-sm">
                    {risk.riskLevel === 'SAFE' && 'All environmental parameters are within acceptable ranges. Continue monitoring.'}
                    {risk.riskLevel === 'MODERATE' && 'Some environmental parameters show concerning trends. Increased monitoring recommended.'}
                    {risk.riskLevel === 'HIGH_RISK' && 'Multiple environmental factors indicate significant risk. Immediate assessment and mitigation measures recommended.'}
                </p>
            </div>

            {/* Detailed Measurements */}
            <div className="mt-6 p-4 rounded-lg bg-slate-700/30 border border-slate-600">
                <h4 className="text-white font-bold mb-3 flex items-center">
                    <span className="text-lg mr-2">📏</span>
                    Raw Measurement Details
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                        <div className="text-slate-400">NDVI Value</div>
                        <div className="text-white font-mono font-bold">
                            {latestData.ndviValue !== undefined && latestData.ndviValue !== null ? latestData.ndviValue.toFixed(4) : 'N/A'}
                        </div>
                    </div>
                    <div>
                        <div className="text-slate-400">NDVI Change</div>
                        <div className={`font-mono font-bold ${latestData.ndviChangePercent && latestData.ndviChangePercent < 0
                            ? 'text-red-400'
                            : 'text-green-400'
                            }`}>
                            {latestData.ndviChangePercent !== undefined && latestData.ndviChangePercent !== null
                                ? `${latestData.ndviChangePercent > 0 ? '+' : ''}${latestData.ndviChangePercent.toFixed(2)}%`
                                : 'N/A'}
                        </div>
                    </div>
                    <div>
                        <div className="text-slate-400">Previous NDVI</div>
                        <div className="text-white font-mono">
                            {latestData.previousNdvi !== undefined && latestData.previousNdvi !== null ? latestData.previousNdvi.toFixed(4) : 'N/A'}
                        </div>
                    </div>
                    <div>
                        <div className="text-slate-400">NDWI Value</div>
                        <div className="text-blue-400 font-mono font-bold">
                            {latestData.ndwiValue !== undefined && latestData.ndwiValue !== null ? latestData.ndwiValue.toFixed(4) : 'N/A'}
                        </div>
                    </div>
                    <div>
                        <div className="text-slate-400">Flood Risk %</div>
                        <div className="text-blue-400 font-mono font-bold">
                            {latestData.floodRisk !== undefined && latestData.floodRisk !== null ? `${latestData.floodRisk.toFixed(2)}%` : 'N/A'}
                        </div>
                    </div>
                    <div>
                        <div className="text-slate-400">Air Quality Index</div>
                        <div className={`font-mono font-bold ${latestData.airQualityIndex > 200 ? 'text-red-400' :
                            latestData.airQualityIndex > 100 ? 'text-orange-400' :
                                latestData.airQualityIndex > 50 ? 'text-yellow-400' : 'text-green-400'
                            }`}>
                            {latestData.airQualityIndex !== undefined && latestData.airQualityIndex !== null ? latestData.airQualityIndex.toFixed(0) : 'N/A'}
                        </div>
                    </div>
                    <div>
                        <div className="text-slate-400">PM2.5 Level</div>
                        <div className="text-purple-400 font-mono">
                            {latestData.pm25Level !== undefined && latestData.pm25Level !== null ? `${latestData.pm25Level.toFixed(1)} µg/m³` : 'N/A'}
                        </div>
                    </div>
                    <div>
                        <div className="text-slate-400">Temperature</div>
                        <div className="text-orange-400 font-mono">
                            {latestData.temperature !== undefined && latestData.temperature !== null ? `${latestData.temperature.toFixed(1)}°C` : 'N/A'}
                        </div>
                    </div>
                </div>
            </div>

            {/* Last Updated */}
            <div className="mt-4 pt-4 border-t border-slate-700 flex items-center justify-between">
                <p className="text-slate-500 text-xs">
                    Last calculated: {new Date(risk.calculationDate).toLocaleString()}
                </p>
                <p className="text-slate-500 text-xs">
                    Source: Sentinel-2 & Open-Meteo
                </p>
            </div>
        </div>
    );
}

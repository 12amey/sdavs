import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { satelliteApi } from '../services/api';
import { INDIAN_CITIES, City } from '../utils/indianCities';

export default function CountryHealthSummary() {
    const { data: satelliteData, isLoading } = useQuery({
        queryKey: ['all-satellite-data'],
        queryFn: () => satelliteApi.getSatelliteData(8.0, 38.0, 68.0, 98.0)
    });

    const summary = useMemo(() => {
        const regionalStats: Record<string, { totalScore: number; count: number; highRiskCities: string[] }> = {
            'North': { totalScore: 0, count: 0, highRiskCities: [] },
            'South': { totalScore: 0, count: 0, highRiskCities: [] },
            'West': { totalScore: 0, count: 0, highRiskCities: [] },
            'East': { totalScore: 0, count: 0, highRiskCities: [] },
            'Central': { totalScore: 0, count: 0, highRiskCities: [] },
            'Northeast': { totalScore: 0, count: 0, highRiskCities: [] },
            'Special': { totalScore: 0, count: 0, highRiskCities: [] }
        };

        // Initialize with all cities from metadata
        const cityDataMap = new Map<string, any>();
        
        // Fill Map with real data if available
        satelliteData?.forEach((d: any) => {
            const cityName = d.city || d.locationName;
            if (cityName && !cityDataMap.has(cityName)) {
                cityDataMap.set(cityName, d);
            }
        });

        // Loop through all defined cities to ensure full coverage
        INDIAN_CITIES.forEach((city: City) => {
            // Try matching by full display name, then by base name
            const realData = cityDataMap.get(city.displayName) || cityDataMap.get(city.name);
            
            if (realData) {
                const ndvi = Number(realData.ndviValue) || 0;
                const flooding = Number(realData.floodRisk) || 0;
                const aqi = Number(realData.airQualityIndex) || 2; // Default to moderate if null
                
                // Comprehensive Health Score: NDVI (40%) + Flood Safety (30%) + Air Quality (30%)
                // AQI is 1-5 (1 best, 5 worst). Map to 0-100 score where 100 is best.
                const aqiScore = (5 - aqi) * 20 + 20; 
                const score = (ndvi * 100) * 0.4 + (100 - flooding) * 0.3 + aqiScore * 0.3;

                const region = city.region || 'Central';
                regionalStats[region].totalScore += score;
                regionalStats[region].count += 1;
                
                if (score < 40) {
                    regionalStats[region].highRiskCities.push(city.name);
                }
            }
        });

        const regions = Object.entries(regionalStats).map(([name, stat]) => ({
            name,
            score: stat.count > 0 ? Math.round(stat.totalScore / stat.count) : 50,
            highRiskCount: stat.highRiskCities.length,
            status: stat.count > 0 ? (stat.totalScore / stat.count > 70 ? 'Optimal' : stat.totalScore / stat.count > 45 ? 'Stable' : 'Critical') : 'Unknown'
        }));

        const nationalScore = Math.round(regions.reduce((acc, r) => acc + r.score, 0) / regions.length);

        return { regions, nationalScore };
    }, [satelliteData]);

    if (isLoading) return <div className="animate-pulse bg-slate-800/50 h-48 rounded-xl border border-slate-700"></div>;

    const getStatusColor = (status: string) => {
        if (status === 'Optimal') return 'text-green-400 border-green-500/30 bg-green-500/10';
        if (status === 'Stable') return 'text-blue-400 border-blue-500/30 bg-blue-500/10';
        return 'text-red-400 border-red-500/30 bg-red-500/10';
    };

    return (
        <div className="bg-slate-800/40 backdrop-blur-2xl shadow-3xl rounded-3xl border border-slate-700/50 p-10 mb-8 overflow-hidden relative group">
            {/* Background Gradient Glow */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl -mr-48 -mt-48 transition-all group-hover:bg-blue-500/10"></div>
            
            <div className="flex flex-col lg:flex-row items-center gap-12 relative z-10">
                {/* National Score Circle */}
                <div className="flex-shrink-0 text-center">
                    <div className="relative inline-flex items-center justify-center p-1 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 shadow-xl">
                        <svg className="w-40 h-40 transform -rotate-90">
                            <circle
                                cx="80" cy="80" r="74"
                                className="stroke-current text-slate-700"
                                strokeWidth="8" fill="transparent"
                            />
                            <circle
                                cx="80" cy="80" r="74"
                                className={`stroke-current ${summary.nationalScore > 70 ? 'text-green-500' : summary.nationalScore > 45 ? 'text-blue-500' : 'text-red-500'}`}
                                strokeWidth="8"
                                strokeDasharray={2 * Math.PI * 74}
                                strokeDashoffset={2 * Math.PI * 74 * (1 - summary.nationalScore / 100)}
                                strokeLinecap="round"
                                fill="transparent"
                            />
                        </svg>
                        <div className="absolute flex flex-col items-center">
                            <span className="text-4xl font-black text-white">{summary.nationalScore}</span>
                            <span className="text-[10px] uppercase tracking-tighter text-slate-400 font-bold">India Health Index</span>
                        </div>
                    </div>
                </div>

                {/* Regional Breakdown */}
                <div className="flex-grow grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 w-full">
                    {summary.regions.map((region) => (
                        <div key={region.name} className={`p-4 rounded-xl border transition-all hover:scale-105 group/card ${getStatusColor(region.status)}`}>
                            <div className="text-[10px] uppercase font-black opacity-60 mb-1">{region.name}</div>
                            <div className="text-2xl font-black mb-1">{region.score}</div>
                            <div className="text-[9px] font-bold py-0.5 px-1.5 rounded bg-white/5 inline-block border border-white/10">
                                {region.status}
                            </div>
                            
                            {/* Alert indicator for critical zones */}
                            {region.status === 'Critical' && (
                                <div className="mt-2 flex items-center gap-1 animate-pulse">
                                    <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                                    <span className="text-[9px] font-black uppercase">High Risk</span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Sub-header with pulse */}
            <div className="mt-8 flex flex-col md:flex-row items-center justify-between border-t border-slate-700/50 pt-8 text-sm gap-4">
                <div className="flex flex-wrap items-center gap-6">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.4)]"></div>
                        <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Orbital Sync Active</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.4)]"></div>
                        <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Sentinel-2 Platform Online</span>
                    </div>
                </div>
                <div className="text-[10px] font-black uppercase text-slate-600 tracking-[0.3em]">
                    Department of Environmental Protection • National Monitoring Service
                </div>
            </div>
        </div>
    );
}

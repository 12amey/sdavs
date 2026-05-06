import { useQuery } from '@tanstack/react-query';
import { satelliteApi } from '../services/api';
import { useMemo } from 'react';

interface FloodWarningPanelProps {
    cityName: string;
}

export function FloodWarningPanel({ cityName }: FloodWarningPanelProps) {
    const { data: satelliteData, isLoading } = useQuery({
        queryKey: ['satellite-flood', cityName],
        queryFn: async () => {
            const allData = await satelliteApi.getSatelliteData(0, 90, -180, 180);
            return allData.filter((d: any) => d.city === cityName || d.locationName === cityName)
                .sort((a: any, b: any) => new Date(b.analysisDate).getTime() - new Date(a.analysisDate).getTime());
        },
        enabled: !!cityName,
        retry: false
    });



    if (isLoading) {
        return (
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
                <div className="flex items-center justify-center">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="ml-3 text-slate-300">Loading flood risk data...</span>
                </div>
            </div>
        );
    }

    const latestData = satelliteData?.[0] || {};
    const hasRealData = latestData.floodRisk !== undefined && latestData.floodRisk !== null && latestData.ndviValue !== 0;
    
    const floodRisk = hasRealData ? latestData.floodRisk : 0;
    const ndviValue = hasRealData ? latestData.ndviValue : 0;

    const getSurfaceStatus = (ndvi: number) => {
        if (ndvi < 0.1) return { label: 'Water / Wetland', color: 'text-blue-400', icon: '💧' };
        if (ndvi < 0.3) return { label: 'Saturated Soil', color: 'text-cyan-400', icon: '🌫️' };
        return { label: 'Dry Surface', color: 'text-emerald-400', icon: '🏜️' };
    };

    const surfaceStatus = getSurfaceStatus(ndviValue);

    const getRiskLevel = (risk: number) => {
        if (risk < 30) return { level: 'LOW', color: 'green', message: 'Low flood risk. Normal conditions.' };
        if (risk < 60) return { level: 'MODERATE', color: 'yellow', message: 'Moderate flood risk. Stay alert.' };
        return { level: 'HIGH', color: 'red', message: 'High flood risk. Take precautions.' };
    };

    const riskInfo = getRiskLevel(floodRisk);
    const colorClasses = {
        green: { bg: 'bg-green-500/20', border: 'border-green-500', text: 'text-green-400', progress: 'bg-green-500' },
        yellow: { bg: 'bg-yellow-500/20', border: 'border-yellow-500', text: 'text-yellow-400', progress: 'bg-yellow-500' },
        red: { bg: 'bg-red-500/20', border: 'border-red-500', text: 'text-red-400', progress: 'bg-red-500' }
    };
    const colors = colorClasses[riskInfo.color as keyof typeof colorClasses];

    return (
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-xl font-bold text-white flex items-center">
                        <span className="text-2xl mr-2">🌊</span>
                        </h3>
                    {!hasRealData && (
                        <span className="text-[10px] font-bold text-slate-500 bg-white/5 px-1.5 py-0.5 rounded border border-white/10 mt-1 inline-block">
                            NO LIVE DATA
                        </span>
                    )}
                </div>
                <div className={`px-4 py-2 rounded-lg border ${colors.bg} ${colors.border}`}>
                    <div className={`text-lg font-bold ${colors.text}`}>
                        {riskInfo.level}
                    </div>
                </div>
            </div>

            {/* Risk Percentage */}
            <div className="text-center mb-6">
                <div className={`inline-block px-8 py-6 rounded-xl ${colors.bg} border-2 ${colors.border}`}>
                    <div className="text-sm opacity-80 mb-2">Flood Probability</div>
                    <div className={`text-6xl font-bold ${colors.text}`}>{Math.round(floodRisk)}%</div>
                </div>
                <p className="text-slate-400 text-sm mt-3">{riskInfo.message}</p>
            </div>

            {/* Progress Bar */}
            <div className="mb-6">
                <div className="flex justify-between text-sm text-slate-400 mb-2">
                    <span>Risk Level</span>
                    <span>{Math.round(floodRisk)}%</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-4 overflow-hidden">
                    <div
                        className={`h-full ${colors.progress} transition-all duration-500`}
                        style={{ width: `${Math.min(floodRisk, 100)}%` }}
                    ></div>
                </div>
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                    <span>0% (Safe)</span>
                    <span>100% (Critical)</span>
                </div>
            </div>

            {/* Surface Status Indicator */}
            <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-5 mb-4 group transition-all hover:border-blue-500/50">
                <div className="flex justify-between items-start mb-3">
                    <div className="text-slate-400 text-sm uppercase tracking-wider font-bold">Surface Condition</div>
                    <div className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border border-current ${surfaceStatus.color} bg-white/5`}>
                        {surfaceStatus.label}
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-3xl">{surfaceStatus.icon}</div>
                    <div>
                        <div className="flex items-baseline mb-1">
                            <span className="text-3xl font-black text-white">{ndviValue.toFixed(4)}</span>
                            <span className="ml-2 text-slate-500 text-[10px] font-bold uppercase tracking-widest">Health Index</span>
                        </div>
                        <p className="text-slate-400 text-[11px] font-medium leading-tight">
                            {ndviValue < 0.1 && 'Substantial water presence or heavy inundation detected.'}
                            {ndviValue >= 0.1 && ndviValue < 0.3 && 'Moist conditions with sparse vegetation cover.'}
                            {ndviValue >= 0.3 && 'Well-drained surface with healthy plant growth.'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Info Box */}
            <div className={`p-4 rounded-lg border ${colors.bg} ${colors.border}`}>
                <h4 className={`font-bold text-sm mb-2 ${colors.text}`}>How Flood Risk is Calculated</h4>
                <p className="text-slate-300 text-xs">
                    Flood risk is calculated using NDVI patterns and water index analysis.
                    Low NDVI values (especially negative) indicate water presence.
                    Sudden vegetation loss may also indicate flooding.
                </p>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-700">
                <p className="text-slate-500 text-xs">
                    Last updated: {hasRealData ? new Date(latestData.analysisDate).toLocaleString() : 'N/A'}
                </p>
            </div>
        </div>
    );
}

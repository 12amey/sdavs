import { useQuery } from '@tanstack/react-query';
import { satelliteApi } from '../services/api';
import { useMemo } from 'react';

interface DeforestationPanelProps {
    cityName: string;
}

export function DeforestationPanel({ cityName }: DeforestationPanelProps) {
    const { data: satelliteData, isLoading } = useQuery({
        queryKey: ['satellite-deforestation', cityName],
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
                    <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="ml-3 text-slate-300">Loading deforestation data...</span>
                </div>
            </div>
        );
    }

    const latestData = satelliteData?.[0] || {};
    const hasRealData = latestData.deforestationRisk !== undefined && latestData.deforestationRisk !== null && latestData.ndviValue !== 0;
    
    const defRisk = hasRealData ? latestData.deforestationRisk : 'LOW';
    const ndviValue = hasRealData ? latestData.ndviValue : 0;

    const getVegetationStatus = (ndvi: number) => {
        if (ndvi > 0.6) return { label: 'Lush Canopy', color: 'text-green-400', desc: 'Dense, healthy forest cover' };
        if (ndvi > 0.4) return { label: 'Healthy Vegetation', color: 'text-emerald-400', desc: 'Active growing vegetation' };
        if (ndvi > 0.2) return { label: 'Sparse / Urban', color: 'text-yellow-400', desc: 'Limited vegetation or building density' };
        return { label: 'Arid / Non-Vegetated', color: 'text-orange-400', desc: 'Dry surface or no plant life detected' };
    };

    const vegStatus = getVegetationStatus(ndviValue);

    const getRiskColor = (risk: string) => {
        switch (risk) {
            case 'LOW': return { bg: 'bg-green-500/20', border: 'border-green-500', text: 'text-green-400', icon: '✅' };
            case 'MEDIUM': return { bg: 'bg-yellow-500/20', border: 'border-yellow-500', text: 'text-yellow-400', icon: '⚠️' };
            case 'HIGH': return { bg: 'bg-red-500/20', border: 'border-red-500', text: 'text-red-400', icon: '🚨' };
            default: return { bg: 'bg-slate-500/20', border: 'border-slate-500', text: 'text-slate-400', icon: 'ℹ️' };
        }
    };

    const colors = getRiskColor(defRisk);

    return (
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-xl font-bold text-white flex items-center">
                        <span className="text-2xl mr-2">🌳</span>
                        Deforestation Risk
                    </h3>
                    {!hasRealData && (
                        <span className="text-[10px] font-bold text-slate-500 bg-white/5 px-1.5 py-0.5 rounded border border-white/10 mt-1 inline-block">
                            NO LIVE DATA
                        </span>
                    )}
                </div>
                <div className={`px-4 py-2 rounded-lg border ${colors.bg} ${colors.border}`}>
                    <div className={`text-lg font-bold ${colors.text} flex items-center`}>
                        <span className="mr-2">{colors.icon}</span>
                        {defRisk}
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                {/* NDVI Change */}
                <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-5 group transition-all hover:border-emerald-500/50">
                    <div className="flex justify-between items-start mb-2">
                        <div className="text-slate-400 text-sm uppercase tracking-wider font-bold">Vegetation Health</div>
                        <div className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border border-current ${vegStatus.color} bg-white/5`}>
                            {vegStatus.label}
                        </div>
                    </div>
                    <div className="flex items-baseline mb-1">
                        <span className={`text-4xl font-black ${vegStatus.color}`}>
                            {(ndviValue * 100).toFixed(1)}%
                        </span>
                        <span className="ml-2 text-slate-500 text-xs font-bold uppercase">Index Density</span>
                    </div>
                    <p className="text-slate-400 text-xs font-medium italic">{vegStatus.desc}</p>
                </div>

                {/* Current vs Previous NDVI */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-4">
                        <div className="text-slate-400 text-[10px] uppercase font-bold mb-1">Raw Index</div>
                        <div className="text-xl font-black text-white">
                            {ndviValue.toFixed(4)}
                        </div>
                    </div>
                    <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-4">
                        <div className="text-slate-400 text-[10px] uppercase font-bold mb-1">Status</div>
                        <div className={`text-xl font-black ${hasRealData ? 'text-green-400' : 'text-slate-500'}`}>
                            {hasRealData ? 'REAL-TIME' : 'N/A'}
                        </div>
                    </div>
                </div>

                {/* Risk Assessment */}
                <div className={`p-4 rounded-lg border ${colors.bg} ${colors.border}`}>
                    <h4 className={`font-bold mb-2 ${colors.text}`}>Risk Assessment</h4>
                    <p className="text-slate-300 text-sm">
                        {latestData.deforestationRisk === 'HIGH' &&
                            'Significant vegetation loss detected (≥30% NDVI drop). Immediate investigation recommended.'}
                        {latestData.deforestationRisk === 'MEDIUM' &&
                            'Moderate vegetation loss detected (20-30% NDVI drop). Monitoring recommended.'}
                        {latestData.deforestationRisk === 'LOW' &&
                            'No significant vegetation loss detected. Vegetation appears stable or improving.'}
                    </p>
                </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-700">
                <p className="text-slate-500 text-xs">
                    Last comparison: {latestData.lastComparisonDate ? new Date(latestData.lastComparisonDate).toLocaleString() : 'N/A'}
                </p>
            </div>
        </div>
    );
}

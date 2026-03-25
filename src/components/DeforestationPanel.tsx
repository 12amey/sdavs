import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { satelliteApi } from '../services/api';

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

    const latestData = satelliteData?.[0];

    const getRiskColor = (risk: string) => {
        switch (risk) {
            case 'LOW': return { bg: 'bg-green-500/20', border: 'border-green-500', text: 'text-green-400', icon: '✅' };
            case 'MEDIUM': return { bg: 'bg-yellow-500/20', border: 'border-yellow-500', text: 'text-yellow-400', icon: '⚠️' };
            case 'HIGH': return { bg: 'bg-red-500/20', border: 'border-red-500', text: 'text-red-400', icon: '🚨' };
            default: return { bg: 'bg-slate-500/20', border: 'border-slate-500', text: 'text-slate-400', icon: 'ℹ️' };
        }
    };

    if (!latestData || !latestData.deforestationRisk) {
        return (
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
                <h3 className="text-xl font-bold text-white flex items-center mb-4">
                    <span className="text-2xl mr-2">🌳</span>
                    Deforestation Risk
                </h3>
                <p className="text-slate-400 text-center py-8">
                    No deforestation data available for {cityName}. Data will be available after the next scheduled update.
                </p>
            </div>
        );
    }

    const colors = getRiskColor(latestData.deforestationRisk);

    return (
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white flex items-center">
                    <span className="text-2xl mr-2">🌳</span>
                    Deforestation Risk
                </h3>
                <div className={`px-4 py-2 rounded-lg border ${colors.bg} ${colors.border}`}>
                    <div className={`text-lg font-bold ${colors.text} flex items-center`}>
                        <span className="mr-2">{colors.icon}</span>
                        {latestData.deforestationRisk}
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                {/* NDVI Change */}
                <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-4">
                    <div className="text-slate-400 text-sm mb-2">NDVI Change</div>
                    <div className="flex items-baseline">
                        <span className="text-3xl font-bold text-white">
                            {latestData.ndviChangePercent ? latestData.ndviChangePercent.toFixed(1) : '0.0'}%
                        </span>
                        {latestData.ndviChangePercent && latestData.ndviChangePercent < 0 && (
                            <span className="ml-2 text-red-400">↓ Vegetation loss</span>
                        )}
                        {latestData.ndviChangePercent && latestData.ndviChangePercent > 0 && (
                            <span className="ml-2 text-green-400">↑ Vegetation gain</span>
                        )}
                    </div>
                </div>

                {/* Current vs Previous NDVI */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-4">
                        <div className="text-slate-400 text-sm">Current NDVI</div>
                        <div className="text-2xl font-bold text-white">
                            {latestData.ndviValue ? latestData.ndviValue.toFixed(3) : 'N/A'}
                        </div>
                    </div>
                    <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-4">
                        <div className="text-slate-400 text-sm">Previous NDVI</div>
                        <div className="text-2xl font-bold text-white">
                            {latestData.previousNdvi ? latestData.previousNdvi.toFixed(3) : 'N/A'}
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

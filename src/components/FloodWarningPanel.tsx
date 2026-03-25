import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { satelliteApi } from '../services/api';

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

    const latestData = satelliteData?.[0];

    const getRiskLevel = (risk: number) => {
        if (risk < 30) return { level: 'LOW', color: 'green', message: 'Low flood risk. Normal conditions.' };
        if (risk < 60) return { level: 'MODERATE', color: 'yellow', message: 'Moderate flood risk. Stay alert.' };
        return { level: 'HIGH', color: 'red', message: 'High flood risk. Take precautions.' };
    };

    if (!latestData || latestData.floodRisk === null || latestData.floodRisk === undefined) {
        return (
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
                <h3 className="text-xl font-bold text-white flex items-center mb-4">
                    <span className="text-2xl mr-2">🌊</span>
                    Flood Risk Warning
                </h3>
                <p className="text-slate-400 text-center py-8">
                    No flood risk data available for {cityName}. Data will be available after the next scheduled update.
                </p>
            </div>
        );
    }

    const riskInfo = getRiskLevel(latestData.floodRisk);
    const colorClasses = {
        green: { bg: 'bg-green-500/20', border: 'border-green-500', text: 'text-green-400', progress: 'bg-green-500' },
        yellow: { bg: 'bg-yellow-500/20', border: 'border-yellow-500', text: 'text-yellow-400', progress: 'bg-yellow-500' },
        red: { bg: 'bg-red-500/20', border: 'border-red-500', text: 'text-red-400', progress: 'bg-red-500' }
    };
    const colors = colorClasses[riskInfo.color as keyof typeof colorClasses];

    return (
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white flex items-center">
                    <span className="text-2xl mr-2">🌊</span>
                    Flood Risk Warning
                </h3>
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
                    <div className={`text-6xl font-bold ${colors.text}`}>{Math.round(latestData.floodRisk)}%</div>
                </div>
                <p className="text-slate-400 text-sm mt-3">{riskInfo.message}</p>
            </div>

            {/* Progress Bar */}
            <div className="mb-6">
                <div className="flex justify-between text-sm text-slate-400 mb-2">
                    <span>Risk Level</span>
                    <span>{Math.round(latestData.floodRisk)}%</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-4 overflow-hidden">
                    <div
                        className={`h-full ${colors.progress} transition-all duration-500`}
                        style={{ width: `${Math.min(latestData.floodRisk, 100)}%` }}
                    ></div>
                </div>
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                    <span>0% (Safe)</span>
                    <span>100% (Critical)</span>
                </div>
            </div>

            {/* NDVI Indicator */}
            <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-4 mb-4">
                <div className="text-slate-400 text-sm mb-2">Current NDVI (Vegetation Health)</div>
                <div className="text-2xl font-bold text-white">
                    {latestData.ndviValue ? latestData.ndviValue.toFixed(3) : 'N/A'}
                </div>
                <p className="text-slate-400 text-xs mt-2">
                    {latestData.ndviValue && latestData.ndviValue < -0.1 && 'Water presence detected'}
                    {latestData.ndviValue && latestData.ndviValue >= -0.1 && latestData.ndviValue < 0.3 && 'Sparse vegetation or wet soil'}
                    {latestData.ndviValue && latestData.ndviValue >= 0.3 && 'Healthy vegetation'}
                </p>
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
                    Last updated: {new Date(latestData.analysisDate).toLocaleString()}
                </p>
            </div>
        </div>
    );
}

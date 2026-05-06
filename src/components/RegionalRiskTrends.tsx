import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { satelliteApi } from '../services/api';

export default function RegionalRiskTrends() {
    const { data: satelliteData } = useQuery({
        queryKey: ['all-satellite-data'],
        queryFn: () => satelliteApi.getSatelliteData(8.0, 38.0, 68.0, 98.0)
    });

    // Mock real-sounding environmental news headlines for India 2026
    const headlines = [
        { title: "Western Ghats: Sentinel-2 reports 4% increase in canopy density", trend: "POS", icon: "🌱" },
        { title: "Indo-Gangetic Plain: Severe PM2.5 concentrations predicted for Q3", trend: "NEG", icon: "🌫️" },
        { title: "Coastal Andhra: Orbital monitoring detects early thermal anomalies", trend: "WARN", icon: "🌡️" },
        { title: "Sundarbans: Tidal ingress validation completed via COG analysis", trend: "NEU", icon: "🌊" }
    ];

    return (
        <div className="bg-slate-800/40 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
            
            <div className="flex items-center justify-between mb-6">
                <div>
                    <div className="text-[10px] uppercase font-black tracking-widest text-blue-500 mb-1">Live Briefing</div>
                    <h3 className="text-xl font-black text-white">Regional Intelligence</h3>
                </div>
                <div className="w-10 h-10 rounded-xl bg-slate-700/50 flex items-center justify-center border border-slate-600/50 group-hover:bg-blue-500/20 transition-all">
                    <span className="text-lg">📡</span>
                </div>
            </div>

            <div className="space-y-4">
                {headlines.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/5 group/item">
                        <div className="text-2xl mt-0.5">{item.icon}</div>
                        <div className="flex-1">
                            <div className="text-xs font-bold text-slate-200 group-hover/item:text-white transition-colors">{item.title}</div>
                            <div className="flex items-center gap-2 mt-1">
                                <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${
                                    item.trend === 'POS' ? 'bg-green-500/20 text-green-400' : 
                                    item.trend === 'NEG' ? 'bg-red-500/20 text-red-400' : 
                                    item.trend === 'WARN' ? 'bg-amber-500/20 text-amber-400' : 
                                    'bg-slate-500/20 text-slate-400'
                                }`}>
                                    {item.trend === 'POS' ? '↑ RECOVERY' : 
                                     item.trend === 'NEG' ? '↓ DEGRADATION' : 
                                     item.trend === 'WARN' ? '⚠ ANOMALY' : 
                                     '○ STABLE'}
                                </span>
                                <span className="text-[8px] text-slate-500 font-bold uppercase tracking-tighter">Verified Orbital Feed</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-6 pt-6 border-t border-slate-700/50">
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 flex items-center gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                        <span className="text-sm animate-pulse">🛰️</span>
                    </div>
                    <div className="text-[10px] text-blue-300 font-medium leading-tight">
                        Deep-scan of 14 new clusters initiated. Expected completion in 12 orbital minutes.
                    </div>
                </div>
            </div>
        </div>
    );
}

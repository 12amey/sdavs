import React, { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { satelliteApi } from '../services/api';
import { getNearestAreaName, INDIAN_CITIES } from '../utils/indianCities';
import { getAIEstimatedMetrics } from '../utils/environmentalAI';

const PAGE_SIZE = 10;

function computeHealthScore(ndvi: number, flood: number, aqi?: number): number {
    const ndviScore = Math.min(100, ndvi * 200);          // 0-1 → 0-100, good above 0.5
    const floodScore = Math.max(0, 100 - flood);           // lower flood = better
    const aqiScore = aqi ? Math.max(0, 100 - (aqi / 5)) : 75; // rough AQI → score
    return Math.round(ndviScore * 0.45 + floodScore * 0.35 + aqiScore * 0.20);
}

function HealthBar({ score }: { score: number }) {
    const color = score >= 70 ? '#22c55e' : score >= 45 ? '#f59e0b' : '#ef4444';
    return (
        <div className="flex items-center gap-2">
            <div className="w-20 bg-white/10 rounded-full h-1.5 overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${score}%`, background: color }} />
            </div>
            <span className="text-xs font-black font-mono" style={{ color }}>{score}</span>
        </div>
    );
}

function NdviBar({ value }: { value: number }) {
    const pct = Math.min(100, value * 200);
    const color = value > 0.4 ? '#34d399' : value > 0.25 ? '#fbbf24' : '#f87171';
    return (
        <div>
            <div className="font-mono text-xs font-bold mb-1" style={{ color }}>{value.toFixed(4)}</div>
            <div className="w-16 bg-white/10 rounded-full h-1 overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
            </div>
        </div>
    );
}

function RiskBadge({ level }: { level: string }) {
    const styles: Record<string, React.CSSProperties> = {
        HIGH: { background: 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid rgba(239,68,68,0.35)' },
        MEDIUM: { background: 'rgba(245,158,11,0.12)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.35)' },
        LOW: { background: 'rgba(34,197,94,0.12)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.35)' },
    };
    return (
        <div className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-black uppercase" style={styles[level] || styles.LOW}>
            {level === 'HIGH' ? '🔴' : level === 'MEDIUM' ? '🟡' : '🟢'} {level}
        </div>
    );
}

export default function EnvironmentalIntelligenceLedger() {
    const [searchTerm, setSearchTerm] = useState('');
    const [regionFilter, setRegionFilter] = useState('All Regions');
    const [sourceFilter, setSourceFilter] = useState('All Sources');
    const [riskFilter, setRiskFilter] = useState('All Risks');
    const [sortCol, setSortCol] = useState<string>('healthScore');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
    const [page, setPage] = useState(1);
    const [lastRefreshed, setLastRefreshed] = useState(new Date());

    const { data: satelliteData, isLoading, refetch } = useQuery({
        queryKey: ['satelliteData-ledger'],
        queryFn: () => satelliteApi.getSatelliteData(0, 90, -180, 180),
        staleTime: 60000,
    });

    const handleRefresh = useCallback(async () => {
        await refetch();
        setLastRefreshed(new Date());
        setPage(1);
    }, [refetch]);

    const handleSort = (col: string) => {
        if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortCol(col); setSortDir('desc'); }
    };

    const enrichedData = useMemo(() => {
        if (!satelliteData) return [];
        return satelliteData.map((record: any) => {
            const fullDisplayName = getNearestAreaName(record.latitude, record.longitude);
            const cityName = fullDisplayName.split(' (')[0];
            const cityMeta = INDIAN_CITIES.find((c: any) => c.name === cityName || c.area === cityName);
            const region = (cityMeta as any)?.region || 'Other';
            
            // Raw data only - no AI estimates
            const ndvi = record.ndviValue || 0;
            const floodRisk = record.floodRisk || 0;
            const aqi = record.airQualityIndex;
            
            let riskLevel = 'LOW';
            if (ndvi < 0.35 || floodRisk > 50) riskLevel = 'HIGH';
            else if (ndvi < 0.5 || floodRisk > 25) riskLevel = 'MEDIUM';
            
            const healthScore = computeHealthScore(ndvi, floodRisk, aqi);
            const hasRealData = record.ndviValue !== 0 && record.ndviValue !== null;

            return {
                ...record, cityName, fullDisplayName, region, riskLevel,
                displayNdvi: ndvi, displayFlood: floodRisk, healthScore,
                source: hasRealData ? 'Satellite Live' : 'No Signal',
                isAiEntry: !hasRealData
            };
        });
    }, [satelliteData]);

    const filteredSorted = useMemo(() => {
        let data = enrichedData.filter(record => {
            const s = searchTerm.toLowerCase();
            const matchesSearch = !searchTerm ||
                record.id?.toString().includes(s) ||
                record.cityName.toLowerCase().includes(s) ||
                record.locationName?.toLowerCase().includes(s) ||
                record.region?.toLowerCase().includes(s);
            const matchesRegion = regionFilter === 'All Regions' || record.region === regionFilter;
            const matchesSource = sourceFilter === 'All Sources' || record.source === sourceFilter;
            const matchesRisk = riskFilter === 'All Risks' || record.riskLevel === riskFilter;
            return matchesSearch && matchesRegion && matchesSource && matchesRisk;
        });

        data = [...data].sort((a: any, b: any) => {
            const av = a[sortCol] ?? 0;
            const bv = b[sortCol] ?? 0;
            if (typeof av === 'string') return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
            return sortDir === 'asc' ? av - bv : bv - av;
        });
        return data;
    }, [enrichedData, searchTerm, regionFilter, sourceFilter, riskFilter, sortCol, sortDir]);

    const totalPages = Math.ceil(filteredSorted.length / PAGE_SIZE);
    const pageData = filteredSorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const stats = useMemo(() => {
        const high = enrichedData.filter(r => r.riskLevel === 'HIGH').length;
        const med = enrichedData.filter(r => r.riskLevel === 'MEDIUM').length;
        const low = enrichedData.filter(r => r.riskLevel === 'LOW').length;
        const avgHealth = enrichedData.length ? Math.round(enrichedData.reduce((s, r) => s + r.healthScore, 0) / enrichedData.length) : 0;
        const live = enrichedData.filter(r => !r.isAiEntry).length;
        const highRiskCities = [...new Set(enrichedData.filter(r => r.riskLevel === 'HIGH').map(r => r.cityName))].slice(0, 3);
        return { high, med, low, avgHealth, live, highRiskCities };
    }, [enrichedData]);

    const exportToCSV = () => {
        if (!filteredSorted.length) return;
        const csv = [
            ['ID', 'City', 'Region', 'NDVI', 'Flood Risk %', 'Health Score', 'Risk Level', 'Source', 'Date'],
            ...filteredSorted.map(r => [
                r.id, r.cityName, r.region,
                (Number(r.displayNdvi) || 0).toFixed(4), r.displayFlood,
                r.healthScore, r.riskLevel, r.source,
                r.analysisDate ? new Date(r.analysisDate).toISOString() : 'N/A'
            ])
        ].map(row => row.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url;
        a.download = `env-ledger-${new Date().toISOString().split('T')[0]}.csv`; a.click();
    };

    const SortIcon = ({ col }: { col: string }) => (
        <span className="ml-1" style={{ color: sortCol === col ? '#34d399' : 'rgba(148,163,184,0.3)' }}>
            {sortCol === col ? (sortDir === 'asc' ? '↑' : '↓') : '⇅'}
        </span>
    );

    if (isLoading) return (
        <div className="flex flex-col items-center justify-center h-[60vh]">
            <div className="relative w-20 h-20 mb-4">
                <div className="absolute inset-0 border-4 border-emerald-500/20 rounded-full" />
                <div className="absolute inset-0 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="text-slate-400 font-medium animate-pulse uppercase tracking-widest text-xs">Syncing Intelligence Ledger...</p>
        </div>
    );

    const regions = ['All Regions', ...new Set(INDIAN_CITIES.map((c: any) => c.region).filter(Boolean))];

    return (
        <div className="space-y-6 animate-in fade-in duration-700">
            {/* Header */}
            <div className="relative bg-slate-800/40 border border-slate-700/50 rounded-2xl p-7 backdrop-blur-xl overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -mr-32 -mt-32" />
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <span className="text-3xl">📒</span>
                            <h1 className="text-3xl font-black text-white tracking-tight uppercase">Intelligence Ledger</h1>
                        </div>
                        <p className="text-slate-400 text-sm max-w-2xl">
                            Environmental repository tracking <span className="text-emerald-400 font-bold">{enrichedData.length}</span> data points across India.
                            Last synced: <span className="text-cyan-400 font-mono">{lastRefreshed.toLocaleTimeString()}</span>
                        </p>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                        <button onClick={handleRefresh}
                            className="px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400">
                            ↺ Refresh
                        </button>
                        <button onClick={exportToCSV}
                            className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all flex items-center gap-2 text-white font-bold text-sm">
                            <span className="text-emerald-400">↓</span> Export CSV
                        </button>
                    </div>
                </div>
            </div>

            {/* Risk Distribution Bar */}
            <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 p-5">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-black uppercase tracking-widest text-slate-400">Risk Distribution</span>
                    <span className="text-xs text-slate-500">{enrichedData.length} total records</span>
                </div>
                <div className="flex rounded-lg overflow-hidden h-3 mb-3">
                    {[
                        { count: stats.high, color: '#ef4444' },
                        { count: stats.med, color: '#f59e0b' },
                        { count: stats.low, color: '#22c55e' },
                    ].map(({ count, color }, i) => {
                        const pct = enrichedData.length ? (count / enrichedData.length) * 100 : 0;
                        return <div key={i} style={{ width: `${pct}%`, background: color }} />;
                    })}
                </div>
                <div className="flex gap-6 text-[10px]">
                    {[
                        { label: 'Critical', count: stats.high, color: '#f87171' },
                        { label: 'Moderate', count: stats.med, color: '#fbbf24' },
                        { label: 'Healthy', count: stats.low, color: '#4ade80' },
                    ].map(({ label, count, color }) => (
                        <div key={label} className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                            <span className="text-slate-300 font-bold">{label}</span>
                            <span className="text-slate-500">({count})</span>
                        </div>
                    ))}
                    <div className="ml-auto flex items-center gap-1.5">
                        <span className="text-slate-500">Avg Health:</span>
                        <span className="font-black" style={{ color: stats.avgHealth >= 70 ? '#4ade80' : stats.avgHealth >= 45 ? '#fbbf24' : '#f87171' }}>
                            {stats.avgHealth}/100
                        </span>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-800/30 p-4 rounded-xl border border-slate-700/50">
                <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">🔍</span>
                    <input type="text" placeholder="Search city, region, ID..."
                        value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                        className="w-full bg-slate-900/50 border border-slate-700 rounded-lg pl-9 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 text-sm" />
                </div>
                {[
                    { value: regionFilter, onChange: (v: string) => { setRegionFilter(v); setPage(1); }, options: regions },
                    { value: sourceFilter, onChange: (v: string) => { setSourceFilter(v); setPage(1); }, options: ['All Sources', 'Satellite Live', 'AI Analysis'] },
                    { value: riskFilter, onChange: (v: string) => { setRiskFilter(v); setPage(1); }, options: ['All Risks', 'LOW', 'MEDIUM', 'HIGH'] },
                ].map((sel, i) => (
                    <div key={i} className="relative">
                        <select value={sel.value} onChange={(e) => sel.onChange(e.target.value)}
                            className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500/50 text-sm appearance-none cursor-pointer">
                            {sel.options.map(o => <option key={o} value={o} className="bg-slate-800 text-white">{o}</option>)}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 text-xs">▼</div>
                    </div>
                ))}
            </div>

            {/* Table */}
            <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl overflow-hidden backdrop-blur-md">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/5 border-b border-white/10">
                                {[
                                    { label: 'Ref ID', col: 'id' },
                                    { label: 'Location', col: 'fullDisplayName' },
                                    { label: 'Source', col: 'source' },
                                    { label: 'Risk', col: 'riskLevel' },
                                    { label: 'NDVI', col: 'displayNdvi' },
                                    { label: 'Flood %', col: 'displayFlood' },
                                    { label: 'Health Score', col: 'healthScore' },
                                    { label: 'Timestamp', col: 'analysisDate' },
                                ].map(({ label, col }) => (
                                    <th key={col} className="py-4 px-5 text-slate-400 font-black uppercase tracking-widest text-[10px] cursor-pointer hover:text-white transition-colors select-none"
                                        onClick={() => handleSort(col)}>
                                        {label}<SortIcon col={col} />
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {pageData.length > 0 ? pageData.map((record: any) => (
                                <tr key={record.id} className="group hover:bg-white/4 transition-all">
                                    <td className="py-4 px-5">
                                        <span className="font-mono text-xs text-slate-500 group-hover:text-emerald-400 transition-colors">#{record.id}</span>
                                    </td>
                                    <td className="py-4 px-5">
                                        <div className="text-white font-bold text-sm leading-tight">{record.fullDisplayName}</div>
                                        <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wide mt-0.5">
                                            {record.region} · {record.latitude?.toFixed(2)}, {record.longitude?.toFixed(2)}
                                        </div>
                                    </td>
                                    <td className="py-4 px-5">
                                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black uppercase ${record.isAiEntry ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                                            <span className={record.isAiEntry ? 'animate-pulse' : ''}>{record.isAiEntry ? '✨' : '🛰️'}</span>
                                            {record.source}
                                        </div>
                                    </td>
                                    <td className="py-4 px-5"><RiskBadge level={record.riskLevel} /></td>
                                    <td className="py-4 px-5"><NdviBar value={record.displayNdvi} /></td>
                                    <td className="py-4 px-5">
                                        <div className="flex items-center gap-2">
                                            <div className="w-12 bg-white/10 rounded-full h-1 overflow-hidden">
                                                <div className="h-full bg-blue-400 rounded-full" style={{ width: `${Math.min(100, record.displayFlood)}%` }} />
                                            </div>
                                            <span className={`text-xs font-mono font-bold ${record.displayFlood > 40 ? 'text-blue-400' : 'text-slate-400'}`}>
                                                {record.displayFlood}%
                                            </span>
                                        </div>
                                    </td>
                                    <td className="py-4 px-5"><HealthBar score={record.healthScore} /></td>
                                    <td className="py-4 px-5">
                                        <div className="text-white text-xs">{record.analysisDate ? new Date(record.analysisDate).toLocaleDateString() : '—'}</div>
                                        <div className="text-slate-500 text-[10px]">{record.analysisDate ? new Date(record.analysisDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={8} className="py-20 text-center">
                                        <div className="text-6xl mb-4 grayscale opacity-20">📂</div>
                                        <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">No records match the current filters</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="bg-white/5 px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-3 border-t border-white/10">
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">
                        Showing {Math.min(filteredSorted.length, (page - 1) * PAGE_SIZE + 1)}–{Math.min(filteredSorted.length, page * PAGE_SIZE)} of {filteredSorted.length} records
                    </p>
                    <div className="flex gap-1.5 items-center flex-wrap">
                        <button onClick={() => setPage(1)} disabled={page === 1}
                            className="px-3 py-2 rounded-lg text-xs font-bold uppercase transition-all bg-white/5 border border-white/10 text-slate-500 disabled:opacity-30 hover:bg-white/10 hover:text-white">
                            «
                        </button>
                        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                            className="px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all bg-white/5 border border-white/10 text-slate-400 disabled:opacity-30 hover:bg-white/10 hover:text-white">
                            ‹ Prev
                        </button>
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            const start = Math.max(1, Math.min(page - 2, totalPages - 4));
                            const p = start + i;
                            if (p > totalPages) return null;
                            return (
                                <button key={p} onClick={() => setPage(p)}
                                    className="px-3 py-2 rounded-lg text-xs font-bold transition-all"
                                    style={p === page
                                        ? { background: 'rgba(52,211,153,0.15)', color: '#34d399', border: '1px solid rgba(52,211,153,0.35)' }
                                        : { background: 'rgba(255,255,255,0.05)', color: 'rgba(148,163,184,0.7)', border: '1px solid rgba(255,255,255,0.08)' }
                                    }>
                                    {p}
                                </button>
                            );
                        })}
                        <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages || totalPages === 0}
                            className="px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all bg-white/5 border border-white/10 text-slate-400 disabled:opacity-30 hover:bg-white/10 hover:text-white">
                            Next ›
                        </button>
                        <button onClick={() => setPage(totalPages)} disabled={page === totalPages || totalPages === 0}
                            className="px-3 py-2 rounded-lg text-xs font-bold uppercase transition-all bg-white/5 border border-white/10 text-slate-500 disabled:opacity-30 hover:bg-white/10 hover:text-white">
                            »
                        </button>
                    </div>
                </div>
            </div>

            {/* Bottom Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { icon: '✅', label: 'Orbit Integrity', value: '100%', color: '#4ade80', border: 'rgba(34,197,94,0.3)' },
                    { icon: '🛰️', label: 'Live Coverage', value: `${stats.live}/${enrichedData.length}`, color: '#7dd3fc', border: 'rgba(59,130,246,0.3)' },
                    { icon: '✨', label: 'AI Synthesized', value: `${enrichedData.length - stats.live}`, color: '#c4b5fd', border: 'rgba(168,85,247,0.3)' },
                    { icon: '🚨', label: 'Critical Vectors', value: `${stats.high}`, color: '#f87171', border: 'rgba(239,68,68,0.3)', sub: stats.highRiskCities.join(', ') || 'None' },
                ].map(({ icon, label, value, color, border, sub }) => (
                    <div key={label} className="bg-slate-800/40 border border-slate-700/50 p-5 rounded-2xl hover:border-opacity-80 transition-all"
                        style={{ borderColor: border }}>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-1.5 rounded-lg text-lg" style={{ background: `${border.replace('0.3', '0.1')}` }}>{icon}</div>
                            <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest">{label}</span>
                        </div>
                        <div className="text-2xl font-black text-white">{value}</div>
                        {sub && <p className="text-[10px] text-slate-500 font-bold uppercase italic mt-0.5 truncate">{sub}</p>}
                    </div>
                ))}
            </div>
        </div>
    );
}

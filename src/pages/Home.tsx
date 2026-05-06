import { useState, useMemo, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { satelliteApi } from '../services/api';
import { Link } from 'react-router-dom';
import { generatePDFReport } from '../utils/pdfExport';
import CountryHealthSummary from '../components/CountryHealthSummary';
import { getNearestAreaName } from '../utils/indianCities';
import RegionalRiskTrends from '../components/RegionalRiskTrends';
import DailyIntelligenceNews from '../components/DailyIntelligenceNews';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081/api';

/* ─── Stat Card ────────────────────────────────────────────────────────── */
function StatCard({
    label, value, sub, accent='cyan', icon, delay = 0
}: {
    label: string; value: React.ReactNode; sub?: string;
    accent?: string; icon: string; delay?: number;
}) {
    const cardRef = useRef<HTMLDivElement>(null);
    const [tilt, setTilt] = useState({ x: 0, y: 0 });
    const [hovered, setHovered] = useState(false);

    const accentColors: Record<string, { text: string; glow: string; bg: string; border: string }> = {
        cyan:   { text: '#00d4ff', glow: 'rgba(0,212,255,0.25)', bg: 'rgba(0,212,255,0.08)', border: 'rgba(0,212,255,0.2)' },
        green:  { text: '#10b981', glow: 'rgba(16,185,129,0.25)', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)' },
        red:    { text: '#ef4444', glow: 'rgba(239,68,68,0.25)', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)' },
        amber:  { text: '#f59e0b', glow: 'rgba(245,158,11,0.25)', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)' },
        purple: { text: '#a855f7', glow: 'rgba(168,85,247,0.25)', bg: 'rgba(168,85,247,0.08)', border: 'rgba(168,85,247,0.2)' },
    };

    const c = accentColors[accent] || accentColors.cyan;

    const handleMouseMove = (e: React.MouseEvent) => {
        const rect = cardRef.current?.getBoundingClientRect();
        if (!rect) return;
        const x = ((e.clientY - rect.top) / rect.height - 0.5) * 12;
        const y = -((e.clientX - rect.left) / rect.width - 0.5) * 12;
        setTilt({ x, y });
    };

    return (
        <div
            ref={cardRef}
            className="relative rounded-2xl p-6 overflow-hidden animate-fadeInUp"
            style={{
                background: hovered ? c.bg : 'rgba(15, 24, 42, 0.7)',
                border: `1px solid ${hovered ? c.border : 'rgba(255,255,255,0.06)'}`,
                boxShadow: hovered ? `0 20px 60px rgba(0,0,0,0.5), 0 0 40px ${c.glow}` : '0 10px 40px rgba(0,0,0,0.3)',
                transform: hovered
                    ? `perspective(800px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateZ(10px)`
                    : 'perspective(800px) rotateX(0) rotateY(0)',
                transition: hovered ? 'box-shadow 0.3s, border 0.3s, background 0.3s, transform 0.15s ease-out' : 'all 0.4s ease',
                animationDelay: `${delay}ms`,
                cursor: 'default',
            }}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => { setHovered(false); setTilt({ x: 0, y: 0 }); }}
        >
            <div
                className="absolute top-0 left-0 right-0 h-px"
                style={{
                    background: hovered
                        ? `linear-gradient(90deg, transparent, ${c.text}, transparent)`
                        : 'transparent',
                    transition: 'all 0.3s',
                }}
            />

            <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                style={{
                    background: c.bg,
                    border: `1px solid ${c.border}`,
                    boxShadow: hovered ? `0 0 15px ${c.glow}` : 'none',
                    transition: 'all 0.3s',
                    fontSize: 18,
                }}
            >
                {icon}
            </div>

            <div className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'rgba(148,163,184,0.6)' }}>
                {label}
            </div>
            <div className="text-3xl font-black text-white mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                {value}
            </div>
            {sub && (
                <div className="text-[10px] font-semibold" style={{ color: c.text }}>
                    {sub}
                </div>
            )}
            {hovered && <div className="shimmer absolute inset-0 rounded-2xl" />}
        </div>
    );
}

/* ─── Nav Quick Link Card ──────────────────────────────────────────────── */
function QuickLink({ to, icon, label, accent, delay }: { to: string; icon: string; label: string; accent: string; delay: number }) {
    const [hovered, setHovered] = useState(false);

    const accentBg: Record<string, { bg: string; border: string; text: string }> = {
        indigo: { bg: 'rgba(99,102,241,0.1)', border: 'rgba(99,102,241,0.25)', text: '#6366f1' },
        green:  { bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.25)', text: '#10b981' },
        amber:  { bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)', text: '#f59e0b' },
        purple: { bg: 'rgba(168,85,247,0.1)', border: 'rgba(168,85,247,0.25)', text: '#a855f7' },
    };

    const c = accentBg[accent] || accentBg.indigo;

    return (
        <Link
            to={to}
            className="block rounded-2xl p-5 text-center transition-all duration-300 animate-fadeInUp"
            style={{
                background: hovered ? c.bg : 'rgba(15,24,42,0.5)',
                border: `1px solid ${hovered ? c.border : 'rgba(255,255,255,0.05)'}`,
                boxShadow: hovered ? `0 15px 40px rgba(0,0,0,0.4), 0 0 20px ${c.bg}` : 'none',
                transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
                animationDelay: `${delay}ms`,
            }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            <span
                className="text-2xl block mb-2 transition-all duration-300"
                style={{ transform: hovered ? 'scale(1.2)' : 'scale(1)', filter: hovered ? `drop-shadow(0 0 8px ${c.text})` : 'none' }}
            >
                {icon}
            </span>
            <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: hovered ? c.text : 'rgba(148,163,184,0.6)' }}>
                {label}
            </span>
        </Link>
    );
}

/* ─── Loading State ────────────────────────────────────────────────────── */
function HomeLoader() {
    return (
        <div className="flex flex-col items-center justify-center h-[65vh] gap-6">
            <div className="relative w-24 h-24">
                <div className="absolute inset-0 rounded-full border-2 border-cyan-500/20" />
                <div className="absolute inset-0 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
                <div className="absolute inset-4 rounded-full border border-indigo-500/30" />
                <div className="absolute inset-4 rounded-full border border-indigo-400 border-b-transparent animate-spin-reverse" />
                <div className="absolute inset-0 flex items-center justify-center">
                    <span style={{ fontSize: 24 }}>🛰️</span>
                </div>
            </div>
            <div>
                <p className="text-xs font-bold tracking-[0.4em] uppercase animate-pulse" style={{ color: 'rgba(0,212,255,0.7)' }}>
                    Initializing Sentinel Pulse
                </p>
                <p className="text-[10px] text-center mt-1 tracking-widest" style={{ color: 'rgba(148,163,184,0.4)' }}>
                    Calibrating orbital feeds...
                </p>
            </div>
        </div>
    );
}

/* ─── Main Home Component ──────────────────────────────────────────────── */
export default function Home() {
    const [isExporting, setIsExporting] = useState(false);

    const { data: satelliteData, isLoading } = useQuery({
        queryKey: ['satelliteData-home'],
        queryFn: () => satelliteApi.getSatelliteData(8.0, 38.0, 68.0, 98.0),
        refetchInterval: 60000 
    });

    const enrichedFeed = useMemo(() => {
        if (!satelliteData) return [];
        return satelliteData.slice(0, 10).map((record: any) => ({
            ...record,
            fullDisplayName: getNearestAreaName(record.latitude, record.longitude)
        }));
    }, [satelliteData]);

    const stats = useMemo(() => {
        if (!satelliteData) return { avgNdvi: '0.000', highRisk: 0, coverage: 0, total: 0 };
        const total = satelliteData.length;
        const recordsWithData = satelliteData.filter((r: any) => typeof r.ndviValue === 'number' && r.ndviValue > 0);
        const avg = recordsWithData.length > 0 
            ? recordsWithData.reduce((acc: number, curr: any) => acc + curr.ndviValue, 0) / recordsWithData.length
            : 0;
        const high = satelliteData.filter((r: any) =>
            (r.ndviValue && r.ndviValue < 0.35) || (r.floodRisk && r.floodRisk > 50)
        ).length;
        return {
            avgNdvi: (avg || 0).toFixed(3),
            highRisk: high,
            coverage: total > 0 ? Math.round((recordsWithData.length / total) * 100) : 0,
            total,
        };
    }, [satelliteData]);

    const handleExportPDF = async () => {
        setIsExporting(true);
        try { await generatePDFReport(); }
        catch (error) { console.error('PDF export failed:', error); }
        finally { setIsExporting(false); }
    };

    if (isLoading) return <HomeLoader />;

    return (
        <div className="space-y-8 animate-fadeIn">
            {/* Hero Header */}
            <div
                className="relative rounded-2xl p-8 overflow-hidden"
                style={{
                    background: 'linear-gradient(135deg, rgba(0,212,255,0.06) 0%, rgba(99,102,241,0.06) 50%, rgba(168,85,247,0.06) 100%)',
                    border: '1px solid rgba(0,212,255,0.15)',
                    boxShadow: '0 0 60px rgba(0,212,255,0.05)',
                }}
            >
                <div className="absolute top-0 right-0 w-80 h-80 pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(0,212,255,0.06) 0%, transparent 70%)' }} />
                <div className="absolute bottom-0 left-0 w-60 h-60 pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.06) 0%, transparent 70%)' }} />
                <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.4), rgba(168,85,247,0.4), transparent)' }} />

                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div>
                        <div className="section-label mb-3">National Environmental Command</div>
                        <h1 className="text-4xl xl:text-5xl font-black tracking-tight text-white leading-none mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                            Sentinel <span className="gradient-text">Pulse</span>
                        </h1>
                        <div className="flex items-center gap-2 mt-3">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" style={{ boxShadow: '0 0 8px #10b981', animation: 'pulse 2s infinite' }} />
                            <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: 'rgba(148,163,184,0.6)' }}>
                                Live Telemetry · {stats.total} Active Nodes
                            </span>
                        </div>
                    </div>

                    <button
                        onClick={handleExportPDF}
                        disabled={isExporting}
                        className="flex-shrink-0 px-6 py-3 rounded-xl text-sm font-bold flex items-center gap-3 transition-all duration-300 disabled:opacity-50"
                        style={{
                            background: 'rgba(255,255,255,0.06)',
                            border: '1px solid rgba(255,255,255,0.12)',
                            color: 'white',
                        }}
                    >
                        <span>{isExporting ? '⏳' : '📊'}</span>
                        <span>{isExporting ? 'Compiling Report...' : 'Export Intel Report'}</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                <div className="xl:col-span-2 space-y-8">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <StatCard label="Satellite Integrity" value={`${stats.coverage}%`} sub="Active coverage ratio" accent="cyan" icon="🛰️" delay={0} />
                        <StatCard label="Biosphere Vitality" value={stats.avgNdvi} sub="Avg national NDVI score" accent="green" icon="🌿" delay={100} />
                        <StatCard label="Anomalous Vectors" value={stats.highRisk} sub="High-impact alerts active" accent="red" icon="⚠️" delay={200} />
                    </div>

                    <CountryHealthSummary />

                    <div>
                        <div className="section-label mb-4">Quick Navigation</div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <QuickLink to="/map" icon="🗺️" label="Orbital Map" accent="indigo" delay={0} />
                            <QuickLink to="/environmental" icon="🌍" label="Eco Monitor" accent="green" delay={80} />
                            <QuickLink to="/data" icon="📒" label="Intel Ledger" accent="amber" delay={160} />
                            <QuickLink to="/ml" icon="🧠" label="Climate Hub" accent="purple" delay={240} />
                        </div>
                    </div>

                    <RegionalRiskTrends />
                </div>

                <div className="space-y-5">
                    <div className="rounded-2xl p-6" style={{ background: 'rgba(10, 16, 30, 0.85)', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(30px)' }}>
                        <DailyIntelligenceNews satelliteData={satelliteData || []} />
                    </div>

                    <div
                        className="rounded-2xl p-6 sticky top-20"
                        style={{
                            background: 'rgba(10, 16, 30, 0.85)',
                            border: '1px solid rgba(255,255,255,0.07)',
                            backdropFilter: 'blur(30px)',
                            maxHeight: 'calc(100vh - 120px)',
                            overflowY: 'auto',
                        }}
                    >
                        <div className="flex items-center justify-between mb-5">
                            <div>
                                <div className="section-label">Intelligence Stream</div>
                                <div className="text-white font-bold text-base mt-0.5">Live Telemetry</div>
                            </div>
                            <div className="relative w-8 h-8 flex items-center justify-center">
                                <div className="w-2 h-2 rounded-full bg-cyan-400" style={{ boxShadow: '0 0 8px #00d4ff' }} />
                                <div className="absolute inset-0 rounded-full border border-cyan-400/40 animate-ping" />
                            </div>
                        </div>

                        <div className="space-y-3">
                            {enrichedFeed.map((record: any, idx: number) => {
                                const ndvi = record.ndviValue || 0.456;
                                const isGood = ndvi > 0.4;
                                return (
                                    <div
                                        key={record.id}
                                        className="group relative rounded-xl p-4 transition-all duration-300 animate-fadeInUp"
                                        style={{
                                            background: 'rgba(255,255,255,0.03)',
                                            border: '1px solid rgba(255,255,255,0.05)',
                                            animationDelay: `${idx * 50}ms`,
                                        }}
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <div>
                                                <div className="text-white text-xs font-semibold leading-tight">{record.fullDisplayName}</div>
                                                <div className="text-[9px] font-mono mt-0.5" style={{ color: 'rgba(148,163,184,0.5)' }}>
                                                    {record.analysisDate ? new Date(record.analysisDate).toLocaleTimeString() : 'Recently'}
                                                </div>
                                            </div>
                                            <span
                                                className="text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full"
                                                style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }}
                                            >
                                                ⬡ LIVE
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[9px] font-bold uppercase tracking-wide" style={{ color: 'rgba(148,163,184,0.5)' }}>NDVI</span>
                                            <div className="flex-1 progress-bar">
                                                <div
                                                    className="progress-bar-fill transition-all"
                                                    style={{
                                                        width: `${Math.min(100, (Number(ndvi) || 0) * 200)}%`,
                                                        background: isGood
                                                            ? 'linear-gradient(90deg, #10b981, #06b6d4)'
                                                            : 'linear-gradient(90deg, #f59e0b, #ef4444)',
                                                    }}
                                                />
                                            </div>
                                            <span className="text-[10px] font-mono font-bold" style={{ color: isGood ? '#10b981' : '#f59e0b' }}>
                                                {(Number(ndvi) || 0).toFixed(3)}
                                            </span>
                                        </div>

                                        {record.riskLevel && record.riskLevel !== 'LOW' && (
                                            <div className="mt-2">
                                                <span className="badge badge-red">⚠ {record.riskLevel}</span>
                                            </div>
                                        )}

                                        <div className="absolute right-3 bottom-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Link to="/data" className="text-[9px] font-bold uppercase tracking-wider" style={{ color: '#00d4ff' }}>
                                                Audit →
                                            </Link>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <Link
                            to="/data"
                            className="block w-full text-center py-3 mt-4 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all duration-300"
                            style={{ background: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.15)', color: 'rgba(0,212,255,0.7)' }}
                        >
                            Access Full Historical Ledger →
                        </Link>
                    </div>
                </div>
            </div>

            <div className="rounded-2xl p-6 relative overflow-hidden" style={{ background: 'rgba(10,16,30,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="absolute inset-0 bg-grid opacity-20 pointer-events-none" />
                <div className="relative z-10 flex flex-wrap items-center justify-between gap-6">
                    <div className="section-label">Operational Readiness</div>
                    <div className="flex flex-wrap items-center gap-8">
                        {[
                            { label: 'Database Layer', status: 'Secure', color: '#10b981' },
                            { label: 'Spring API Cluster', status: 'Synchronized', color: '#00d4ff' },
                            { label: 'ML Analysis Engine', status: 'Optimal', color: '#a855f7' },
                            { label: 'Satellite Feeds', status: 'Active', color: '#f59e0b' },
                        ].map((item, i) => (
                            <div key={i} className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full" style={{ background: item.color, boxShadow: `0 0 6px ${item.color}` }} />
                                <div>
                                    <div className="text-white text-xs font-semibold">{item.status}</div>
                                    <div className="text-[9px] uppercase tracking-widest" style={{ color: 'rgba(148,163,184,0.4)' }}>{item.label}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

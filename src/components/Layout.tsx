import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect } from 'react';

interface NavItem {
    path: string;
    label: string;
    icon: string;
    accent: string;
    roles: string[];
}

const navItems: NavItem[] = [
    { path: '/', label: 'Command Center', icon: '⬡', accent: 'cyan', roles: ['admin', 'user'] },
    { path: '/map', label: 'Orbital Map', icon: '◎', accent: 'blue', roles: ['admin', 'user'] },
    { path: '/data', label: 'Intel Ledger', icon: '≡', accent: 'amber', roles: ['admin', 'user'] },
    { path: '/environmental', label: 'Eco Monitor', icon: '◐', accent: 'green', roles: ['admin', 'user'] },
    { path: '/ml', label: 'Climate Hub', icon: '⬟', accent: 'purple', roles: ['admin', 'user'] },
    { path: '/ai', label: 'AI Analysis', icon: '◈', accent: 'indigo', roles: ['admin', 'user'] },
    { path: '/status', label: 'Sys Status', icon: '⬡', accent: 'red', roles: ['admin'] },
];

const accentMap: Record<string, { bg: string; border: string; text: string; glow: string }> = {
    cyan:   { bg: 'rgba(0,212,255,0.12)', border: 'rgba(0,212,255,0.4)', text: '#00d4ff', glow: '0 0 20px rgba(0,212,255,0.3)' },
    blue:   { bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.4)', text: '#3b82f6', glow: '0 0 20px rgba(59,130,246,0.3)' },
    amber:  { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.4)', text: '#f59e0b', glow: '0 0 20px rgba(245,158,11,0.3)' },
    green:  { bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.4)', text: '#10b981', glow: '0 0 20px rgba(16,185,129,0.3)' },
    purple: { bg: 'rgba(168,85,247,0.12)', border: 'rgba(168,85,247,0.4)', text: '#a855f7', glow: '0 0 20px rgba(168,85,247,0.3)' },
    indigo: { bg: 'rgba(99,102,241,0.12)', border: 'rgba(99,102,241,0.4)', text: '#6366f1', glow: '0 0 20px rgba(99,102,241,0.3)' },
    red:    { bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.4)', text: '#ef4444', glow: '0 0 20px rgba(239,68,68,0.3)' },
};

export default function Layout({ children }: { children: React.ReactNode }) {
    const location = useLocation();
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [time, setTime] = useState(new Date());
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        const t = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(t);
    }, []);

    const isActive = (path: string) => location.pathname === path;
    const canAccess = (roles: string[]) => user && roles.includes(user.role || '');

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const accessibleItems = navItems.filter(item => canAccess(item.roles));

    return (
        <div className="min-h-screen flex" style={{ background: '#050a14', fontFamily: "'Inter', sans-serif" }}>
            {/* ── Background Orbs ─────────────────────────────────────── */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="orb orb-cyan" style={{ width: 600, height: 600, top: -200, left: -200 }} />
                <div className="orb orb-purple" style={{ width: 500, height: 500, bottom: -150, right: -150, animationDelay: '-4s' }} />
                <div className="orb orb-blue" style={{ width: 400, height: 400, top: '40%', left: '30%', animationDelay: '-8s' }} />
                <div className="bg-grid absolute inset-0 opacity-40" />
            </div>

            {/* ── Sidebar ──────────────────────────────────────────────── */}
            <aside
                className={`fixed left-0 top-0 bottom-0 z-50 flex flex-col transition-all duration-500 ease-out ${sidebarOpen ? 'w-64' : 'w-20'}`}
                style={{
                    background: 'rgba(5, 10, 20, 0.92)',
                    backdropFilter: 'blur(40px)',
                    borderRight: '1px solid rgba(255,255,255,0.06)',
                    boxShadow: '4px 0 40px rgba(0,0,0,0.4)',
                }}
                onMouseEnter={() => setSidebarOpen(true)}
                onMouseLeave={() => setSidebarOpen(false)}
            >
                {/* Logo */}
                <div className="flex items-center gap-3 px-4 py-6" style={{ minHeight: 80 }}>
                    <div
                        className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center relative"
                        style={{
                            background: 'linear-gradient(135deg, #00d4ff, #6366f1)',
                            boxShadow: '0 0 20px rgba(0,212,255,0.5)',
                        }}
                    >
                        <span className="text-lg">🛰️</span>
                        {/* Orbit ring */}
                        <div
                            className="absolute inset-0 rounded-xl border border-cyan-400/30"
                            style={{ animation: 'spin-slow 8s linear infinite' }}
                        />
                    </div>
                    {sidebarOpen && (
                        <div className="overflow-hidden">
                            <div className="text-white font-bold text-sm tracking-tight whitespace-nowrap font-display">
                                SDAVS
                            </div>
                            <div className="text-[10px] tracking-widest uppercase" style={{ color: 'rgba(0,212,255,0.7)' }}>
                                Sentinel Platform
                            </div>
                        </div>
                    )}
                </div>

                {/* Clock */}
                {sidebarOpen && (
                    <div className="px-4 pb-4">
                        <div className="rounded-xl p-3" style={{ background: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.1)' }}>
                            <div className="text-xs font-mono text-cyan-400">{time.toLocaleTimeString()}</div>
                            <div className="text-[10px] text-slate-500 mt-0.5">{time.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                        </div>
                    </div>
                )}

                <div className="divider mx-4 mb-2" />

                {/* Nav Items */}
                <nav className="flex-1 px-2 space-y-1 overflow-y-auto">
                    {accessibleItems.map(item => {
                        const active = isActive(item.path);
                        const accent = accentMap[item.accent];
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className="flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 group relative"
                                style={{
                                    background: active ? accent.bg : 'transparent',
                                    border: active ? `1px solid ${accent.border}` : '1px solid transparent',
                                    boxShadow: active ? accent.glow : 'none',
                                }}
                                title={!sidebarOpen ? item.label : undefined}
                            >
                                {/* Active indicator bar */}
                                {active && (
                                    <div
                                        className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 rounded-r"
                                        style={{ background: accent.text }}
                                    />
                                )}
                                {/* Icon */}
                                <span
                                    className="text-xl flex-shrink-0 transition-all duration-300 w-8 text-center"
                                    style={{
                                        color: active ? accent.text : 'rgba(148,163,184,0.6)',
                                        filter: active ? `drop-shadow(0 0 6px ${accent.text})` : 'none',
                                        fontSize: 16,
                                    }}
                                >
                                    {item.icon}
                                </span>
                                {/* Label */}
                                {sidebarOpen && (
                                    <span
                                        className="text-sm font-semibold whitespace-nowrap transition-all"
                                        style={{ color: active ? accent.text : 'rgba(226,232,240,0.65)' }}
                                    >
                                        {item.label}
                                    </span>
                                )}
                                {/* Hover highlight */}
                                {!active && (
                                    <div
                                        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
                                        style={{ background: 'rgba(255,255,255,0.04)' }}
                                    />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                <div className="divider mx-4 mt-2 mb-3" />

                {/* User Profile */}
                {user && (
                    <div className="px-3 pb-4 space-y-2">
                        <div
                            className="flex items-center gap-3 px-3 py-3 rounded-xl"
                            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
                        >
                            {/* Avatar */}
                            <div
                                className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
                                style={{ background: 'linear-gradient(135deg, #00d4ff, #6366f1)' }}
                            >
                                {user.username.charAt(0).toUpperCase()}
                            </div>
                            {sidebarOpen && (
                                <div className="min-w-0 flex-1">
                                    <div className="text-white text-xs font-semibold truncate">{user.username}</div>
                                    <div
                                        className="text-[9px] font-bold uppercase tracking-widest"
                                        style={{ color: user.role === 'admin' ? '#a855f7' : '#3b82f6' }}
                                    >
                                        {user.role}
                                    </div>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-300 group"
                            style={{
                                background: 'rgba(239,68,68,0.08)',
                                border: '1px solid rgba(239,68,68,0.2)',
                                color: 'rgba(239,68,68,0.8)',
                            }}
                            onMouseEnter={e => {
                                (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.15)';
                                (e.currentTarget as HTMLElement).style.color = '#ef4444';
                            }}
                            onMouseLeave={e => {
                                (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.08)';
                                (e.currentTarget as HTMLElement).style.color = 'rgba(239,68,68,0.8)';
                            }}
                        >
                            <span>⏻</span>
                            {sidebarOpen && <span>Sign Out</span>}
                        </button>
                    </div>
                )}
            </aside>

            {/* ── Main Content Area ───────────────────────────────────── */}
            <div className="flex-1 flex flex-col min-w-0 transition-all duration-500" style={{ marginLeft: 80 }}>
                {/* Top Bar */}
                <header
                    className="sticky top-0 z-40 flex items-center justify-between px-6 py-3"
                    style={{
                        background: 'rgba(5, 10, 20, 0.85)',
                        backdropFilter: 'blur(30px)',
                        borderBottom: '1px solid rgba(255,255,255,0.06)',
                        height: 60,
                    }}
                >
                    {/* Breadcrumb */}
                    <div className="flex items-center gap-2">
                        <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'rgba(0,212,255,0.5)' }}>
                            SDAVS
                        </div>
                        <span style={{ color: 'rgba(255,255,255,0.2)' }}>/</span>
                        <div className="text-sm font-semibold text-white">
                            {accessibleItems.find(i => isActive(i.path))?.label ?? 'Dashboard'}
                        </div>
                    </div>

                    {/* Right side */}
                    <div className="flex items-center gap-4">
                        {/* Live status */}
                        <div
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs"
                            style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}
                        >
                            <span
                                className="w-1.5 h-1.5 rounded-full inline-block"
                                style={{ background: '#10b981', boxShadow: '0 0 6px #10b981', animation: 'pulse 2s infinite' }}
                            />
                            <span className="text-emerald-400 font-semibold">Systems Nominal</span>
                        </div>

                        {/* Current page nav pills */}
                        <div className="hidden lg:flex items-center gap-1">
                            {accessibleItems.slice(0, 5).map(item => {
                                const active = isActive(item.path);
                                const accent = accentMap[item.accent];
                                return (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        className="px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all duration-300"
                                        style={{
                                            background: active ? accent.bg : 'transparent',
                                            color: active ? accent.text : 'rgba(148,163,184,0.6)',
                                            border: active ? `1px solid ${accent.border}` : '1px solid transparent',
                                        }}
                                    >
                                        {item.label}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 p-6 relative z-10">
                    {children}
                </main>

                {/* Footer */}
                <footer className="px-6 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                    <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(148,163,184,0.3)' }}>
                        <span>SDAVS — Satellite Data Analysis & Visualization System</span>
                        <div className="flex items-center gap-4">
                            <span>Spring Boot + React + Supabase</span>
                            <span style={{ color: 'rgba(255,255,255,0.1)' }}>•</span>
                            <span>v1.0.0</span>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    );
}

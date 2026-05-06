import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

/* Floating particle */
function Particle({ style }: { style: React.CSSProperties }) {
    return (
        <div
            className="absolute rounded-full pointer-events-none"
            style={{
                background: 'radial-gradient(circle, rgba(0,212,255,0.6), transparent 70%)',
                animation: `particle-float ${6 + Math.random() * 4}s ease-in-out infinite`,
                ...style,
            }}
        />
    );
}

const PARTICLES = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    style: {
        width: `${4 + Math.random() * 8}px`,
        height: `${4 + Math.random() * 8}px`,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        animationDelay: `${Math.random() * 8}s`,
        opacity: 0.3 + Math.random() * 0.5,
    },
}));

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [focused, setFocused] = useState<string | null>(null);
    const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
    const cardRef = useRef<HTMLDivElement>(null);
    const { login } = useAuth();
    const navigate = useNavigate();

    /* 3D tilt on mouse move */
    useEffect(() => {
        const handleMove = (e: MouseEvent) => {
            setMousePos({ x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight });
        };
        window.addEventListener('mousemove', handleMove);
        return () => window.removeEventListener('mousemove', handleMove);
    }, []);

    const tiltX = (mousePos.y - 0.5) * 10;
    const tiltY = (mousePos.x - 0.5) * -10;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!username || !password) {
            toast.error('Please enter both username and password');
            return;
        }
        setLoading(true);
        try {
            await login(username, password);
            toast.success('Access granted — Welcome back');
            navigate('/');
        } catch (error) {
            toast.error('Authentication failed. Check your credentials.');
            console.error('Login error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = () => {
        const baseUrl = import.meta.env.VITE_API_BASE_URL ? import.meta.env.VITE_API_BASE_URL.replace('/api', '') : 'http://localhost:8081';
        window.location.href = `${baseUrl}/oauth2/authorization/google`;
    };

    return (
        <div
            className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
            style={{ background: '#050a14' }}
        >
            {/* Background orbs */}
            <div className="orb orb-cyan" style={{ width: 700, height: 700, top: -250, left: -250 }} />
            <div className="orb orb-purple" style={{ width: 600, height: 600, bottom: -200, right: -200, animationDelay: '-5s' }} />
            <div className="orb orb-indigo" style={{ width: 400, height: 400, top: '50%', left: '50%', transform: 'translate(-50%,-50%)', animationDelay: '-3s' }} />

            {/* Grid */}
            <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" />

            {/* Particles */}
            {PARTICLES.map(p => <Particle key={p.id} style={p.style} />)}

            {/* Orbiting satellite around the card */}
            <div
                className="absolute pointer-events-none"
                style={{
                    width: 500, height: 500,
                    left: '50%', top: '50%',
                    transform: 'translate(-50%, -50%)',
                }}
            >
                <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                    <div
                        className="absolute"
                        style={{
                            top: '50%', left: '50%',
                            width: 0, height: 0,
                            animation: 'satellite-orbit 12s linear infinite',
                            transformOrigin: '0 0',
                        }}
                    >
                        <span style={{ fontSize: 18, filter: 'drop-shadow(0 0 8px #00d4ff)' }}>🛰️</span>
                    </div>
                </div>
                {/* Orbit ring */}
                <div
                    className="absolute inset-0 rounded-full"
                    style={{
                        border: '1px dashed rgba(0,212,255,0.15)',
                    }}
                />
            </div>

            {/* Login Card */}
            <div
                ref={cardRef}
                className="relative w-full max-w-md animate-fadeInUp"
                style={{
                    transform: `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`,
                    transition: 'transform 0.1s ease-out',
                    zIndex: 10,
                }}
            >
                <div
                    className="rounded-2xl p-8 relative overflow-hidden"
                    style={{
                        background: 'rgba(10, 16, 30, 0.9)',
                        backdropFilter: 'blur(40px)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        boxShadow: '0 40px 120px rgba(0,0,0,0.7), 0 0 60px rgba(0,212,255,0.08)',
                    }}
                >
                    {/* Scanline overlay */}
                    <div className="scan-lines absolute inset-0 pointer-events-none z-0" />
                    {/* Top glow line */}
                    <div
                        className="absolute top-0 left-0 right-0 h-px"
                        style={{ background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.5), transparent)' }}
                    />

                    {/* Header */}
                    <div className="relative z-10 text-center mb-8">
                        {/* Logo */}
                        <div className="flex justify-center mb-5">
                            <div className="relative">
                                <div
                                    className="w-20 h-20 rounded-2xl flex items-center justify-center"
                                    style={{
                                        background: 'linear-gradient(135deg, rgba(0,212,255,0.2), rgba(99,102,241,0.2))',
                                        border: '1px solid rgba(0,212,255,0.3)',
                                        boxShadow: '0 0 30px rgba(0,212,255,0.2), inset 0 0 20px rgba(0,212,255,0.05)',
                                    }}
                                >
                                    <span style={{ fontSize: 36 }}>🛰️</span>
                                </div>
                                {/* Outer ring spin */}
                                <div
                                    className="absolute inset-[-8px] rounded-2xl border border-dashed border-cyan-500/30 animate-spin-slow"
                                />
                                {/* Inner ring */}
                                <div
                                    className="absolute inset-[-4px] rounded-xl border border-cyan-400/10"
                                />
                            </div>
                        </div>

                        <h1 className="text-2xl font-bold text-white tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                            Satellite Monitoring
                        </h1>
                        <p className="text-xs mt-1.5 tracking-widest uppercase" style={{ color: 'rgba(0,212,255,0.6)' }}>
                            SDAVS · Secure Access Portal
                        </p>

                        {/* Live status pill */}
                        <div className="flex items-center justify-center gap-2 mt-4">
                            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" style={{ boxShadow: '0 0 6px #10b981', animation: 'pulse 2s infinite' }} />
                                <span className="text-[10px] font-semibold text-emerald-400 tracking-widest uppercase">System Online</span>
                            </div>
                        </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="relative z-10 space-y-5">
                        {/* Username */}
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'rgba(0,212,255,0.7)' }}>
                                Access ID
                            </label>
                            <div className="relative">
                                <input
                                    id="username"
                                    type="text"
                                    autoComplete="username"
                                    required
                                    value={username}
                                    onChange={e => setUsername(e.target.value)}
                                    onFocus={() => setFocused('username')}
                                    onBlur={() => setFocused(null)}
                                    placeholder="Enter your username"
                                    className="input-premium w-full px-4 py-3 rounded-xl text-sm"
                                    style={{
                                        fontFamily: "'JetBrains Mono', monospace",
                                        background: focused === 'username' ? 'rgba(0,212,255,0.05)' : 'rgba(255,255,255,0.03)',
                                        border: focused === 'username' ? '1px solid rgba(0,212,255,0.5)' : '1px solid rgba(255,255,255,0.08)',
                                        boxShadow: focused === 'username' ? '0 0 0 3px rgba(0,212,255,0.08), 0 0 20px rgba(0,212,255,0.1)' : 'none',
                                        transition: 'all 0.3s ease',
                                    }}
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'rgba(0,212,255,0.7)' }}>
                                Auth Key
                            </label>
                            <div className="relative">
                                <input
                                    id="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    onFocus={() => setFocused('password')}
                                    onBlur={() => setFocused(null)}
                                    placeholder="Enter your password"
                                    className="input-premium w-full px-4 py-3 rounded-xl text-sm"
                                    style={{
                                        fontFamily: "'JetBrains Mono', monospace",
                                        background: focused === 'password' ? 'rgba(0,212,255,0.05)' : 'rgba(255,255,255,0.03)',
                                        border: focused === 'password' ? '1px solid rgba(0,212,255,0.5)' : '1px solid rgba(255,255,255,0.08)',
                                        boxShadow: focused === 'password' ? '0 0 0 3px rgba(0,212,255,0.08), 0 0 20px rgba(0,212,255,0.1)' : 'none',
                                        transition: 'all 0.3s ease',
                                    }}
                                />
                            </div>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full py-3.5 rounded-xl text-sm font-bold tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Authenticating...
                                </span>
                            ) : (
                                'Access System →'
                            )}
                        </button>

                        {/* Divider */}
                        <div className="flex items-center gap-3">
                            <div className="flex-1 divider" />
                            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'rgba(148,163,184,0.4)' }}>Or</span>
                            <div className="flex-1 divider" />
                        </div>

                        {/* Google OAuth */}
                        <button
                            type="button"
                            onClick={handleGoogleLogin}
                            className="btn-ghost w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-3"
                        >
                            <svg className="w-4 h-4" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            Continue with Google
                        </button>

                        <div className="flex flex-col gap-2 pt-2">
                            <button
                                type="button"
                                onClick={() => {
                                    localStorage.setItem('sdavs_user', JSON.stringify({
                                        id: 'demo-admin',
                                        username: 'admin',
                                        email: 'admin@sdavs.com',
                                        role: 'admin'
                                    }));
                                    window.location.href = '/';
                                }}
                                className="w-full py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest border border-cyan-500/30 hover:bg-cyan-500/10 transition-all text-cyan-400"
                                style={{ background: 'rgba(0,212,255,0.05)' }}
                            >
                                ⚡ Quick Demo Access (No Password Required)
                            </button>
                            <p className="text-center text-[9px] uppercase tracking-tighter" style={{ color: 'rgba(148,163,184,0.4)' }}>
                                Use this button for instant presentation access
                            </p>
                        </div>
                    </form>
                </div>

                {/* Card bottom glow */}
                <div
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2/3 h-px"
                    style={{ background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.4), transparent)' }}
                />
            </div>
        </div>
    );
}

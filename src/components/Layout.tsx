import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Layout({ children }: { children: React.ReactNode }) {
    const location = useLocation();
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const navItems = [
        { path: '/', label: 'Dashboard', icon: '📊', roles: ['admin', 'viewer', 'analyst', 'researcher'] },
        { path: '/map', label: 'India Map', icon: '🗺️', roles: ['admin', 'viewer', 'analyst', 'researcher'] },
        { path: '/data', label: 'Data Table', icon: '📋', roles: ['admin', 'viewer', 'analyst', 'researcher'] },
        { path: '/environmental', label: 'Environmental', icon: '🌍', roles: ['admin', 'viewer', 'analyst', 'researcher'] },
        { path: '/ml', label: 'Predictive Analytics', icon: '🔮', roles: ['admin', 'analyst', 'researcher'] },
        { path: '/ai', label: 'AI Analysis', icon: '🧠', roles: ['admin', 'analyst', 'researcher'] },
        { path: '/status', label: 'System Status', icon: '⚙️', roles: ['admin'] }
    ];

    const isActive = (path: string) => location.pathname === path;

    const canAccess = (roles: string[]) => {
        return user && roles.includes(user.role || '');
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const getRoleBadgeColor = (role: string | null) => {
        switch (role) {
            case 'admin': return 'bg-purple-500/20 border-purple-500 text-purple-300';
            case 'analyst': return 'bg-blue-500/20 border-blue-500 text-blue-300';
            case 'viewer': return 'bg-green-500/20 border-green-500 text-green-300';
            default: return 'bg-slate-500/20 border-slate-500 text-slate-300';
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            <header className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-50">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-lg flex items-center justify-center">
                                <span className="text-2xl">🛰️</span>
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-white">Satellite Data Platform</h1>
                                <p className="text-xs text-slate-400">Real-time NDVI Analysis</p>
                            </div>
                        </div>

                        <nav className="flex space-x-2">
                            {navItems.filter(item => canAccess(item.roles)).map(item => (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`px-4 py-2 rounded-lg transition-all ${isActive(item.path)
                                        ? 'bg-green-500 text-white shadow-lg shadow-green-500/50'
                                        : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                                        }`}
                                >
                                    <span className="mr-2">{item.icon}</span>
                                    {item.label}
                                </Link>
                            ))}
                        </nav>

                        <div className="flex items-center space-x-3">
                            {/* Connection Status */}
                            <div className="flex items-center space-x-2 px-3 py-2 bg-slate-700/50 rounded-lg">
                                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                <span className="text-sm text-slate-300">Backend Connected</span>
                            </div>

                            {/* User Profile */}
                            {user && (
                                <div className="flex items-center space-x-3 px-4 py-2 bg-slate-700/50 rounded-lg">
                                    <div className="flex items-center space-x-2">
                                        <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                            {user.username.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm text-white font-medium">{user.username}</span>
                                            <span className={`text-xs px-2 py-0.5 rounded border ${getRoleBadgeColor(user.role)}`}>
                                                {user.role?.toUpperCase()}
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleLogout}
                                        className="ml-2 px-3 py-1 bg-red-500/20 hover:bg-red-500/30 border border-red-500 rounded-lg text-red-300 text-sm transition-all"
                                    >
                                        Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8">
                {children}
            </main>

            <footer className="mt-12 py-6 border-t border-slate-700">
                <div className="container mx-auto px-4">
                    <div className="flex items-center justify-between text-slate-400 text-sm">
                        <p>SDAVS — Satellite Data Analysis & Visualization System</p>
                        <div className="flex items-center space-x-4">
                            <span>Spring Boot + React + Supabase</span>
                            <span className="text-slate-600">•</span>
                            <span>v1.0.0</span>
                            <span className="text-slate-600">•</span>
                            <span>© {new Date().getFullYear()}</span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}

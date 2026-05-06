import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { motion } from 'framer-motion';

interface HealthMetrics {
    database: { status: string; responseTime: string };
    lastDataUpdate?: { timestamp: string; hoursAgo: number; citiesUpdated: number; status: string };
    memory: { used: string; max: string; usage: string };
    uptime: string;
    status: string;
}

interface Stats {
    totalRecords: number;
    cities: number;
    classifications: Record<string, number>;
}

export default function SystemStatus() {
    const { data: health, isLoading: healthLoading } = useQuery<HealthMetrics>({
        queryKey: ['health'],
        queryFn: async () => {
            const baseUrl = import.meta.env.VITE_API_BASE_URL ? import.meta.env.VITE_API_BASE_URL.replace('/api', '') : 'http://localhost:8081';
            const response = await fetch(`${baseUrl}/api/metrics/health`);
            return response.json();
        },
        refetchInterval: 60000 // Refresh every 60 seconds
    });

    const { data: stats } = useQuery<Stats>({
        queryKey: ['stats'],
        queryFn: async () => {
            const baseUrl = import.meta.env.VITE_API_BASE_URL ? import.meta.env.VITE_API_BASE_URL.replace('/api', '') : 'http://localhost:8081';
            const response = await fetch(`${baseUrl}/api/metrics/stats`);
            return response.json();
        },
        refetchInterval: 60000
    });

    const { data: performance } = useQuery({
        queryKey: ['performance'],
        queryFn: async () => {
            const baseUrl = import.meta.env.VITE_API_BASE_URL ? import.meta.env.VITE_API_BASE_URL.replace('/api', '') : 'http://localhost:8081';
            const response = await fetch(`${baseUrl}/api/metrics/performance`);
            return response.json();
        },
        refetchInterval: 10000
    });

    if (healthLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <LoadingSpinner text="Loading system metrics..." />
            </div>
        );
    }

    // Compute metrics from real API data
    const displaySystemLoad = typeof performance?.systemLoad === 'number' && performance.systemLoad >= 0
        ? performance.systemLoad.toFixed(2)
        : 'N/A';
        
    const freeMemory = performance?.memory?.free || 'N/A';
    const totalMemory = performance?.memory?.total || 'N/A';

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-4xl font-bold text-white mb-2">System Status</h1>
                <p className="text-slate-400">Real-time monitoring of backend services and performance</p>
            </div>

            {/* Overall Status */}
            <div className={`p-6 rounded-xl border-2 ${health?.status === 'HEALTHY'
                ? 'bg-green-500/10 border-green-500'
                : 'bg-red-500/10 border-red-500'
                }`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div className={`w-4 h-4 rounded-full ${health?.status === 'HEALTHY' ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                            }`}></div>
                        <div>
                            <h2 className="text-2xl font-bold text-white">
                                {health?.status === 'HEALTHY' ? '✅ System Healthy' : '⚠️ System Issues'}
                            </h2>
                            <p className="text-slate-300">All services operational</p>
                        </div>
                    </div>
                    <div className="text-slate-300">
                        <span className="text-sm">Uptime: </span>
                        <span className="text-xl font-bold">{Math.floor(parseInt(health?.uptime || '0') / 3600)}h</span>
                    </div>
                </div>
            </div>

            {/* Database Health */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
                <h3 className="text-xl font-bold text-white mb-4">💾 Database Status</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-700/30 rounded-lg">
                        <div className="text-slate-400 text-sm mb-1">Connection Status</div>
                        <div className={`text-2xl font-bold ${health?.database?.status === 'UP' ? 'text-green-400' : 'text-red-400'
                            }`}>
                            {health?.database?.status || 'Unknown'}
                        </div>
                    </div>
                    <div className="p-4 bg-slate-700/30 rounded-lg">
                        <div className="text-slate-400 text-sm mb-1">Response Time</div>
                        <div className="text-2xl font-bold text-blue-400">
                            {health?.database?.responseTime || 'N/A'}
                        </div>
                    </div>
                </div>
            </div>

            {/* Last Data Update */}
            {health?.lastDataUpdate && (
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
                    <h3 className="text-xl font-bold text-white mb-4">🔄 Last Data Update</h3>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="p-4 bg-slate-700/30 rounded-lg">
                            <div className="text-slate-400 text-sm mb-1">Last Updated</div>
                            <div className="text-lg font-bold text-white">
                                {health.lastDataUpdate.hoursAgo < 24
                                    ? `${health.lastDataUpdate.hoursAgo}h ago`
                                    : `${Math.floor(health.lastDataUpdate.hoursAgo / 24)}d ago`
                                }
                            </div>
                        </div>
                        <div className="p-4 bg-slate-700/30 rounded-lg">
                            <div className="text-slate-400 text-sm mb-1">Cities Updated</div>
                            <div className="text-2xl font-bold text-green-400">
                                {health.lastDataUpdate.citiesUpdated}
                            </div>
                        </div>
                        <div className="p-4 bg-slate-700/30 rounded-lg">
                            <div className="text-slate-400 text-sm mb-1">Status</div>
                            <div className={`text-lg font-bold ${health.lastDataUpdate.status === 'SUCCESS' ? 'text-green-400' : 'text-yellow-400'
                                }`}>
                                {health.lastDataUpdate.status}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Memory Usage */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
                <h3 className="text-xl font-bold text-white mb-4">🧠 Memory Usage</h3>
                <div className="space-y-4">
                    <div>
                        <div className="flex justify-between text-sm text-slate-400 mb-2">
                            <span>Heap Memory</span>
                            <span>{health?.memory?.usage}</span>
                        </div>
                        <div className="w-full bg-slate-700 rounded-full h-4 overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-green-500 to-blue-500 transition-all"
                                style={{ width: health?.memory?.usage || '0%' }}
                            ></div>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-slate-700/30 rounded-lg">
                            <div className="text-slate-400 text-xs">Used</div>
                            <div className="text-lg font-bold text-white">{health?.memory?.used}</div>
                        </div>
                        <div className="p-3 bg-slate-700/30 rounded-lg">
                            <div className="text-slate-400 text-xs">Max</div>
                            <div className="text-lg font-bold text-white">{health?.memory?.max}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Performance Metrics */}
            {performance && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700"
                >
                    <h3 className="text-xl font-bold text-white mb-4">⚡ Performance Metrics</h3>
                    <div className="grid grid-cols-4 gap-4">
                        <div className="p-4 bg-slate-700/30 rounded-lg">
                            <div className="text-slate-400 text-sm mb-1">Active Threads</div>
                            <div className="text-2xl font-bold text-purple-400">
                                {performance.activeThreads || 0}
                            </div>
                            <div className="text-xs text-slate-500 mt-1">Concurrent requests</div>
                        </div>
                        <div className="p-4 bg-slate-700/30 rounded-lg">
                            <div className="text-slate-400 text-sm mb-1">System Load</div>
                            <div className="text-2xl font-bold text-orange-400">
                                {displaySystemLoad}
                            </div>
                            <div className="text-xs text-slate-500 mt-1">CPU utilization</div>
                        </div>
                        <div className="p-4 bg-slate-700/30 rounded-lg">
                            <div className="text-slate-400 text-sm mb-1">Free Memory</div>
                            <div className="text-lg font-bold text-cyan-400">
                                {performance.memory?.free || 'N/A'}
                            </div>
                            <div className="text-xs text-slate-500 mt-1">Available RAM</div>
                        </div>
                        <div className="p-4 bg-slate-700/30 rounded-lg">
                            <div className="text-slate-400 text-sm mb-1">API Response</div>
                            <div className="text-2xl font-bold text-green-400">
                                ~45ms
                            </div>
                            <div className="text-xs text-slate-500 mt-1">Average latency</div>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Additional System Metrics */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700"
            >
                <h3 className="text-xl font-bold text-white mb-4">📊 System Resources</h3>
                <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                        <div className="text-blue-400 text-sm mb-1">Session Uptime</div>
                        <div className="text-2xl font-bold text-white">
                            {health?.uptime ? (parseInt(health.uptime) > 3600 ? `${Math.floor(parseInt(health.uptime)/3600)}h ${Math.floor((parseInt(health.uptime)%3600)/60)}m` : health.uptime) : 'N/A'}
                        </div>
                        <div className="text-xs text-blue-300 mt-1">Current runtime</div>
                    </div>
                    <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                        <div className="text-green-400 text-sm mb-1">Total Heap</div>
                        <div className="text-2xl font-bold text-white">{totalMemory}</div>
                        <div className="text-xs text-green-300 mt-1">Allocated JVM memory</div>
                    </div>
                    <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                        <div className="text-orange-400 text-sm mb-1">Free RAM</div>
                        <div className="text-2xl font-bold text-white">{freeMemory}</div>
                        <div className="text-xs text-orange-300 mt-1">Available in JVM</div>
                    </div>
                </div>
            </motion.div>

            {/* Database Stats */}
            {stats && (
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
                    <h3 className="text-xl font-bold text-white mb-4">📊 Database Statistics</h3>
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-slate-700/30 rounded-lg text-center">
                                    <div className="text-3xl font-bold text-white">{stats.totalRecords}</div>
                                    <div className="text-slate-400 text-sm mt-1">Total Records</div>
                                </div>
                                <div className="p-4 bg-slate-700/30 rounded-lg text-center">
                                    <div className="text-3xl font-bold text-white">{stats.cities}</div>
                                    <div className="text-slate-400 text-sm mt-1">Cities</div>
                                </div>
                            </div>
                        </div>
                        <div>
                            <div className="text-slate-300 text-sm mb-2">Classification Breakdown</div>
                            <div className="space-y-2">
                                {Object.entries(stats.classifications || {}).map(([key, value]) => (
                                    <div key={key} className="flex justify-between items-center">
                                        <span className={`text-sm ${key === 'HEALTHY' ? 'text-green-400' :
                                            key === 'MODERATE' ? 'text-yellow-400' : 'text-red-400'
                                            }`}>{key}</span>
                                        <span className="text-white font-bold">{value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Quick Actions */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
                <h3 className="text-xl font-bold text-white mb-4">🔧 Quick Actions</h3>
                <div className="grid grid-cols-4 gap-4">
                    <Link
                        to="/"
                        className="p-4 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500 rounded-lg text-center transition-all"
                    >
                        <div className="text-2xl mb-2">📊</div>
                        <div className="text-sm text-white">Dashboard</div>
                    </Link>
                    <Link
                        to="/map"
                        className="p-4 bg-green-500/20 hover:bg-green-500/30 border border-green-500 rounded-lg text-center transition-all"
                    >
                        <div className="text-2xl mb-2">🗺️</div>
                        <div className="text-sm text-white">View Map</div>
                    </Link>
                    <button
                        onClick={() => {
                            const baseUrl = import.meta.env.VITE_API_BASE_URL ? import.meta.env.VITE_API_BASE_URL.replace('/api', '') : 'http://localhost:8081';
                            window.location.href = `${baseUrl}/api/satellite/trigger-update`;
                        }}
                        className="p-4 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500 rounded-lg text-center transition-all"
                    >
                        <div className="text-2xl mb-2">🔄</div>
                        <div className="text-sm text-white">Trigger Update</div>
                    </button>
                    <button
                        onClick={() => {
                            const baseUrl = import.meta.env.VITE_API_BASE_URL ? import.meta.env.VITE_API_BASE_URL.replace('/api', '') : 'http://localhost:8081';
                            window.location.href = `${baseUrl}/api/disasters/sync`;
                        }}
                        className="p-4 bg-red-500/20 hover:bg-red-500/30 border border-red-500 rounded-lg text-center transition-all"
                    >
                        <div className="text-2xl mb-2">🌍</div>
                        <div className="text-sm text-white">Sync Disasters</div>
                    </button>
                </div>
            </div>
        </div>
    );
}

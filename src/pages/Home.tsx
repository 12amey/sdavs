import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { satelliteApi } from '../services/api';
import StatCard from '../components/StatCard';
import { Link } from 'react-router-dom';
import { generatePDFReport } from '../utils/pdfExport';
import { SatelliteData } from '../types/satellite';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081/api';

export default function Home() {
    const [isExporting, setIsExporting] = useState(false);

    // Fetch satellite data for India region (Mumbai/Pune)
    const { data: satelliteData, isLoading, error } = useQuery({
        queryKey: ['satelliteData'],
        queryFn: () => satelliteApi.getSatelliteData(18.0, 20.0, 72.5, 74.5)
    });

    // Fetch health metrics
    const { data: health } = useQuery({
        queryKey: ['health'],
        queryFn: async () => {
            const response = await fetch(`${API_BASE}/metrics/health`);
            return response.json();
        },
        refetchInterval: 60000 // 1 minute
    });

    const handleExportPDF = async () => {
        setIsExporting(true);
        try {
            await generatePDFReport();
        } catch (error) {
            console.error('PDF export failed:', error);
        } finally {
            setIsExporting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-300">Loading satellite data...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-500/10 border border-red-500 rounded-lg p-6">
                <p className="text-red-400">Error loading data: {error.message}</p>
            </div>
        );
    }

    // Calculate statistics
    const totalRecords = satelliteData?.length || 0;
    const avgNDVI = totalRecords > 0
        ? (satelliteData.reduce((sum: number, d: SatelliteData) => sum + (d.ndviValue || 0), 0) / totalRecords).toFixed(3)
        : '0.000';
    const healthyCount = satelliteData?.filter((d: SatelliteData) => d.classification === 'HEALTHY').length || 0;
    const moderateCount = satelliteData?.filter((d: SatelliteData) => d.classification === 'MODERATE').length || 0;

    return (
        <div className="space-y-8">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-bold text-white mb-2">Dashboard</h1>
                    <p className="text-slate-400">Overview of satellite data from Supabase database</p>
                </div>
                <div className="flex space-x-3">
                    <button
                        onClick={handleExportPDF}
                        disabled={isExporting}
                        className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 disabled:from-slate-600 disabled:to-slate-700 text-white rounded-lg transition-all shadow-lg flex items-center space-x-2"
                    >
                        <span>{isExporting ? '⏳' : '📄'}</span>
                        <span>{isExporting ? 'Generating...' : 'Export Report'}</span>
                    </button>
                    <Link
                        to="/status"
                        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                    >
                        ⚙️ System Status
                    </Link>
                </div>
            </div>

            {/* Last Data Update Banner */}
            {health?.lastDataUpdate && (
                <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/30 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                            <div>
                                <p className="text-white font-medium">Last Data Update</p>
                                <p className="text-slate-300 text-sm">
                                    {health.lastDataUpdate.hoursAgo < 24
                                        ? `${health.lastDataUpdate.hoursAgo} hours ago`
                                        : `${Math.floor(health.lastDataUpdate.hoursAgo / 24)} days ago`
                                    } • {health.lastDataUpdate.citiesUpdated} cities updated • Status: {health.lastDataUpdate.status}
                                </p>
                            </div>
                        </div>
                        <span className="text-green-400 text-sm">✓ Auto-sync active</span>
                    </div>
                </div>
            )}

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Records" value={totalRecords} icon="📊" color="blue" />
                <StatCard title="Average NDVI" value={avgNDVI} icon="🌿" color="green" />
                <StatCard title="Healthy Vegetation" value={healthyCount} icon="✅" color="green" />
                <StatCard title="Moderate Vegetation" value={moderateCount} icon="⚠️" color="orange" />
            </div>

            {/* Recent Records Table */}
            <div className="bg-slate-800/80 backdrop-blur-md rounded-xl p-6 border border-slate-700 animate-fadeIn shadow-2xl">
                <h2 className="text-2xl font-bold text-white mb-4">Recent Satellite Data</h2>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-700">
                                <th className="text-left py-3 px-4 text-slate-400 font-medium">ID</th>
                                <th className="text-left py-3 px-4 text-slate-400 font-medium">Location</th>
                                <th className="text-left py-3 px-4 text-slate-400 font-medium">NDVI</th>
                                <th className="text-left py-3 px-4 text-slate-400 font-medium">Classification</th>
                                <th className="text-left py-3 px-4 text-slate-400 font-medium">Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {satelliteData?.slice(0, 5).map((record: SatelliteData) => (
                                <tr key={record.id} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                                    <td className="py-3 px-4 text-slate-300">{record.id}</td>
                                    <td className="py-3 px-4 text-slate-300 font-medium">
                                        {record.locationName || record.city || `${record.latitude?.toFixed(2)}, ${record.longitude?.toFixed(2)}`}
                                    </td>
                                    <td className="py-3 px-4">
                                        <span className={`px-2 py-1 rounded ${record.ndviValue > 0.6 ? 'bg-green-500/20 text-green-400' :
                                            record.ndviValue > 0.4 ? 'bg-yellow-500/20 text-yellow-400' :
                                                'bg-red-500/20 text-red-400'
                                            }`}>
                                            {record.ndviValue?.toFixed(3)}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4">
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${record.classification === 'HEALTHY' ? 'bg-green-500/20 text-green-400' :
                                            record.classification === 'MODERATE' ? 'bg-yellow-500/20 text-yellow-400' :
                                                'bg-red-500/20 text-red-400'
                                            }`}>
                                            {record.classification}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-slate-300 text-sm">
                                        {record.analysisDate ? new Date(record.analysisDate).toLocaleDateString() : 'N/A'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {totalRecords > 5 && (
                    <p className="text-slate-400 text-sm mt-4">
                        Showing 5 of {totalRecords} records. <Link to="/data" className="text-green-400 hover:underline">View all →</Link>
                    </p>
                )}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
                    <h3 className="text-lg font-semibold text-white mb-4">NDVI Distribution</h3>
                    <div className="space-y-3">
                        <div>
                            <div className="flex justify-between mb-1">
                                <span className="text-slate-400">Healthy (0.6-1.0)</span>
                                <span className="text-green-400 font-medium">{healthyCount} records</span>
                            </div>
                            <div className="w-full bg-slate-700 rounded-full h-2">
                                <div
                                    className="bg-green-500 h-2 rounded-full"
                                    style={{ width: `${totalRecords > 0 ? (healthyCount / totalRecords * 100) : 0}%` }}
                                ></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between mb-1">
                                <span className="text-slate-400">Moderate (0.4-0.6)</span>
                                <span className="text-yellow-400 font-medium">{moderateCount} records</span>
                            </div>
                            <div className="w-full bg-slate-700 rounded-full h-2">
                                <div
                                    className="bg-yellow-500 h-2 rounded-full"
                                    style={{ width: `${totalRecords > 0 ? (moderateCount / totalRecords * 100) : 0}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
                    <h3 className="text-lg font-semibold text-white mb-4">Data Sources</h3>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-slate-400">Supabase Database</span>
                            <span className="text-green-400 text-sm">✓ Connected</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-slate-400">Spring Boot API</span>
                            <span className="text-green-400 text-sm">✓ Active</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-slate-400">Python COG Service</span>
                            <span className="text-green-400 text-sm">✓ Running</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

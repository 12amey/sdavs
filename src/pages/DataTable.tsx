import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { satelliteApi } from '../services/api';
import { getNearestAreaName } from '../utils/indianCities';

export default function DataTable() {
    const [searchTerm, setSearchTerm] = useState('');

    const { data: satelliteData, isLoading } = useQuery({
        queryKey: ['satelliteData'],
        queryFn: () => satelliteApi.getSatelliteData(18.0, 20.0, 72.5, 74.5)
    });

    // Filter data based on search
    const filteredData = satelliteData?.filter(record =>
        record.id?.toString().includes(searchTerm) ||
        record.classification?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.locationName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const exportToCSV = () => {
        if (!satelliteData) return;

        const csv = [
            ['ID', 'Location', 'NDVI', 'Classification', 'Date'],
            ...satelliteData.map(r => [
                r.id,
                r.locationName || r.city || `${r.latitude},${r.longitude}`,
                r.ndviValue,
                r.classification,
                r.analysisDate ? new Date(r.analysisDate).toLocaleDateString() : 'N/A'
            ])
        ].map(row => row.join(',')).join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `satellite-data-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-300">Loading data table...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-4xl font-bold text-white mb-2">Satellite Data Records</h1>
                    <p className="text-slate-400">Complete list of {satelliteData?.length || 0} records from database</p>
                </div>
                <button
                    onClick={exportToCSV}
                    className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors flex items-center space-x-2"
                >
                    <span>📥</span>
                    <span>Export CSV</span>
                </button>
            </div>

            {/* Search Bar */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700">
                <div className="flex items-center space-x-3">
                    <span className="text-slate-400">🔍</span>
                    <input
                        type="text"
                        placeholder="Search by ID, location, or classification..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-green-500 transition-colors"
                    />
                    {searchTerm && (
                        <button
                            onClick={() => setSearchTerm('')}
                            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors"
                        >
                            Clear
                        </button>
                    )}
                </div>
            </div>

            {/* Data Table */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-700/50">
                            <tr>
                                <th className="text-left py-4 px-6 text-slate-300 font-semibold">ID</th>
                                <th className="text-left py-4 px-6 text-slate-300 font-semibold">Specific Area</th>
                                <th className="text-left py-4 px-6 text-slate-300 font-semibold">City</th>
                                <th className="text-left py-4 px-6 text-slate-300 font-semibold">NDVI Value</th>
                                <th className="text-left py-4 px-6 text-slate-300 font-semibold">Classification</th>
                                <th className="text-left py-4 px-6 text-slate-300 font-semibold">Analysis Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredData && filteredData.length > 0 ? (
                                filteredData.map((record, index) => (
                                    <tr
                                        key={record.id}
                                        className={`border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors ${index % 2 === 0 ? 'bg-slate-800/30' : ''
                                            }`}
                                    >
                                        <td className="py-4 px-6 text-slate-200 font-medium">#{record.id}</td>
                                        <td className="py-4 px-6">
                                            {/* Show specific area name: enrich with coords if DB only has plain city name */}
                                            {(() => {
                                                const dbLocation = record.locationName || record.city || '';
                                                const hasSpecificArea = dbLocation.includes('(');
                                                if (hasSpecificArea) {
                                                    // DB already has a specific area like "Mumbai (Vasai)"
                                                    return (
                                                        <div>
                                                            <div className="text-white font-semibold text-sm">{dbLocation}</div>
                                                        </div>
                                                    );
                                                }
                                                // Enrich plain city name using coordinates
                                                const enriched = record.latitude && record.longitude
                                                    ? getNearestAreaName(record.latitude, record.longitude)
                                                    : dbLocation;
                                                const isEnriched = enriched !== dbLocation && enriched !== record.city;
                                                return (
                                                    <div>
                                                        <div className="text-white font-semibold text-sm">{enriched}</div>
                                                        {!isEnriched && (
                                                            <div className="text-slate-500 text-xs">
                                                                {record.latitude?.toFixed(3)}°N, {record.longitude?.toFixed(3)}°E
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })()}
                                        </td>
                                        <td className="py-4 px-6 text-slate-400 text-sm">
                                            {record.city || record.locationName?.split(' (')[0] || '—'}
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center space-x-2">
                                                <div className={`w-3 h-3 rounded-full ${record.ndviValue > 0.6 ? 'bg-green-500' :
                                                    record.ndviValue > 0.4 ? 'bg-yellow-500' :
                                                        'bg-red-500'
                                                    }`}></div>
                                                <span className="text-white font-mono">{record.ndviValue?.toFixed(3)}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${record.classification === 'HEALTHY' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                                                record.classification === 'MODERATE' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                                                    'bg-red-500/20 text-red-400 border border-red-500/30'
                                                }`}>
                                                {record.classification}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-slate-300">
                                            {record.analysisDate ? (
                                                <div>
                                                    <div>{new Date(record.analysisDate).toLocaleDateString()}</div>
                                                    <div className="text-xs text-slate-500">{new Date(record.analysisDate).toLocaleTimeString()}</div>
                                                </div>
                                            ) : (
                                                <span className="text-slate-500">N/A</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center">
                                        <div className="text-slate-400">
                                            <div className="text-4xl mb-2">🔍</div>
                                            <p>No records found matching "{searchTerm}"</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Table Footer */}
                <div className="bg-slate-700/30 px-6 py-4 flex justify-between items-center border-t border-slate-700">
                    <div className="text-slate-400 text-sm">
                        Showing {filteredData?.length || 0} of {satelliteData?.length || 0} records
                    </div>
                    <div className="flex items-center space-x-2">
                        <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors disabled:opacity-50" disabled>
                            ← Previous
                        </button>
                        <span className="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg">Page 1 of 1</span>
                        <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors disabled:opacity-50" disabled>
                            Next →
                        </button>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
                    <h3 className="text-slate-400 text-sm mb-2">Data Quality</h3>
                    <div className="text-3xl font-bold text-green-400">
                        {satelliteData?.length}/{satelliteData?.length}
                    </div>
                    <p className="text-slate-500 text-sm mt-1">Complete records</p>
                </div>
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
                    <h3 className="text-slate-400 text-sm mb-2">Latest Update</h3>
                    <div className="text-xl font-bold text-white">
                        {satelliteData?.[0]?.analysisDate
                            ? new Date(satelliteData[0].analysisDate).toLocaleDateString()
                            : 'N/A'}
                    </div>
                    <p className="text-slate-500 text-sm mt-1">Most recent entry</p>
                </div>
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
                    <h3 className="text-slate-400 text-sm mb-2">Coverage Area</h3>
                    <div className="text-xl font-bold text-white">Maharashtra</div>
                    <p className="text-slate-500 text-sm mt-1">Mumbai & Pune regions</p>
                </div>
            </div>
        </div>
    );
}

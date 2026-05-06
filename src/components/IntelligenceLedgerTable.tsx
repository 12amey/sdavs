import { useState, useMemo } from 'react';

interface EnvironmentalData {
    id?: number;
    city: string;
    locationName?: string;
    state?: string;
    ndviValue: number;
    deforestationRisk: string;
    floodRisk: number;
    airQualityIndex: number;
    analysisDate: string;
    ndviChangePercent?: number;
}

interface IntelligenceLedgerTableProps {
    data: EnvironmentalData[];
    loading?: boolean;
}

export function IntelligenceLedgerTable({ data, loading }: IntelligenceLedgerTableProps) {
    const [sortColumn, setSortColumn] = useState<keyof EnvironmentalData>('analysisDate');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const [searchTerm, setSearchTerm] = useState('');

    const handleSort = (column: keyof EnvironmentalData) => {
        if (sortColumn === column) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(column);
            setSortDirection('asc');
        }
    };

    const sortedAndFilteredData = useMemo(() => {
        let filtered = data;

        // Filter by search term
        if (searchTerm) {
            filtered = filtered.filter(item =>
                item.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.locationName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.state?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Sort data
        return [...filtered].sort((a, b) => {
            const aVal = a[sortColumn];
            const bVal = b[sortColumn];

            if (aVal === undefined || aVal === null) return 1;
            if (bVal === undefined || bVal === null) return -1;

            if (typeof aVal === 'string' && typeof bVal === 'string') {
                return sortDirection === 'asc'
                    ? aVal.localeCompare(bVal)
                    : bVal.localeCompare(aVal);
            }

            if (typeof aVal === 'number' && typeof bVal === 'number') {
                return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
            }

            return 0;
        });
    }, [data, sortColumn, sortDirection, searchTerm]);

    const getRiskColor = (risk: string) => {
        switch (risk) {
            case 'HIGH': return 'text-red-400 bg-red-500/20';
            case 'MEDIUM': return 'text-yellow-400 bg-yellow-500/20';
            case 'LOW': return 'text-green-400 bg-green-500/20';
            default: return 'text-slate-400 bg-slate-500/20';
        }
    };

    const getAQIColor = (aqi: number) => {
        if (aqi > 300) return 'text-red-400';
        if (aqi > 200) return 'text-orange-400';
        if (aqi > 100) return 'text-yellow-400';
        if (aqi > 50) return 'text-blue-400';
        return 'text-green-400';
    };

    if (loading) {
        return (
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
                <div className="flex items-center justify-center py-8">
                    <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="ml-3 text-slate-300">Loading data...</span>
                </div>
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
                <p className="text-slate-400 text-center py-8">No environmental data available</p>
            </div>
        );
    }

    const SortIcon = ({ column }: { column: keyof EnvironmentalData }) => {
        if (sortColumn !== column) return <span className="text-slate-600">⇅</span>;
        return sortDirection === 'asc' ? <span className="text-emerald-400">↑</span> : <span className="text-emerald-400">↓</span>;
    };

    return (
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white flex items-center">
                    <span className="text-2xl mr-2">📑</span>
                    Intelligence Ledger Snapshot
                </h3>
                <div className="flex items-center space-x-3">
                    <input
                        type="text"
                        placeholder="Search city, area, or state..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                    <div className="text-sm text-slate-400">
                        {sortedAndFilteredData.length} records
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-slate-700">
                            <th
                                className="px-4 py-3 text-left text-sm font-medium text-slate-300 cursor-pointer hover:text-white"
                                onClick={() => handleSort('locationName')}
                            >
                                <div className="flex items-center space-x-1">
                                    <span>Area Name</span>
                                    <SortIcon column="locationName" />
                                </div>
                            </th>
                            <th
                                className="px-4 py-3 text-left text-sm font-medium text-slate-300 cursor-pointer hover:text-white"
                                onClick={() => handleSort('city')}
                            >
                                <div className="flex items-center space-x-1">
                                    <span>City</span>
                                    <SortIcon column="city" />
                                </div>
                            </th>
                            <th
                                className="px-4 py-3 text-left text-sm font-medium text-slate-300 cursor-pointer hover:text-white"
                                onClick={() => handleSort('state')}
                            >
                                <div className="flex items-center space-x-1">
                                    <span>State</span>
                                    <SortIcon column="state" />
                                </div>
                            </th>
                            <th
                                className="px-4 py-3 text-left text-sm font-medium text-slate-300 cursor-pointer hover:text-white"
                                onClick={() => handleSort('ndviValue')}
                            >
                                <div className="flex items-center space-x-1">
                                    <span>NDVI</span>
                                    <SortIcon column="ndviValue" />
                                </div>
                            </th>
                            <th
                                className="px-4 py-3 text-left text-sm font-medium text-slate-300 cursor-pointer hover:text-white"
                                onClick={() => handleSort('deforestationRisk')}
                            >
                                <div className="flex items-center space-x-1">
                                    <span>Deforestation</span>
                                    <SortIcon column="deforestationRisk" />
                                </div>
                            </th>
                            <th
                                className="px-4 py-3 text-left text-sm font-medium text-slate-300 cursor-pointer hover:text-white"
                                onClick={() => handleSort('floodRisk')}
                            >
                                <div className="flex items-center space-x-1">
                                    <span>Flood Risk %</span>
                                    <SortIcon column="floodRisk" />
                                </div>
                            </th>
                            <th
                                className="px-4 py-3 text-left text-sm font-medium text-slate-300 cursor-pointer hover:text-white"
                                onClick={() => handleSort('airQualityIndex')}
                            >
                                <div className="flex items-center space-x-1">
                                    <span>AQI</span>
                                    <SortIcon column="airQualityIndex" />
                                </div>
                            </th>
                            <th
                                className="px-4 py-3 text-left text-sm font-medium text-slate-300 cursor-pointer hover:text-white"
                                onClick={() => handleSort('analysisDate')}
                            >
                                <div className="flex items-center space-x-1">
                                    <span>Analysis Date</span>
                                    <SortIcon column="analysisDate" />
                                </div>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedAndFilteredData.map((item, index) => (
                            <tr
                                key={item.id || index}
                                className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors"
                            >
                                <td className="px-4 py-3">
                                    {/* Show specific area name from DB, with city as subtitle if different */}
                                    {(() => {
                                        const locName = item.locationName;
                                        const cityName = item.city;
                                        // If locationName has a sub-area like "Mumbai (Vasai)" use it
                                        if (locName && locName !== cityName) {
                                            return (
                                                <div>
                                                    <div className="text-white font-semibold text-sm">{locName}</div>
                                                    <div className="text-slate-500 text-xs">{cityName}</div>
                                                </div>
                                            );
                                        }
                                        // Otherwise just show the city name
                                        return (
                                            <div className="text-white font-medium text-sm">
                                                {cityName || locName || 'N/A'}
                                            </div>
                                        );
                                    })()}
                                </td>
                                <td className="px-4 py-3 text-slate-300">
                                    {item.city || 'N/A'}
                                </td>
                                <td className="px-4 py-3 text-slate-400 text-sm">
                                    {item.state || 'N/A'}
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex flex-col">
                                        <span className="text-white font-mono">
                                            {item.ndviValue?.toFixed(3) || 'N/A'}
                                        </span>
                                        {item.ndviChangePercent !== undefined && (
                                            <span className={`text-xs ${item.ndviChangePercent < 0 ? 'text-red-400' : 'text-green-400'}`}>
                                                {item.ndviChangePercent > 0 ? '+' : ''}{item.ndviChangePercent.toFixed(1)}%
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${getRiskColor(item.deforestationRisk)}`}>
                                        {item.deforestationRisk || 'N/A'}
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center space-x-2">
                                        <span className="text-white font-mono">
                                            {item.floodRisk?.toFixed(1) || '0.0'}%
                                        </span>
                                        <div className="w-16 bg-slate-600 rounded-full h-2">
                                            <div
                                                className="bg-blue-500 h-2 rounded-full"
                                                style={{ width: `${Math.min(item.floodRisk || 0, 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <span className={`font-mono font-bold ${getAQIColor(item.airQualityIndex)}`}>
                                        {item.airQualityIndex?.toFixed(0) || 'N/A'}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-slate-400 text-sm">
                                    {new Date(item.analysisDate).toLocaleDateString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Footer Stats */}
            <div className="mt-4 pt-4 border-t border-slate-700 grid grid-cols-4 gap-4">
                <div className="text-center">
                    <div className="text-slate-400 text-xs">Avg NDVI</div>
                    <div className="text-white font-bold">
                        {(sortedAndFilteredData.reduce((sum, d) => sum + (d.ndviValue || 0), 0) / sortedAndFilteredData.length).toFixed(3)}
                    </div>
                </div>
                <div className="text-center">
                    <div className="text-slate-400 text-xs">High Risk Areas</div>
                    <div className="text-red-400 font-bold">
                        {sortedAndFilteredData.filter(d => d.deforestationRisk === 'HIGH').length}
                    </div>
                </div>
                <div className="text-center">
                    <div className="text-slate-400 text-xs">Avg Flood Risk</div>
                    <div className="text-blue-400 font-bold">
                        {(sortedAndFilteredData.reduce((sum, d) => sum + (d.floodRisk || 0), 0) / sortedAndFilteredData.length).toFixed(1)}%
                    </div>
                </div>
                <div className="text-center">
                    <div className="text-slate-400 text-xs">Avg AQI</div>
                    <div className="text-purple-400 font-bold">
                        {(sortedAndFilteredData.reduce((sum, d) => sum + (d.airQualityIndex || 0), 0) / sortedAndFilteredData.length).toFixed(0)}
                    </div>
                </div>
            </div>
        </div>
    );
}

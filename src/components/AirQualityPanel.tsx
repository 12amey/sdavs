import React, { useEffect, useState } from 'react';

interface AirQualityPanelProps {
    cityName: string;
    latitude?: number;
    longitude?: number;
}

interface AQIData {
    aqi: number;
    pm25: number;
    pm10: number;
    no2: number;
    o3: number;
    so2: number;
    co: number;
    time: string;
}

async function fetchLiveAQI(lat: number, lon: number): Promise<AQIData | null> {
    try {
        const url = new URL('https://air-quality-api.open-meteo.com/v1/air-quality');
        url.searchParams.set('latitude', lat.toFixed(4));
        url.searchParams.set('longitude', lon.toFixed(4));
        url.searchParams.set('hourly', 'european_aqi,pm2_5,pm10,nitrogen_dioxide,ozone,sulphur_dioxide,carbon_monoxide');
        url.searchParams.set('timezone', 'Asia/Kolkata');
        url.searchParams.set('forecast_days', '1');

        const res = await fetch(url.toString());
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        const hourly = data.hourly;
        if (!hourly) return null;

        // Pick the latest non-null aqi value
        const times: string[] = hourly.time || [];
        const aqis: (number | null)[] = hourly.european_aqi || [];
        const pm25s: (number | null)[] = hourly.pm2_5 || [];
        const pm10s: (number | null)[] = hourly.pm10 || [];
        const no2s: (number | null)[] = hourly.nitrogen_dioxide || [];
        const o3s: (number | null)[] = hourly.ozone || [];
        const so2s: (number | null)[] = hourly.sulphur_dioxide || [];
        const cos: (number | null)[] = hourly.carbon_monoxide || [];

        // Find last index with valid AQI
        let idx = aqis.length - 1;
        while (idx >= 0 && (aqis[idx] === null || aqis[idx] === undefined)) idx--;

        if (idx < 0) return null;

        return {
            aqi: aqis[idx] as number,
            pm25: pm25s[idx] as number ?? 0,
            pm10: pm10s[idx] as number ?? 0,
            no2: no2s[idx] as number ?? 0,
            o3: o3s[idx] as number ?? 0,
            so2: so2s[idx] as number ?? 0,
            co: cos[idx] as number ?? 0,
            time: times[idx] ?? '',
        };
    } catch (err) {
        console.error('Open-Meteo AQI fetch failed:', err);
        return null;
    }
}

// European AQI uses 0–500 scale (same thresholds as US AQI categories)
function getAqiCategory(aqi: number) {
    if (aqi <= 20) return { name: 'GOOD', color: 'green', emoji: '😊', message: 'Air quality is excellent' };
    if (aqi <= 40) return { name: 'FAIR', color: 'green', emoji: '🙂', message: 'Air quality is satisfactory' };
    if (aqi <= 60) return { name: 'MODERATE', color: 'yellow', emoji: '😐', message: 'Air quality is acceptable' };
    if (aqi <= 80) return { name: 'POOR', color: 'orange', emoji: '😷', message: 'Sensitive groups may experience effects' };
    if (aqi <= 100) return { name: 'VERY POOR', color: 'red', emoji: '🤢', message: 'Everyone may experience health effects' };
    return { name: 'EXTREMELY POOR', color: 'purple', emoji: '☠️', message: 'Health emergency — stay indoors' };
}

const colorClasses = {
    green: { bg: 'bg-green-500/20', border: 'border-green-500', text: 'text-green-400', bar: 'bg-green-500' },
    yellow: { bg: 'bg-yellow-500/20', border: 'border-yellow-500', text: 'text-yellow-400', bar: 'bg-yellow-500' },
    orange: { bg: 'bg-orange-500/20', border: 'border-orange-500', text: 'text-orange-400', bar: 'bg-orange-500' },
    red: { bg: 'bg-red-500/20', border: 'border-red-500', text: 'text-red-400', bar: 'bg-red-500' },
    purple: { bg: 'bg-purple-500/20', border: 'border-purple-500', text: 'text-purple-400', bar: 'bg-purple-500' },
};

export function AirQualityPanel({ cityName, latitude, longitude }: AirQualityPanelProps) {
    const [aqiData, setAqiData] = useState<AQIData | null>(null);
    const [loading, setLoading] = useState(false);
    const [fetchErr, setFetchErr] = useState<string | null>(null);
    const [lastCity, setLastCity] = useState('');

    useEffect(() => {
        if (!cityName || !latitude || !longitude) return;
        if (cityName === lastCity) return; // Avoid re-fetch on same city

        setLoading(true);
        setFetchErr(null);
        setAqiData(null);
        setLastCity(cityName);

        fetchLiveAQI(latitude, longitude).then(data => {
            if (data) {
                setAqiData(data);
            } else {
                setFetchErr('Could not retrieve AQI data for this location.');
            }
            setLoading(false);
        });
    }, [cityName, latitude, longitude]);

    if (!cityName) {
        return (
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
                <p className="text-slate-400">Select a city to view air quality data</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
                <div className="flex items-center justify-center py-8">
                    <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="ml-3 text-slate-300">Fetching live AQI for {cityName}…</span>
                </div>
            </div>
        );
    }

    if (fetchErr || !aqiData) {
        return (
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-8 border border-slate-700 text-center">
                <div className="text-5xl mb-4 text-slate-500">🌫️</div>
                <h3 className="text-xl font-bold text-white mb-2">AQI Unavailable</h3>
                <p className="text-slate-400 text-sm max-w-sm mx-auto">
                    {fetchErr || 'No air quality data returned for this city.'}
                </p>
            </div>
        );
    }

    const category = getAqiCategory(aqiData.aqi);
    const colors = colorClasses[category.color as keyof typeof colorClasses];

    // Gauge bar — European AQI caps at 500 but usually under 150 for India
    const gaugePercent = Math.min(100, (aqiData.aqi / 150) * 100);

    // Format update time
    const updateTime = aqiData.time
        ? new Date(aqiData.time).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })
        : '—';

    const pollutants = [
        { label: 'PM2.5', value: aqiData.pm25.toFixed(1), unit: 'µg/m³', limit: 25, icon: '🔴' },
        { label: 'PM10', value: aqiData.pm10.toFixed(1), unit: 'µg/m³', limit: 50, icon: '🟠' },
        { label: 'NO₂', value: aqiData.no2.toFixed(1), unit: 'µg/m³', limit: 200, icon: '🟡' },
        { label: 'O₃', value: aqiData.o3.toFixed(1), unit: 'µg/m³', limit: 120, icon: '🟢' },
        { label: 'SO₂', value: aqiData.so2.toFixed(1), unit: 'µg/m³', limit: 350, icon: '🟣' },
        { label: 'CO', value: (aqiData.co / 1000).toFixed(2), unit: 'mg/m³', limit: 10, icon: '⚫' },
    ];

    return (
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-xl font-bold text-white flex items-center">
                        <span className="text-2xl mr-2">🌫️</span>
                        Air Quality Index
                    </h3>
                    <p className="text-slate-400 text-sm mt-1">{cityName} • Live from Open-Meteo</p>
                </div>
                <div className={`px-4 py-2 rounded-lg border ${colors.bg} ${colors.border}`}>
                    <div className="text-xs font-medium opacity-70 text-white">Category</div>
                    <div className={`text-sm font-bold ${colors.text}`}>{category.name}</div>
                </div>
            </div>

            {/* Big AQI number */}
            <div className="text-center mb-4">
                <div className={`inline-block px-8 py-6 rounded-xl ${colors.bg} border-2 ${colors.border} relative`}>
                    <div className={`text-7xl font-black ${colors.text}`}>{Math.round(aqiData.aqi)}</div>
                    <div className="text-slate-400 text-xs mt-1">European AQI</div>
                    <div className="text-3xl absolute -top-3 -right-3">{category.emoji}</div>
                </div>
                <p className="text-slate-400 text-sm mt-3">{category.message}</p>
            </div>

            {/* Gauge bar */}
            <div className="mb-6">
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>Good (0)</span>
                    <span>Moderate (60)</span>
                    <span>Very Poor (100+)</span>
                </div>
                <div className="w-full h-3 bg-slate-700 rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all duration-700 ${colors.bar}`}
                        style={{ width: `${gaugePercent}%` }}
                    />
                </div>
            </div>

            {/* Pollutant grid */}
            <div className="grid grid-cols-3 gap-3 mb-4">
                {pollutants.map(p => {
                    const exceeded = parseFloat(p.value) > p.limit;
                    return (
                        <div
                            key={p.label}
                            className={`p-3 rounded-lg border ${exceeded ? 'bg-red-900/20 border-red-700/50' : 'bg-slate-700/50 border-slate-600'}`}
                        >
                            <div className="text-slate-400 text-xs flex items-center gap-1">
                                <span>{p.icon}</span> {p.label}
                            </div>
                            <div className={`text-lg font-bold ${exceeded ? 'text-red-400' : 'text-white'}`}>
                                {p.value}
                            </div>
                            <div className="text-slate-500 text-xs">{p.unit}</div>
                        </div>
                    );
                })}
            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-slate-700">
                <p className="text-slate-500 text-xs">
                    🛰️ Source: Open-Meteo Air Quality API (Copernicus CAMS) • Updated: {updateTime}
                </p>
            </div>
        </div>
    );
}

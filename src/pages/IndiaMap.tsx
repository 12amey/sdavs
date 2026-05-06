import React, { useState, useCallback, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Rectangle, useMap, useMapEvents } from 'react-leaflet';
import { useQuery } from '@tanstack/react-query';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { satelliteApi } from '../services/api';
import { AreaAnalysisPanel } from '../components/AreaAnalysisPanel';
import { DisasterOverlay } from '../components/DisasterOverlay';
import { INDIAN_CITIES, City } from '../utils/indianCities';
import { getAIEstimatedMetrics } from '../utils/environmentalAI';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({ iconUrl: icon, shadowUrl: iconShadow, iconSize: [25, 41], iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

const INDIA_BOUNDS: L.LatLngBoundsLiteral = [[6.0, 68.0], [37.5, 97.5]];

function isInIndiaBounds(lat: number, lng: number) {
    return lat >= 6.0 && lat <= 37.5 && lng >= 68.0 && lng <= 97.5;
}

async function reverseGeocode(lat: number, lng: number) {
    try {
        const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
            { headers: { 'Accept-Language': 'en' } }
        );
        return res.ok ? await res.json() : null;
    } catch { return null; }
}

function detectWater(geo: any): { isWater: boolean; waterType: string } {
    if (!geo) return { isWater: false, waterType: '' };
    const cls = (geo.class || '').toLowerCase();
    const type = (geo.type || '').toLowerCase();
    const name = (geo.display_name || '').toLowerCase();
    const waterTypes = ['water', 'river', 'lake', 'bay', 'sea', 'canal', 'stream', 'reservoir', 'ocean', 'wetland'];
    if (cls === 'waterway' || waterTypes.includes(type) || waterTypes.includes(cls)) {
        return { isWater: true, waterType: type || cls };
    }
    if (!geo.address?.country_code) {
        if (['sea', 'ocean', 'bay', 'gulf', 'strait'].some(w => name.includes(w))) {
            return { isWater: true, waterType: 'sea' };
        }
    }
    if (['river', 'lake', 'reservoir', 'sea', 'ocean', 'bay', 'gulf'].some(w => name.split(',')[0]?.includes(w))) {
        return { isWater: true, waterType: 'water body' };
    }
    return { isWater: false, waterType: '' };
}

const getMarkerIcon = (score: number) => {
    const color = score > 60 ? '#ef4444' : score > 30 ? '#f59e0b' : '#22c55e';
    return L.divIcon({
        className: 'custom-marker',
        html: `<div style="background:${color};width:14px;height:14px;border-radius:50%;border:2.5px solid white;box-shadow:0 0 10px ${color}44;"></div>`,
        iconSize: [14, 14], iconAnchor: [7, 7]
    });
};

let _toastId = 0;
interface Toast { id: number; type: 'error' | 'water' | 'info'; title: string; msg: string; }

const MapController = ({ children }: { children: (map: L.Map) => React.ReactNode }) => {
    const map = useMap(); return <>{children(map)}</>;
};

const AreaSelector = ({ isSelecting, onAreaSelected, firstPoint, setFirstPoint, setPreviewBounds }: any) => {
    const map = useMap();
    useMapEvents({
        click(e) {
            if (!isSelecting) return;
            const lat = Math.max(6.0, Math.min(37.5, e.latlng.lat));
            const lng = Math.max(68.0, Math.min(97.5, e.latlng.lng));
            const pt = L.latLng(lat, lng);
            if (!firstPoint) { setFirstPoint(pt); setPreviewBounds(null); }
            else { onAreaSelected(L.latLngBounds(firstPoint, pt)); setFirstPoint(null); setPreviewBounds(null); }
        },
        mousemove(e) {
            if (isSelecting && firstPoint) {
                const lat = Math.max(6.0, Math.min(37.5, e.latlng.lat));
                const lng = Math.max(68.0, Math.min(97.5, e.latlng.lng));
                setPreviewBounds(L.latLngBounds(firstPoint, L.latLng(lat, lng)));
            }
        }
    });
    useEffect(() => {
        if (!map) return;
        map.getContainer().style.cursor = isSelecting ? 'crosshair' : '';
        return () => { map.getContainer().style.cursor = ''; };
    }, [isSelecting, map]);
    return null;
};

const MapClickHandler = ({ isSelecting, onClick }: { isSelecting: boolean; onClick: (lat: number, lng: number) => void }) => {
    useMapEvents({ click(e) { if (!isSelecting) onClick(e.latlng.lat, e.latlng.lng); } });
    return null;
};

const TILE_LAYERS = {
    street: { url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', attr: '© OpenStreetMap contributors' },
    satellite: { url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', attr: '© Esri World Imagery' },
    terrain: { url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', attr: '© OpenTopoMap' },
};

// Check if a bounds rectangle is fully outside India
function isBoundsFullyOutsideIndia(bounds: L.LatLngBounds): boolean {
    const s = bounds.getSouth(), n = bounds.getNorth();
    const w = bounds.getWest(), e = bounds.getEast();
    return n < 6.0 || s > 37.5 || e < 68.0 || w > 97.5;
}

export default function IndiaMap() {
    const [isSelectingArea, setIsSelectingArea] = useState(false);
    const [firstClickPoint, setFirstClickPoint] = useState<L.LatLng | null>(null);
    const [previewBounds, setPreviewBounds] = useState<L.LatLngBounds | null>(null);
    const [selectedBounds, setSelectedBounds] = useState<L.LatLngBounds | null>(null);
    const [showDisasters, setShowDisasters] = useState(true);
    const [showAnalysisPanel, setShowAnalysisPanel] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [toasts, setToasts] = useState<Toast[]>([]);
    const [showHowItWorks, setShowHowItWorks] = useState(false);
    const [mapLayer, setMapLayer] = useState<'street' | 'satellite' | 'terrain'>('street');
    const [clickedLoc, setClickedLoc] = useState<{
        lat: number; lng: number; loading: boolean;
        displayName: string; isWater: boolean; waterType: string; address: any;
    } | null>(null);

    const { data: satelliteData } = useQuery({
        queryKey: ['satelliteData'],
        queryFn: () => satelliteApi.getSatelliteData(8.0, 38.0, 68.0, 98.0)
    });

    const mapPoints = React.useMemo(() => {
        const pm = new Map<string, any>();
        satelliteData?.forEach((d: any) => {
            const n = d.city || d.locationName;
            if (n && !pm.has(n)) {
                const score = (d.ndviValue || 0.5) * 60 + (100 - (d.floodRisk || 0)) * 0.4;
                pm.set(n, { ...d, riskScore: score, isEstimated: false });
            }
        });
        // Only show real data points now
        return Array.from(pm.values());
    }, [satelliteData]);

    const addToast = useCallback((type: Toast['type'], title: string, msg: string) => {
        const id = ++_toastId;
        setToasts(p => [...p.slice(-2), { id, type, title, msg }]);
        setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 5000);
    }, []);

    const handleMapClick = useCallback(async (lat: number, lng: number) => {
        if (!isInIndiaBounds(lat, lng)) {
            addToast('error', '⛔ Outside Monitoring Zone',
                'This location is outside India\'s boundary. Only Indian territory is monitored.');
            return;
        }
        setClickedLoc({ lat, lng, loading: true, displayName: '', isWater: false, waterType: '', address: null });
        const geo = await reverseGeocode(lat, lng);
        const { isWater, waterType } = detectWater(geo);

        if (geo?.address?.country_code && geo.address.country_code !== 'in') {
            addToast('error', '⛔ Non-India Territory',
                `Location is in ${geo.address.country || 'another country'}. Outside India monitoring scope.`);
            setClickedLoc(null);
            return;
        }

        const displayName = geo?.display_name?.split(',').slice(0, 3).join(', ') || `${lat.toFixed(3)}°N, ${lng.toFixed(3)}°E`;

        if (isWater) {
            addToast('water', '🌊 Water Body Detected',
                `${displayName.split(',')[0]} — This is a ${waterType}. Select adjacent land for environmental data.`);
        }

        setClickedLoc({ lat, lng, loading: false, displayName, isWater, waterType, address: geo?.address });
    }, [addToast]);

    const handleAreaSelected = useCallback(async (bounds: L.LatLngBounds) => {
        // Guard: fully outside India?
        if (isBoundsFullyOutsideIndia(bounds)) {
            addToast('error', '⛔ Outside India',
                'The selected area is entirely outside India\'s boundary. Only Indian territory is monitored.');
            setIsSelectingArea(false); setFirstClickPoint(null); setPreviewBounds(null);
            return;
        }

        // Check center via reverse geocode for water body detection
        const center = bounds.getCenter();
        const geo = await reverseGeocode(center.lat, center.lng);
        const { isWater, waterType } = detectWater(geo);

        if (geo?.address?.country_code && geo.address.country_code !== 'in') {
            addToast('error', '⛔ Non-India Territory',
                `Selected area center is in ${geo.address.country || 'another country'}. Only Indian territory is monitored.`);
            setIsSelectingArea(false); setFirstClickPoint(null); setPreviewBounds(null);
            return;
        }

        if (isWater) {
            addToast('water', '🌊 Water Body Detected',
                `The center of your selection is a ${waterType}. Analysis will still run — select adjacent land for best results.`);
        }

        setSelectedBounds(bounds);
        setIsSelectingArea(false);
        setShowAnalysisPanel(true);
        // ✅ KEY FIX: trigger analysis immediately
        setIsAnalyzing(true);
    }, [addToast]);

    const handleClosePanel = () => { setShowAnalysisPanel(false); setSelectedBounds(null); setPreviewBounds(null); setIsAnalyzing(false); };
    const handleCancelSelection = () => { setIsSelectingArea(false); setFirstClickPoint(null); setPreviewBounds(null); };

    const toastColors: Record<Toast['type'], string> = {
        error: 'rgba(239,68,68,0.97)', water: 'rgba(14,165,233,0.97)', info: 'rgba(99,102,241,0.97)'
    };
    const toastIcons: Record<Toast['type'], string> = { error: '⛔', water: '🌊', info: 'ℹ️' };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-white">🛰️ India Satellite Map</h1>
                    <p className="text-slate-400 text-sm mt-1">
                        {isSelectingArea
                            ? firstClickPoint ? '🟢 Click second point to complete selection' : '🎯 Click first point on the map'
                            : '📍 Click anywhere on India to explore location — ⬜ Select Area for deep analysis'}
                    </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex bg-slate-800 rounded-lg border border-slate-700 overflow-hidden text-xs">
                        {(['street', 'satellite', 'terrain'] as const).map(l => (
                            <button key={l} onClick={() => setMapLayer(l)}
                                className={`px-3 py-2 font-semibold capitalize transition-colors ${mapLayer === l ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>
                                {l === 'street' ? '🗺️' : l === 'satellite' ? '🛰️' : '⛰️'} {l}
                            </button>
                        ))}
                    </div>
                    <button onClick={() => setShowHowItWorks(!showHowItWorks)}
                        className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${showHowItWorks ? 'bg-cyan-600 text-white border-cyan-500' : 'bg-slate-700 text-slate-300 border-slate-600 hover:bg-slate-600'}`}>
                        ❓ How It Works
                    </button>
                    <button onClick={() => { if (isSelectingArea) handleCancelSelection(); else { setIsSelectingArea(true); setSelectedBounds(null); setShowAnalysisPanel(false); setClickedLoc(null); } }}
                        className={`px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-all ${isSelectingArea ? 'bg-yellow-500 text-black hover:bg-yellow-400' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
                        {isSelectingArea ? <>⬛ Cancel</> : <>⬜ Select Area</>}
                    </button>
                    <button onClick={() => setShowDisasters(!showDisasters)}
                        className={`px-4 py-2 rounded-lg transition-colors ${showDisasters ? 'bg-red-500/20 text-red-400 border border-red-500/50' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>
                        {showDisasters ? '🔴 Hide Disasters' : '⭕ Show Disasters'}
                    </button>
                </div>
            </div>

            {isSelectingArea && (
                <div className={`rounded-lg px-4 py-3 text-sm font-medium border flex items-center gap-3 ${firstClickPoint ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-300' : 'bg-blue-500/20 border-blue-500/50 text-blue-300'}`}>
                    {firstClickPoint
                        ? <><span className="text-2xl">🖱️</span><span><strong>First point set!</strong> Click second point to complete the rectangle.</span></>
                        : <><span className="text-2xl">📍</span><span><strong>Area Selection Mode</strong> — Click the first corner of your analysis rectangle.</span></>}
                </div>
            )}

            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-2 border border-slate-700 overflow-hidden relative">
                <MapContainer center={[22.5, 82.5]} zoom={5}
                    style={{ height: '620px', width: '100%', borderRadius: '0.75rem' }}
                    className="z-0" maxBounds={INDIA_BOUNDS} maxBoundsViscosity={0.8}>
                    <TileLayer url={TILE_LAYERS[mapLayer].url} attribution={TILE_LAYERS[mapLayer].attr} />

                    {/* City markers */}
                    {!isSelectingArea && mapPoints.map((pt: any) => (
                        <Marker key={pt.id} position={[pt.latitude, pt.longitude]} icon={getMarkerIcon(pt.riskScore)}>
                            <Popup>
                                <div className="p-3 min-w-[200px]">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="font-bold text-slate-800">📍 {pt.locationName || pt.city}</h3>
                                        {pt.isEstimated && <span className="text-[9px] font-black text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">AI EST</span>}
                                    </div>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between items-center p-2 rounded bg-slate-50 border border-slate-100">
                                            <span className="text-slate-500 font-medium">Health Index</span>
                                            <span className={`font-black text-lg ${pt.riskScore > 70 ? 'text-green-600' : pt.riskScore > 45 ? 'text-amber-600' : 'text-red-600'}`}>{Math.round(pt.riskScore)}</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 font-bold uppercase">
                                            <div>NDVI: {pt.ndviValue?.toFixed(3)}</div>
                                            <div>FLOOD: {pt.floodRisk}%</div>
                                        </div>
                                        <p className="text-[10px] text-slate-400 italic">Updated: {new Date(pt.analysisDate).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            </Popup>
                        </Marker>
                    ))}

                    {/* Clicked location markers */}
                    {clickedLoc && !clickedLoc.loading && (
                        <Circle center={[clickedLoc.lat, clickedLoc.lng]} radius={10000}
                            pathOptions={{ color: clickedLoc.isWater ? '#3b82f6' : '#06b6d4', fillColor: clickedLoc.isWater ? '#3b82f6' : '#06b6d4', fillOpacity: 0.25, weight: 2 }} />
                    )}

                    {firstClickPoint && isSelectingArea && (
                        <Circle center={firstClickPoint} radius={8000}
                            pathOptions={{ color: '#22c55e', fillColor: '#22c55e', fillOpacity: 0.8, weight: 3 }} />
                    )}
                    {previewBounds && isSelectingArea && firstClickPoint && (
                        <Rectangle bounds={previewBounds}
                            pathOptions={{ color: '#facc15', weight: 2, opacity: 0.9, fillOpacity: 0.1, dashArray: '6,6' }} />
                    )}
                    {selectedBounds && !isSelectingArea && (
                        <Rectangle bounds={selectedBounds}
                            pathOptions={{ color: '#22c55e', weight: 3, opacity: 0.9, fillOpacity: 0.12 }} />
                    )}

                    <MapClickHandler isSelecting={isSelectingArea} onClick={handleMapClick} />
                    <MapController>
                        {(map) => (
                            <>
                                {isSelectingArea && (
                                    <AreaSelector isSelecting={isSelectingArea} onAreaSelected={handleAreaSelected}
                                        firstPoint={firstClickPoint} setFirstPoint={setFirstClickPoint}
                                        previewBounds={previewBounds} setPreviewBounds={setPreviewBounds} />
                                )}
                                {showDisasters && !isSelectingArea && <DisasterOverlay map={map} />}
                            </>
                        )}
                    </MapController>
                </MapContainer>

                {/* Toast Notifications */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2 pointer-events-none" style={{ minWidth: 340, maxWidth: 400 }}>
                    {toasts.map(t => (
                        <div key={t.id} className="pointer-events-auto rounded-xl px-4 py-3 shadow-2xl border border-white/20 flex items-start gap-3 animate-fadeIn"
                            style={{ background: toastColors[t.type] }}>
                            <span className="text-xl mt-0.5 flex-shrink-0">{toastIcons[t.type]}</span>
                            <div className="flex-1 min-w-0">
                                <div className="text-white font-bold text-sm">{t.title}</div>
                                <div className="text-white/80 text-xs mt-0.5 leading-relaxed">{t.msg}</div>
                            </div>
                            <button onClick={() => setToasts(p => p.filter(x => x.id !== t.id))}
                                className="text-white/60 hover:text-white text-lg leading-none flex-shrink-0 ml-1">×</button>
                        </div>
                    ))}
                </div>

                {/* How It Works Panel */}
                {showHowItWorks && (
                    <div className="absolute top-4 left-4 z-[1000] bg-slate-900/97 backdrop-blur-xl rounded-2xl border border-cyan-500/30 p-5 shadow-2xl" style={{ maxWidth: 320 }}>
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-cyan-400 font-black text-xs uppercase tracking-widest">🛰️ How This Map Works</span>
                            <button onClick={() => setShowHowItWorks(false)} className="text-slate-400 hover:text-white text-xl leading-none">×</button>
                        </div>
                        <div className="space-y-3 text-[11px] text-slate-300">
                            {[
                                { icon: '📍', label: 'Click any land area', desc: 'to get reverse-geocoded location info, address, and coordinates.' },
                                { icon: '🌊', label: 'Water bodies', desc: 'rivers, lakes, seas are auto-detected and shown with a blue indicator.' },
                                { icon: '⛔', label: 'Outside India / ocean', desc: 'clicks show an error — only India territory is monitored.' },
                                { icon: '⬜', label: 'Select Area button', desc: 'draw a rectangle for in-depth environmental analysis of any region.' },
                                { icon: '🟢🟡🔴', label: 'City dots', desc: 'Green = healthy (70+), Amber = moderate (45-70), Red = critical (0-45).' },
                                { icon: '🗺️🛰️⛰️', label: 'Layer toggle', desc: 'switch between Street, Satellite imagery, and Terrain map views.' },
                            ].map((item, i) => (
                                <div key={i} className="flex gap-3 items-start">
                                    <span className="flex-shrink-0 text-base">{item.icon}</span>
                                    <div><span className="text-cyan-300 font-bold">{item.label}</span> — {item.desc}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Location Info Panel */}
                {clickedLoc && (
                    <div className="absolute bottom-24 right-4 z-[1000] bg-slate-900/97 backdrop-blur-xl rounded-2xl border p-4 shadow-2xl"
                        style={{ maxWidth: 280, borderColor: clickedLoc.isWater ? 'rgba(59,130,246,0.4)' : 'rgba(6,182,212,0.4)' }}>
                        <div className="flex items-center justify-between mb-3">
                            <span className="font-black text-xs uppercase tracking-wider" style={{ color: clickedLoc.isWater ? '#7dd3fc' : '#67e8f9' }}>
                                {clickedLoc.isWater ? '🌊 Water Body' : '📍 Location Info'}
                            </span>
                            <button onClick={() => setClickedLoc(null)} className="text-slate-400 hover:text-white text-base leading-none">×</button>
                        </div>
                        {clickedLoc.loading ? (
                            <div className="flex items-center gap-2 py-2">
                                <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                                <span className="text-slate-400 text-xs">Detecting location...</span>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <div className="text-xs font-bold leading-snug" style={{ color: clickedLoc.isWater ? '#bae6fd' : 'white' }}>
                                    {clickedLoc.displayName}
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    {[{ label: 'Lat', value: `${clickedLoc.lat.toFixed(4)}°N` }, { label: 'Lng', value: `${clickedLoc.lng.toFixed(4)}°E` }].map(({ label, value }) => (
                                        <div key={label} className="bg-white/5 rounded-lg p-2">
                                            <div className="text-slate-500 text-[9px] uppercase font-bold">{label}</div>
                                            <div className="text-white font-mono text-xs">{value}</div>
                                        </div>
                                    ))}
                                </div>
                                {clickedLoc.isWater ? (
                                    <div className="px-3 py-2 rounded-lg bg-blue-500/15 border border-blue-500/30 mt-1">
                                        <div className="text-blue-300 text-xs font-bold">💧 {clickedLoc.waterType || 'Water Area'}</div>
                                        <div className="text-blue-200/70 text-[10px] mt-0.5">Aquatic zone — land analysis unavailable. Select adjacent land to analyze.</div>
                                    </div>
                                ) : (
                                    <div className="px-3 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 mt-1">
                                        <div className="text-cyan-300 text-xs font-bold">✅ Land Territory</div>
                                        <div className="text-slate-400 text-[10px] mt-0.5">
                                            {clickedLoc.address?.state || clickedLoc.address?.county || ''}
                                            {clickedLoc.address?.state && ' · '}India
                                            <br />Use "Select Area" near this point for full analysis.
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Legend */}
                <div className="absolute bottom-6 left-4 z-[1000] bg-slate-900/90 backdrop-blur-md p-3 rounded-lg border border-slate-700 shadow-2xl">
                    <div className="text-[9px] font-black text-slate-400 uppercase mb-2 tracking-widest">Legend</div>
                    <div className="space-y-1.5">
                        {[
                            { c: '#22c55e', l: 'Optimal (70-100)' },
                            { c: '#f59e0b', l: 'Moderate (45-70)' },
                            { c: '#ef4444', l: 'Critical (0-45)' },
                            { c: '#3b82f6', l: 'Water Body' },
                        ].map(({ c, l }) => (
                            <div key={l} className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: c }} />
                                <span className="text-xs text-white">{l}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {showAnalysisPanel && (
                    <AreaAnalysisPanel bounds={selectedBounds} onClose={handleClosePanel} isAnalyzing={isAnalyzing} />
                )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    { icon: '📊', value: mapPoints.length, label: 'Indexed Locations' },
                    { icon: '🌍', value: 'All India', label: 'Coverage Area' },
                    { icon: '🛰️', value: 'Sentinel-2', label: 'Data Source' },
                ].map(({ icon, value, label }) => (
                    <div key={label} className="bg-slate-800/50 rounded-xl p-5 border border-slate-700 text-center">
                        <div className="text-3xl mb-2">{icon}</div>
                        <div className="text-2xl font-bold text-white">{value}</div>
                        <div className="text-slate-400 text-sm">{label}</div>
                    </div>
                ))}
                <div className={`rounded-xl p-5 border text-center cursor-pointer transition-all hover:scale-105 ${isSelectingArea ? 'bg-yellow-500/20 border-yellow-500/50' : 'bg-slate-800/50 border-slate-700 hover:border-blue-500/50'}`}
                    onClick={() => { if (isSelectingArea) handleCancelSelection(); else { setIsSelectingArea(true); setSelectedBounds(null); setShowAnalysisPanel(false); } }}>
                    <div className="text-3xl mb-2">{isSelectingArea ? '⬛' : '⬜'}</div>
                    <div className="text-lg font-bold text-white">{isSelectingArea ? 'Selecting...' : 'Select Area'}</div>
                    <div className="text-slate-400 text-sm">Click to analyze region</div>
                </div>
            </div>
        </div>
    );
}

import React, { useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Rectangle, useMap, useMapEvents } from 'react-leaflet';
import { useQuery } from '@tanstack/react-query';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { satelliteApi } from '../services/api';
import { AreaAnalysisPanel } from '../components/AreaAnalysisPanel';
import { DisasterOverlay } from '../components/DisasterOverlay';

// Fix for default marker icons in Leaflet with React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// India bounding box
const INDIA_BOUNDS: L.LatLngBoundsLiteral = [[6.0, 68.0], [37.5, 97.5]];

// Helper function for marker icons based on classification
const getMarkerIcon = (classification: string) => {
    let color = 'blue';
    if (classification === 'HEALTHY') color = 'green';
    else if (classification === 'MODERATE') color = 'orange';
    else if (classification === 'DEFORESTED' || classification === 'CRITICAL') color = 'red';

    return L.divIcon({
        className: 'custom-marker',
        html: `<div style="background-color: ${color}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.5);"></div>`,
        iconSize: [12, 12],
        iconAnchor: [6, 6]
    });
};

// Map Controller Component to expose map instance
const MapController = ({ children }: { children: (map: L.Map) => React.ReactNode }) => {
    const map = useMap();
    return <>{children(map)}</>;
};

// Area Selector Component — handles 2-click rectangle drawing with live preview
const AreaSelector = ({
    isSelecting,
    onAreaSelected,
    firstPoint,
    setFirstPoint,
    setPreviewBounds
}: any) => {
    const map = useMap();

    useMapEvents({
        click(e) {
            if (!isSelecting) return;

            // Clamp to India bounds
            const clampedLat = Math.max(6.0, Math.min(37.5, e.latlng.lat));
            const clampedLng = Math.max(68.0, Math.min(97.5, e.latlng.lng));
            const clampedLatLng = L.latLng(clampedLat, clampedLng);

            if (!firstPoint) {
                setFirstPoint(clampedLatLng);
                setPreviewBounds(null);
            } else {
                const bounds = L.latLngBounds(firstPoint, clampedLatLng);
                onAreaSelected(bounds);
                setFirstPoint(null);
                setPreviewBounds(null);
            }
        },

        mousemove(e) {
            if (isSelecting && firstPoint) {
                // Live preview rectangle from first point to current cursor
                const clampedLat = Math.max(6.0, Math.min(37.5, e.latlng.lat));
                const clampedLng = Math.max(68.0, Math.min(97.5, e.latlng.lng));
                const previewBounds = L.latLngBounds(firstPoint, L.latLng(clampedLat, clampedLng));
                setPreviewBounds(previewBounds);
            }
        }
    });

    // Set appropriate cursor
    React.useEffect(() => {
        if (!map) return;
        const container = map.getContainer();
        if (isSelecting) {
            container.style.cursor = firstPoint ? 'crosshair' : 'crosshair';
        } else {
            container.style.cursor = '';
        }
        return () => { container.style.cursor = ''; };
    }, [isSelecting, firstPoint, map]);

    return null;
};

export default function IndiaMap() {
    const [isSelectingArea, setIsSelectingArea] = useState(false);
    const [firstClickPoint, setFirstClickPoint] = useState<L.LatLng | null>(null);
    const [previewBounds, setPreviewBounds] = useState<L.LatLngBounds | null>(null);
    const [selectedBounds, setSelectedBounds] = useState<L.LatLngBounds | null>(null);
    const [showDisasters, setShowDisasters] = useState(true);
    const [showAnalysisPanel, setShowAnalysisPanel] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // Fetch satellite data for all of India
    const { data: satelliteData } = useQuery({
        queryKey: ['satelliteData'],
        queryFn: () => satelliteApi.getSatelliteData(8.0, 38.0, 68.0, 98.0)
    });

    const handleAreaSelected = useCallback((bounds: L.LatLngBounds) => {
        setSelectedBounds(bounds);
        setIsSelectingArea(false);
        setShowAnalysisPanel(true);
        setIsAnalyzing(true);

        // Give 800ms for the analyzing spinner, then let AreaAnalysisPanel handle it
        setTimeout(() => {
            setIsAnalyzing(false);
        }, 100); // AreaAnalysisPanel now handles its own loading state
    }, []);

    const handleClosePanel = () => {
        setShowAnalysisPanel(false);
        setSelectedBounds(null);
        setPreviewBounds(null);
    };

    const handleCancelSelection = () => {
        setIsSelectingArea(false);
        setFirstClickPoint(null);
        setPreviewBounds(null);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-white">🛰️ India Satellite Map</h1>
                    <p className="text-slate-400 text-sm mt-1">
                        {isSelectingArea
                            ? firstClickPoint
                                ? '🟢 Click second point to complete rectangle selection'
                                : '🎯 Click first point on India map to begin selection'
                            : 'Click "Select Area" to analyze any region of India'}
                    </p>
                </div>
                <div className="flex space-x-2">
                    <button
                        onClick={() => {
                            if (isSelectingArea) {
                                handleCancelSelection();
                            } else {
                                setIsSelectingArea(true);
                                setSelectedBounds(null);
                                setShowAnalysisPanel(false);
                            }
                        }}
                        className={`px-4 py-2 rounded-lg transition-all duration-200 font-semibold flex items-center gap-2 ${isSelectingArea
                            ? 'bg-yellow-500 text-black hover:bg-yellow-400'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                            }`}
                    >
                        {isSelectingArea ? (
                            <><span>⬛</span> Cancel Selection</>
                        ) : (
                            <><span>⬜</span> Select Area</>
                        )}
                    </button>
                    <button
                        onClick={() => setShowDisasters(!showDisasters)}
                        className={`px-4 py-2 rounded-lg transition-colors ${showDisasters
                            ? 'bg-red-500/20 text-red-400 border border-red-500/50'
                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                            }`}
                    >
                        {showDisasters ? '🔴 Hide Disasters' : '⭕ Show Disasters'}
                    </button>
                </div>
            </div>

            {/* Selection instruction banner */}
            {isSelectingArea && (
                <div className={`rounded-lg px-4 py-3 text-sm font-medium border flex items-center gap-3 ${firstClickPoint
                    ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-300'
                    : 'bg-blue-500/20 border-blue-500/50 text-blue-300'
                    }`}>
                    {firstClickPoint ? (
                        <>
                            <span className="text-2xl">🖱️</span>
                            <span>
                                <strong>First point set!</strong> Now click anywhere on the map to complete your selection rectangle.
                                A green dot shows your starting point.
                            </span>
                        </>
                    ) : (
                        <>
                            <span className="text-2xl">📍</span>
                            <span>
                                <strong>Area Selection Mode</strong> — Click anywhere on the India map to set the <strong>first corner</strong> of your analysis rectangle.
                            </span>
                        </>
                    )}
                </div>
            )}

            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-2 border border-slate-700 overflow-hidden relative">
                <MapContainer
                    center={[22.5, 82.5]}  // Center of India
                    zoom={5}               // Zoom to see all India
                    style={{ height: '620px', width: '100%', borderRadius: '0.75rem' }}
                    className="z-0"
                    maxBounds={INDIA_BOUNDS}
                    maxBoundsViscosity={0.8}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    {/* Satellite data markers */}
                    {!isSelectingArea && satelliteData?.map((point: any) => (
                        <Marker
                            key={point.id}
                            position={[point.latitude, point.longitude]}
                            icon={getMarkerIcon(point.classification)}
                        >
                            <Popup>
                                <div className="p-2">
                                    <h3 className="font-bold text-lg mb-2">
                                        📍 {point.locationName || point.city || `Location #${point.id}`}
                                    </h3>
                                    <div className="space-y-1 text-sm">
                                        <p className="text-xs text-gray-500">
                                            {point.latitude?.toFixed(4)}°N, {point.longitude?.toFixed(4)}°E
                                        </p>
                                        <p><strong>NDVI Value:</strong> <span className={
                                            point.ndviValue > 0.6 ? 'text-green-600 font-semibold' :
                                                point.ndviValue > 0.4 ? 'text-orange-600 font-semibold' :
                                                    'text-red-600 font-semibold'
                                        }>{point.ndviValue?.toFixed(3)}</span></p>
                                        <p><strong>Classification:</strong> {point.classification}</p>
                                        <p><strong>Date:</strong> {point.analysisDate ? new Date(point.analysisDate).toLocaleDateString() : 'N/A'}</p>
                                    </div>
                                </div>
                            </Popup>
                        </Marker>
                    ))}

                    {/* First click marker (green dot) */}
                    {firstClickPoint && isSelectingArea && (
                        <Circle
                            center={firstClickPoint}
                            radius={8000}
                            pathOptions={{
                                color: '#22c55e',
                                fillColor: '#22c55e',
                                fillOpacity: 0.8,
                                weight: 3
                            }}
                        />
                    )}

                    {/* Live preview rectangle (while moving mouse after first click) */}
                    {previewBounds && isSelectingArea && firstClickPoint && (
                        <Rectangle
                            bounds={previewBounds}
                            pathOptions={{
                                color: '#facc15',
                                weight: 2,
                                opacity: 0.9,
                                fillOpacity: 0.1,
                                dashArray: '6, 6'
                            }}
                        />
                    )}

                    {/* Final selected area rectangle */}
                    {selectedBounds && !isSelectingArea && (
                        <Rectangle
                            bounds={selectedBounds}
                            pathOptions={{
                                color: '#22c55e',
                                weight: 3,
                                opacity: 0.9,
                                fillOpacity: 0.12,
                            }}
                        />
                    )}

                    {/* Area Selector */}
                    <MapController>
                        {(map) => (
                            <>
                                {isSelectingArea && (
                                    <AreaSelector
                                        isSelecting={isSelectingArea}
                                        onAreaSelected={handleAreaSelected}
                                        firstPoint={firstClickPoint}
                                        setFirstPoint={setFirstClickPoint}
                                        previewBounds={previewBounds}
                                        setPreviewBounds={setPreviewBounds}
                                    />
                                )}
                                {showDisasters && !isSelectingArea && (
                                    <DisasterOverlay map={map} />
                                )}
                            </>
                        )}
                    </MapController>
                </MapContainer>

                {/* Analysis Panel */}
                {showAnalysisPanel && (
                    <AreaAnalysisPanel
                        bounds={selectedBounds}
                        onClose={handleClosePanel}
                        isAnalyzing={isAnalyzing}
                    />
                )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-5 border border-slate-700 text-center">
                    <div className="text-3xl mb-2">📍</div>
                    <div className="text-2xl font-bold text-white">{satelliteData?.length || 0}</div>
                    <div className="text-slate-400 text-sm">Total Locations</div>
                </div>
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-5 border border-slate-700 text-center">
                    <div className="text-3xl mb-2">🌍</div>
                    <div className="text-2xl font-bold text-white">All India</div>
                    <div className="text-slate-400 text-sm">Coverage Area</div>
                </div>
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-5 border border-slate-700 text-center">
                    <div className="text-3xl mb-2">🛰️</div>
                    <div className="text-2xl font-bold text-white">Sentinel-2</div>
                    <div className="text-slate-400 text-sm">Data Source</div>
                </div>
                <div
                    className={`backdrop-blur-sm rounded-xl p-5 border text-center cursor-pointer transition-all hover:scale-105 ${isSelectingArea
                        ? 'bg-yellow-500/20 border-yellow-500/50'
                        : 'bg-slate-800/50 border-slate-700 hover:border-blue-500/50'
                        }`}
                    onClick={() => {
                        if (isSelectingArea) {
                            handleCancelSelection();
                        } else {
                            setIsSelectingArea(true);
                            setSelectedBounds(null);
                            setShowAnalysisPanel(false);
                        }
                    }}
                >
                    <div className="text-3xl mb-2">{isSelectingArea ? '⬛' : '⬜'}</div>
                    <div className="text-lg font-bold text-white">{isSelectingArea ? 'Selecting...' : 'Select Area'}</div>
                    <div className="text-slate-400 text-sm">Click to analyze region</div>
                </div>
            </div>
        </div>
    );
}

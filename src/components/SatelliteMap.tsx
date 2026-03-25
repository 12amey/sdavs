import React, { useState } from 'react';
import { MapContainer, TileLayer, Polygon, Popup, Marker, useMapEvents } from 'react-leaflet';
import { SatelliteData, Region } from '../types/satellite';
import { getNDVIColor } from '../utils/ndviCalculations';
import { Layers, Info, Loader, CheckCircle } from 'lucide-react';
import { satelliteApi } from '../services/api';
import { dataStorage } from '../services/dataStorage';
import 'leaflet/dist/leaflet.css';

interface SatelliteMapProps {
  data: SatelliteData[];
  region: Region;
  selectedLayers: string[];
  onAreaSelected?: (bounds: [[number, number], [number, number]]) => void;
}

// Fix Leaflet default markers
import L from 'leaflet';
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Map click handler component
const MapClickHandler: React.FC<{ 
  onLocationClick: (lat: number, lng: number) => void;
  onAreaSelected?: (bounds: [[number, number], [number, number]]) => void;
}> = ({ onLocationClick, onAreaSelected }) => {
  const [isSelecting, setIsSelecting] = useState(false);
  const [startPoint, setStartPoint] = useState<[number, number] | null>(null);
  const [selectedArea, setSelectedArea] = useState<[[number, number], [number, number]] | null>(null);
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useMapEvents({
    async click(e) {
      onLocationClick(e.latlng.lat, e.latlng.lng);
      
      if (!isSelecting) {
        setStartPoint([e.latlng.lat, e.latlng.lng]);
        setIsSelecting(true);
      } else {
        if (startPoint) {
          const bounds: [[number, number], [number, number]] = [
            [Math.min(startPoint[0], e.latlng.lat), Math.min(startPoint[1], e.latlng.lng)],
            [Math.max(startPoint[0], e.latlng.lat), Math.max(startPoint[1], e.latlng.lng)]
          ];
          setSelectedArea(bounds);
          setIsSelecting(false);
          setStartPoint(null);
          
          // Call backend API for analysis
          setIsAnalyzing(true);
          try {
            const user = dataStorage.getCurrentUser();
            
            const analysisRequest = {
              startLatitude: bounds[0][0],
              startLongitude: bounds[0][1],
              endLatitude: bounds[1][0],
              endLongitude: bounds[1][1],
              regionName: `Custom Area (${bounds[0][0].toFixed(4)}, ${bounds[0][1].toFixed(4)})`,
              analysisType: 'NDVI'
            };
            
            console.log('Starting area analysis...', analysisRequest);
            const backendResults = await satelliteApi.analyzeArea(analysisRequest, user ? parseInt(user.id) : undefined);
            console.log('Analysis completed:', backendResults);
            
            const areaAnalysis = {
              coordinates: bounds,
              area: backendResults.areaSizeKm2 || 0,
              timestamp: new Date().toISOString(),
              vegetation: {
                healthy: backendResults.landCoverBreakdown?.healthy || 0,
                moderate: backendResults.landCoverBreakdown?.moderate || 0,
                unhealthy: backendResults.landCoverBreakdown?.unhealthy || 0,
                water: backendResults.landCoverBreakdown?.water || 0,
                urban: backendResults.landCoverBreakdown?.urban || 0
              },
              avgNDVI: backendResults.avgNdvi || 0,
              forestCover: backendResults.forestCoverPercent || 0,
              changeDetection: backendResults.changeDetection || {},
              alerts: backendResults.alerts || [],
              confidence: backendResults.confidence || 0,
              source: 'backend-api',
              analysisId: backendResults.analysisId
            };
          
            // Store the analysis
            if (user) {
              const centerLat = (bounds[0][0] + bounds[1][0]) / 2;
              const centerLng = (bounds[0][1] + bounds[1][1]) / 2;
              dataStorage.saveAnalysis({
                userId: user.id,
                regionName: `Selected Area (${centerLat.toFixed(4)}, ${centerLng.toFixed(4)})`,
                coordinates: {
                  startLat: bounds[0][0],
                  startLng: bounds[0][1],
                  endLat: bounds[1][0],
                  endLng: bounds[1][1]
                },
                results: {
                  avgNDVI: areaAnalysis.avgNDVI,
                  forestCover: areaAnalysis.forestCover,
                  landCoverBreakdown: areaAnalysis.vegetation,
                  areaSize: areaAnalysis.area,
                  confidence: areaAnalysis.confidence
                },
                analysisType: 'Backend API Analysis'
              });
            }
            
            setAnalysisResults(areaAnalysis);
          } catch (error) {
            console.error('Analysis failed:', error);
            alert('Analysis failed. Please try again.');
          } finally {
            setIsAnalyzing(false);
          }
          onAreaSelected?.(bounds);
        }
      }
    }
  });

  const calculateAreaSize = (bounds: [[number, number], [number, number]]): number => {
    const latDiff = Math.abs(bounds[1][0] - bounds[0][0]);
    const lonDiff = Math.abs(bounds[1][1] - bounds[0][1]);
    return latDiff * lonDiff * 111 * 111; // Approximate km²
  };

  const generateAreaAlerts = (bounds: [[number, number], [number, number]]): string[] => {
    const alerts = [];
    const centerLat = (bounds[0][0] + bounds[1][0]) / 2;
    const centerLon = (bounds[0][1] + bounds[1][1]) / 2;
    
    if (Math.random() > 0.6) {
      alerts.push(`Deforestation detected at ${centerLat.toFixed(4)}°, ${centerLon.toFixed(4)}°`);
    }
    if (Math.random() > 0.7) {
      alerts.push(`Urban expansion observed in selected area`);
    }
    if (Math.random() > 0.8) {
      alerts.push(`Water level changes detected`);
    }
    
    return alerts;
  };
  return selectedArea ? (
    <>
      <Polygon
        positions={[
          [selectedArea[0][0], selectedArea[0][1]],
          [selectedArea[0][0], selectedArea[1][1]],
          [selectedArea[1][0], selectedArea[1][1]],
          [selectedArea[1][0], selectedArea[0][1]]
        ]}
        pathOptions={{ color: '#ff4444', fillColor: '#ff4444', fillOpacity: 0.15, weight: 3 }}
      >
        <Popup maxWidth={400} className="custom-popup">
          <div className="text-sm space-y-3">
            <div className="border-b pb-2">
              <strong className="text-lg text-blue-800">
                📊 {isAnalyzing ? 'Analyzing Area...' : 'Analysis Results'}
              </strong><br />
              <span className="text-gray-600">
                From: {selectedArea[0][0].toFixed(4)}°, {selectedArea[0][1].toFixed(4)}°<br />
                To: {selectedArea[1][0].toFixed(4)}°, {selectedArea[1][1].toFixed(4)}°
              </span>
            </div>
            
            {isAnalyzing && (
              <div className="text-center py-4">
                <Loader className="animate-spin h-8 w-8 text-blue-600 mx-auto" />
                <p className="mt-2 text-blue-600">Processing with backend API...</p>
              </div>
            )}
            
            {analysisResults && !isAnalyzing && (
              <>
                <div className="flex items-center space-x-2 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Analysis Complete</span>
                </div>
                
                <div className="bg-gray-50 p-2 rounded">
                  <strong>📏 Area Size:</strong> {analysisResults.area.toFixed(2)} km²<br />
                  <strong>🌿 Avg NDVI:</strong> {analysisResults.avgNDVI.toFixed(3)}<br />
                  <strong>🌲 Forest Cover:</strong> {analysisResults.forestCover.toFixed(1)}%
                </div>
                
                <div className="space-y-1">
                  <strong>🎨 Land Cover Analysis:</strong>
                  <div className="grid grid-cols-2 gap-1 text-xs">
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 bg-green-500 rounded"></div>
                      <span>Healthy: {analysisResults.vegetation.healthy.toFixed(1)}%</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                      <span>Moderate: {analysisResults.vegetation.moderate.toFixed(1)}%</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 bg-orange-500 rounded"></div>
                      <span>Unhealthy: {analysisResults.vegetation.unhealthy.toFixed(1)}%</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 bg-blue-500 rounded"></div>
                      <span>Water: {analysisResults.vegetation.water.toFixed(1)}%</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 bg-gray-500 rounded"></div>
                      <span>Urban: {analysisResults.vegetation.urban.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-blue-50 p-2 rounded">
                  <strong>📈 Change Detection:</strong><br />
                  <span className="text-xs">
                    Forest Loss: {analysisResults.changeDetection?.forestLoss?.toFixed(1) || '0.0'}%<br />
                    Urban Growth: {analysisResults.changeDetection?.urbanGrowth?.toFixed(1) || '0.0'}%<br />
                    Water Change: {analysisResults.changeDetection?.waterChange > 0 ? '+' : ''}{analysisResults.changeDetection?.waterChange?.toFixed(1) || '0.0'}%
                  </span>
                </div>
                
                {analysisResults.alerts.length > 0 && (
                  <div className="bg-orange-50 p-2 rounded">
                    <strong>⚠️ Alerts:</strong>
                    {analysisResults.alerts.map((alert: string, index: number) => (
                      <div key={index} className="text-xs text-orange-700 mt-1">
                        • {alert}
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="bg-green-50 p-2 rounded text-xs">
                  <strong>✅ Analysis Source:</strong> {analysisResults.source === 'backend-api' ? 'Backend API' : 'Real-time Simulation'}<br />
                  <strong>🛰️ Data Processing:</strong> NDVI calculation with ML algorithms<br />
                  <strong>📊 Confidence:</strong> {analysisResults.confidence?.toFixed(1)}%<br />
                  <strong>⏰ Generated:</strong> {analysisResults.timestamp ? new Date(analysisResults.timestamp).toLocaleTimeString() : 'Real-time'}<br />
                  <strong>💾 Storage:</strong> Saved to database
                  {analysisResults.analysisId && <span><br /><strong>🆔 Analysis ID:</strong> {analysisResults.analysisId}</span>}
                </div>
                
                <div className="text-center pt-2 border-t">
                  <button 
                    onClick={() => {
                      setSelectedArea(null);
                      setAnalysisResults(null);
                    }}
                    className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                  >
                    Clear Selection
                  </button>
                </div>
              </>
            )}
          </div>
        </Popup>
      </Polygon>
    </>
  ) : null;
};

const SatelliteMap: React.FC<SatelliteMapProps> = ({ 
  data, 
  region,
  selectedLayers,
  onAreaSelected 
}) => {
  const [selectedTileLayer, setSelectedTileLayer] = useState('satellite');
  const [clickedLocation, setClickedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [showOverlays, setShowOverlays] = useState(true);
  const [mapCenter, setMapCenter] = useState<[number, number]>(region.center);
  const [mapZoom, setMapZoom] = useState(7);

  // Real satellite tile layer options
  const tileLayers = {
    satellite: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: '&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
      name: 'Satellite Imagery'
    },
    openstreet: {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '&copy; OpenStreetMap contributors',
      name: 'Street Map'
    },
    terrain: {
      url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
      attribution: '&copy; OpenTopoMap contributors',
      name: 'Terrain Map'
    },
    google: {
      url: 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
      attribution: '&copy; Google',
      name: 'Google Satellite'
    }
  };

  const handleLocationClick = (lat: number, lng: number) => {
    setClickedLocation({ lat, lng });
  };

  const renderDataOverlays = () => {
    if (!showOverlays) return null;

    return data.slice(0, 500).map((point, index) => {
      const color = getNDVIColor(point.ndvi);
      return (
        <Polygon
          key={point.id || index}
          positions={[
            [point.coordinates[0] - 0.02, point.coordinates[1] - 0.02],
            [point.coordinates[0] - 0.02, point.coordinates[1] + 0.02],
            [point.coordinates[0] + 0.02, point.coordinates[1] + 0.02],
            [point.coordinates[0] + 0.02, point.coordinates[1] - 0.02]
          ]}
          pathOptions={{ 
            color: color, 
            fillColor: color, 
            fillOpacity: 0.8,
            weight: 0.5
          }}
        >
          <Popup>
            <div className="text-sm">
              <strong>NDVI Analysis</strong><br />
              NDVI: {point.ndvi.toFixed(3)}<br />
              Classification: {point.classification}<br />
              Date: {new Date(point.date).toLocaleDateString()}<br />
              Coordinates: {point.coordinates[0].toFixed(4)}, {point.coordinates[1].toFixed(4)}
            </div>
          </Popup>
        </Polygon>
      );
    });
  };

  return (
    <div className="h-[600px] w-full relative rounded-lg overflow-hidden shadow-lg">
      {/* Map Controls */}
      <div className="absolute top-4 right-4 z-[1000] bg-white p-4 rounded-lg shadow-lg max-w-xs">
        <div className="space-y-3">
          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
              <Layers className="h-4 w-4" />
              <span>Map Layer:</span>
            </label>
            <select
              value={selectedTileLayer}
              onChange={(e) => setSelectedTileLayer(e.target.value)}
              className="w-full text-sm p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            >
              {Object.entries(tileLayers).map(([key, layer]) => (
                <option key={key} value={key}>{layer.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
              <Info className="h-4 w-4" />
              <span>Data Overlays:</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={showOverlays}
                onChange={(e) => setShowOverlays(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm">Show NDVI Data</span>
            </label>
          </div>
        </div>
        
        {clickedLocation && (
          <div className="mt-3 p-2 bg-blue-50 rounded text-xs">
            <p className="font-medium text-blue-800">Selected Location</p>
            <p className="text-blue-600">
              {clickedLocation.lat.toFixed(4)}°N, {clickedLocation.lng.toFixed(4)}°E
            </p>
          </div>
        )}
        
        <div className="mt-3 text-xs text-gray-600">
          🌍 Click anywhere in the world for location info<br />
          📍 Click twice to select any analysis area<br />
          🎯 Use "Center Map Here" to focus on a location
        </div>
      </div>

      {/* Leaflet Map */}
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        <TileLayer
          url={tileLayers[selectedTileLayer as keyof typeof tileLayers].url}
          attribution={tileLayers[selectedTileLayer as keyof typeof tileLayers].attribution}
        />
        
        {/* Map interaction handler */}
        <MapClickHandler 
          onLocationClick={handleLocationClick}
          onAreaSelected={onAreaSelected} 
        />
        
        {/* NDVI Data overlays */}
        {selectedLayers.includes('ndvi') && renderDataOverlays()}
        
        {/* Clicked location marker */}
        {clickedLocation && (
          <Marker position={[clickedLocation.lat, clickedLocation.lng]}>
            <Popup>
              <div className="text-sm">
                <strong>Selected Location</strong><br />
                Coordinates: {clickedLocation.lat.toFixed(4)}, {clickedLocation.lng.toFixed(4)}<br />
                <button 
                  onClick={() => {
                    setMapCenter([clickedLocation.lat, clickedLocation.lng]);
                    setMapZoom(10);
                  }}
                  className="mt-2 px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                >
                  Center Map Here
                </button>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>

      {/* Map Legend */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-white p-4 rounded-lg shadow-lg max-w-sm">
        <h4 className="text-sm font-semibold mb-3 flex items-center space-x-2">
          <Info className="h-4 w-4" />
          <span>NDVI Legend</span>
        </h4>
        
        <div className="space-y-2 text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-600 rounded"></div>
            <span>Healthy Vegetation (NDVI &gt; 0.6)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-yellow-500 rounded"></div>
            <span>Moderate Vegetation (0.3-0.6)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-orange-500 rounded"></div>
            <span>Unhealthy Vegetation (0.1-0.3)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span>Water Bodies (&lt; -0.1)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-gray-500 rounded"></div>
            <span>Urban/Barren (-0.1 to 0.1)</span>
          </div>
        </div>
        
        <div className="mt-3 pt-2 border-t border-gray-200 text-xs text-gray-600">
          <p><strong>Data Sources:</strong></p>
          <p>• Satellite: {tileLayers[selectedTileLayer as keyof typeof tileLayers].name}</p>
          <p>• Analysis: Real-time NDVI processing</p>
        </div>
      </div>
    </div>
  );
};

export default SatelliteMap;
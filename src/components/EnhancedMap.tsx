import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Polygon, Popup, Marker, useMapEvents } from 'react-leaflet';
import { SatelliteData, Region } from '../types/satellite';
import { getNDVIColor } from '../utils/ndviCalculations';
import { MapPin, Layers, Info } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

interface EnhancedMapProps {
  data: SatelliteData[];
  region: Region;
  selectedLayers: string[];
  onAreaSelected?: (bounds: [[number, number], [number, number]]) => void;
  overlayType: string;
}

// Custom hook for reverse geocoding (mock implementation)
const useReverseGeocoding = (lat: number, lng: number) => {
  const [locationName, setLocationName] = useState<string>('');
  
  useEffect(() => {
    // Mock reverse geocoding - in real app, use Google Maps API or similar
    const mockLocations = [
      { name: 'Mumbai Metropolitan Region', lat: 19.0760, lng: 72.8777 },
      { name: 'Pune District', lat: 18.5204, lng: 73.8567 },
      { name: 'Nashik Region', lat: 19.9975, lng: 73.7898 },
      { name: 'Nagpur Area', lat: 21.1458, lng: 79.0882 }
    ];
    
    const closest = mockLocations.reduce((prev, curr) => {
      const prevDist = Math.abs(prev.lat - lat) + Math.abs(prev.lng - lng);
      const currDist = Math.abs(curr.lat - lat) + Math.abs(curr.lng - lng);
      return currDist < prevDist ? curr : prev;
    });
    
    setLocationName(closest.name);
  }, [lat, lng]);
  
  return locationName;
};

// Map click handler component
const MapClickHandler: React.FC<{ 
  onLocationClick: (lat: number, lng: number) => void;
  onAreaSelected?: (bounds: [[number, number], [number, number]]) => void;
}> = ({ onLocationClick, onAreaSelected }) => {
  const [isSelecting, setIsSelecting] = useState(false);
  const [startPoint, setStartPoint] = useState<[number, number] | null>(null);
  const [selectedArea, setSelectedArea] = useState<[[number, number], [number, number]] | null>(null);

  useMapEvents({
    click(e) {
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
          onAreaSelected?.(bounds);
        }
      }
    }
  });

  return selectedArea ? (
    <Polygon
      positions={[
        [selectedArea[0][0], selectedArea[0][1]],
        [selectedArea[0][0], selectedArea[1][1]],
        [selectedArea[1][0], selectedArea[1][1]],
        [selectedArea[1][0], selectedArea[0][1]]
      ]}
      pathOptions={{ color: 'red', fillColor: 'red', fillOpacity: 0.2 }}
    >
      <Popup>
        <div className="text-sm">
          <strong>Selected Analysis Area</strong><br />
          Bounds: {selectedArea[0][0].toFixed(4)}, {selectedArea[0][1].toFixed(4)}<br />
          to {selectedArea[1][0].toFixed(4)}, {selectedArea[1][1].toFixed(4)}
        </div>
      </Popup>
    </Polygon>
  ) : null;
};

const EnhancedMap: React.FC<EnhancedMapProps> = ({ 
  data, 
  region, 
  selectedLayers,
  onAreaSelected,
  overlayType
}) => {
  const [selectedTileLayer, setSelectedTileLayer] = useState('satellite');
  const [clickedLocation, setClickedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [showOverlays, setShowOverlays] = useState(true);
  
  const locationName = useReverseGeocoding(
    clickedLocation?.lat || region.center[0], 
    clickedLocation?.lng || region.center[1]
  );

  // Enhanced tile layer options
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
    ndvi: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: '&copy; Esri - NDVI Overlay',
      name: 'NDVI Overlay'
    }
  };

  const handleLocationClick = (lat: number, lng: number) => {
    setClickedLocation({ lat, lng });
  };

  const renderOverlayData = () => {
    if (!showOverlays) return null;

    switch (overlayType) {
      case 'ndvi':
        return data.slice(0, 200).map((point, index) => {
          const color = getNDVIColor(point.ndvi);
          return (
            <Polygon
              key={point.id || index}
              positions={[
                [point.coordinates[0] - 0.01, point.coordinates[1] - 0.01],
                [point.coordinates[0] - 0.01, point.coordinates[1] + 0.01],
                [point.coordinates[0] + 0.01, point.coordinates[1] + 0.01],
                [point.coordinates[0] + 0.01, point.coordinates[1] - 0.01]
              ]}
              pathOptions={{ 
                color: color, 
                fillColor: color, 
                fillOpacity: 0.7,
                weight: 1
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
      
      case 'soilMoisture':
        // Mock soil moisture data
        return data.slice(0, 100).map((point, index) => {
          const moisture = Math.random();
          const color = `hsl(${200 + moisture * 60}, 70%, 50%)`;
          return (
            <Polygon
              key={`soil-${index}`}
              positions={[
                [point.coordinates[0] - 0.02, point.coordinates[1] - 0.02],
                [point.coordinates[0] - 0.02, point.coordinates[1] + 0.02],
                [point.coordinates[0] + 0.02, point.coordinates[1] + 0.02],
                [point.coordinates[0] + 0.02, point.coordinates[1] - 0.02]
              ]}
              pathOptions={{ 
                color: color, 
                fillColor: color, 
                fillOpacity: 0.6,
                weight: 1
              }}
            >
              <Popup>
                <div className="text-sm">
                  <strong>Soil Moisture</strong><br />
                  Moisture Level: {(moisture * 100).toFixed(1)}%<br />
                  Status: {moisture > 0.6 ? 'High' : moisture > 0.3 ? 'Medium' : 'Low'}
                </div>
              </Popup>
            </Polygon>
          );
        });
      
      default:
        return null;
    }
  };

  return (
    <div className="h-full w-full relative">
      {/* Enhanced Map Controls */}
      <div className="absolute top-4 right-4 z-[1000] bg-white p-4 rounded-lg shadow-lg max-w-xs">
        <div className="space-y-3">
          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
              <Layers className="h-4 w-4" />
              <span>Base Layer:</span>
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
              <span>Overlays:</span>
            </label>
            <div className="space-y-1">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={showOverlays}
                  onChange={(e) => setShowOverlays(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm">Show Data Overlays</span>
              </label>
            </div>
          </div>
        </div>
        
        {clickedLocation && (
          <div className="mt-3 p-2 bg-blue-50 rounded text-xs">
            <p className="font-medium text-blue-800">{locationName}</p>
            <p className="text-blue-600">
              {clickedLocation.lat.toFixed(4)}°N, {clickedLocation.lng.toFixed(4)}°E
            </p>
          </div>
        )}
        
        <div className="mt-3 text-xs text-gray-600">
          Click on map for location info<br />
          Click twice to select analysis area
        </div>
      </div>

      {/* Leaflet Map */}
      <MapContainer
        center={region.center}
        zoom={7}
        style={{ height: '100%', width: '100%' }}
        className="rounded-lg"
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
        
        {/* Data overlays */}
        {renderOverlayData()}
        
        {/* Clicked location marker */}
        {clickedLocation && (
          <Marker position={[clickedLocation.lat, clickedLocation.lng]}>
            <Popup>
              <div className="text-sm">
                <strong>{locationName}</strong><br />
                Coordinates: {clickedLocation.lat.toFixed(4)}, {clickedLocation.lng.toFixed(4)}<br />
                Click twice to select analysis area
              </div>
            </Popup>
          </Marker>
        )}
        
        {/* Region boundary */}
        <Polygon
          positions={[
            [region.bounds[0][0], region.bounds[0][1]],
            [region.bounds[0][0], region.bounds[1][1]],
            [region.bounds[1][0], region.bounds[1][1]],
            [region.bounds[1][0], region.bounds[0][1]]
          ]}
          pathOptions={{ 
            color: 'blue', 
            fillColor: 'transparent', 
            weight: 2,
            dashArray: '5, 5'
          }}
        >
          <Popup>
            <div className="text-sm">
              <strong>{region.name}</strong><br />
              Study Region Boundary
            </div>
          </Popup>
        </Polygon>
      </MapContainer>

      {/* Enhanced Legend */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-white p-4 rounded-lg shadow-lg max-w-sm">
        <h4 className="text-sm font-semibold mb-3 flex items-center space-x-2">
          <Info className="h-4 w-4" />
          <span>Map Legend - {overlayType.toUpperCase()}</span>
        </h4>
        
        {overlayType === 'ndvi' && (
          <div className="space-y-2 text-xs">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-600 rounded"></div>
              <span>Healthy Vegetation (NDVI > 0.6)</span>
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
              <span>Water Bodies (< -0.1)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-gray-500 rounded"></div>
              <span>Urban/Barren (-0.1 to 0.1)</span>
            </div>
          </div>
        )}
        
        {overlayType === 'soilMoisture' && (
          <div className="space-y-2 text-xs">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-blue-600 rounded"></div>
              <span>High Moisture (> 60%)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-blue-400 rounded"></div>
              <span>Medium Moisture (30-60%)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-blue-200 rounded"></div>
              <span>Low Moisture (< 30%)</span>
            </div>
          </div>
        )}
        
        <div className="mt-3 pt-2 border-t border-gray-200 text-xs text-gray-600">
          <p><strong>Data Sources:</strong></p>
          <p>• Satellite: {tileLayers[selectedTileLayer as keyof typeof tileLayers].name}</p>
          <p>• Analysis: Real-time processing</p>
        </div>
      </div>
    </div>
  );
};

export default EnhancedMap;
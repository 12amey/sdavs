import React from 'react';
import { Calendar, MapPin, BarChart3, Download, Settings } from 'lucide-react';

interface ControlPanelProps {
  selectedRegion: string;
  onRegionChange: (region: string) => void;
  dateRange: [Date, Date];
  onDateRangeChange: (range: [Date, Date]) => void;
  selectedLayers: string[];
  onLayerToggle: (layer: string) => void;
  analysisType: string;
  onAnalysisTypeChange: (type: string) => void;
  onExportMap: () => void;
  onExportReport: () => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  selectedRegion,
  onRegionChange,
  dateRange,
  onDateRangeChange,
  selectedLayers,
  onLayerToggle,
  analysisType,
  onAnalysisTypeChange,
  onExportMap,
  onExportReport
}) => {
  const regions = [
    { id: 'maharashtra', name: 'Maharashtra, India' },
    { id: 'karnataka', name: 'Karnataka, India' }
  ];

  const layers = [
    { id: 'ndvi', name: 'NDVI Analysis', color: '#228B22' },
    { id: 'classification', name: 'Land Classification', color: '#1E90FF' }
  ];

  const analysisTypes = [
    { id: 'ndvi', name: 'NDVI Trend' },
    { id: 'forestCover', name: 'Forest Cover' },
    { id: 'all', name: 'All Metrics' }
  ];

  return (
    <div className="bg-white p-6 rounded-lg shadow-md space-y-6">
      <div className="flex items-center space-x-2 mb-4">
        <Settings className="h-5 w-5 text-gray-600" />
        <h2 className="text-lg font-semibold text-gray-800">Analysis Controls</h2>
      </div>

      {/* Region Selection */}
      <div>
        <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
          <MapPin className="h-4 w-4" />
          <span>Select Region</span>
        </label>
        <select
          value={selectedRegion}
          onChange={(e) => onRegionChange(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
        >
          {regions.map(region => (
            <option key={region.id} value={region.id}>
              {region.name}
            </option>
          ))}
        </select>
      </div>

      {/* Date Range Selection */}
      <div>
        <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
          <Calendar className="h-4 w-4" />
          <span>Date Range</span>
        </label>
        <div className="space-y-2">
          <input
            type="date"
            value={dateRange[0].toISOString().split('T')[0]}
            onChange={(e) => onDateRangeChange([new Date(e.target.value), dateRange[1]])}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
          />
          <input
            type="date"
            value={dateRange[1].toISOString().split('T')[0]}
            onChange={(e) => onDateRangeChange([dateRange[0], new Date(e.target.value)])}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
          />
        </div>
      </div>

      {/* Layer Selection */}
      <div>
        <label className="text-sm font-medium text-gray-700 mb-3 block">Map Layers</label>
        <div className="space-y-2">
          {layers.map(layer => (
            <label key={layer.id} className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={selectedLayers.includes(layer.id)}
                onChange={() => onLayerToggle(layer.id)}
                className="rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <div className="flex items-center space-x-2">
                <div 
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: layer.color }}
                />
                <span className="text-sm text-gray-700">{layer.name}</span>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Analysis Type */}
      <div>
        <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
          <BarChart3 className="h-4 w-4" />
          <span>Analysis Type</span>
        </label>
        <select
          value={analysisType}
          onChange={(e) => onAnalysisTypeChange(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
        >
          {analysisTypes.map(type => (
            <option key={type.id} value={type.id}>
              {type.name}
            </option>
          ))}
        </select>
      </div>

      {/* Export Options */}
      <div className="pt-4 border-t border-gray-200">
        <label className="text-sm font-medium text-gray-700 mb-3 block">Export & Tools</label>
        <div className="space-y-2">
          <button
            onClick={() => alert('Area selection: Click twice on the map to select a custom analysis area')}
            className="w-full flex items-center justify-center space-x-2 p-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
          >
            <MapPin className="h-4 w-4" />
            <span>Select Area</span>
          </button>
          <button
            onClick={onExportMap}
            className="w-full flex items-center justify-center space-x-2 p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Export Map</span>
          </button>
          <button
            onClick={onExportReport}
            className="w-full flex items-center justify-center space-x-2 p-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Export Report</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;
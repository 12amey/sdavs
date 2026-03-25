import React from 'react';
import { BarChart3, TrendingUp, Activity, Droplet } from 'lucide-react';
import { TimeSeriesData, AnalysisResult } from '../types/satellite';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface AnalysisChartsProps {
  timeSeriesData: TimeSeriesData[];
  analysisResults: AnalysisResult[];
  selectedMetric: string;
}

const AnalysisCharts: React.FC<AnalysisChartsProps> = ({
  timeSeriesData,
  analysisResults,
  selectedMetric
}) => {
  const latestAnalysis = analysisResults[analysisResults.length - 1];

  // Generate mock time series chart data for visualization
  const generateChartData = () => {
    return timeSeriesData.slice(-12).map((data, index) => ({
      month: new Date(data.date).toLocaleDateString('en-US', { month: 'short' }),
      ndvi: data.ndvi,
      forest: data.forestCover,
      water: data.waterCover,
      urban: data.urbanCover
    }));
  };

  const chartData = generateChartData();

  return (
    <div className="space-y-6">
      {/* Summary Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="flex items-center space-x-2 mb-2">
            <Activity className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium text-gray-700">Avg NDVI</span>
          </div>
          <p className="text-2xl font-bold text-green-600">
            {latestAnalysis ? latestAnalysis.avgNDVI.toFixed(3) : '0.000'}
          </p>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="flex items-center space-x-2 mb-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium text-gray-700">Forest Cover</span>
          </div>
          <p className="text-2xl font-bold text-blue-600">
            {latestAnalysis ? latestAnalysis.totalForestCover.toFixed(1) : '0.0'}%
          </p>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="flex items-center space-x-2 mb-2">
            <Droplet className="h-5 w-5 text-cyan-600" />
            <span className="text-sm font-medium text-gray-700">Water Bodies</span>
          </div>
          <p className="text-2xl font-bold text-cyan-600">
            {latestAnalysis ? latestAnalysis.waterBodies.toFixed(1) : '0.0'}%
          </p>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="flex items-center space-x-2 mb-2">
            <BarChart3 className="h-5 w-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Urban Areas</span>
          </div>
          <p className="text-2xl font-bold text-gray-600">
            {latestAnalysis ? latestAnalysis.urbanAreas.toFixed(1) : '0.0'}%
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Time Series Analysis */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">
          Time Series Analysis - {selectedMetric.toUpperCase()}
        </h3>
        <div className="h-64">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey={selectedMetric === 'ndvi' ? 'ndvi' : selectedMetric} 
                  stroke="#10b981" 
                  strokeWidth={2}
                  dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                <div className="w-8 h-8 bg-green-500 rounded-full"></div>
              </div>
              <p className="text-gray-600">Loading time series data...</p>
            </div>
          )}
        </div>
      </div>

      {/* Current Land Cover Distribution */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">
          Current Land Cover Distribution
        </h3>
        <div className="h-64">
          {latestAnalysis ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { name: 'Healthy', value: latestAnalysis.healthyVegetation, fill: '#10b981' },
                { name: 'Moderate', value: latestAnalysis.moderateVegetation, fill: '#f59e0b' },
                { name: 'Unhealthy', value: latestAnalysis.unhealthyVegetation, fill: '#ef4444' },
                { name: 'Water', value: latestAnalysis.waterBodies, fill: '#3b82f6' },
                { name: 'Urban', value: latestAnalysis.urbanAreas, fill: '#6b7280' }
              ]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => [`${Number(value).toFixed(1)}%`, 'Coverage']} />
                <Bar dataKey="value" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">No data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Forest Cover Trend */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">
          Monthly Forest Cover Trend
        </h3>
        <div className="h-64">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [`${Number(value).toFixed(1)}%`, 'Forest Cover']} />
                <Line 
                  type="monotone" 
                  dataKey="forest" 
                  stroke="#059669" 
                  strokeWidth={3}
                  dot={{ fill: '#059669', strokeWidth: 2, r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                <div className="w-8 h-8 bg-blue-500 rounded-full"></div>
              </div>
              <p className="text-gray-600">Loading forest trend data...</p>
            </div>
          )}
        </div>
      </div>

      {/* Vegetation Health Comparison */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">
          NDVI Health Comparison
        </h3>
        <div className="h-64">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis domain={[0, 1]} />
                <Tooltip formatter={(value) => [Number(value).toFixed(3), 'NDVI']} />
                <Line 
                  type="monotone" 
                  dataKey="ndvi" 
                  stroke="#8b5cf6" 
                  strokeWidth={3}
                  dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                <div className="w-8 h-8 bg-purple-500 rounded-full"></div>
              </div>
              <p className="text-gray-600">Loading vegetation health data...</p>
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
};

export default AnalysisCharts;
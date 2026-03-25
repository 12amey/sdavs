import React, { useState, useEffect } from 'react';
import { Satellite, Globe, Database, Brain, Activity, Zap, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { satelliteApi } from '../services/api';
import { realSatelliteAPI } from '../services/realSatelliteAPI';
import { advancedML } from '../services/advancedMLModels';

interface RealDataDashboardProps {
  onDataSourceChange: (source: string) => void;
}

const RealDataDashboard: React.FC<RealDataDashboardProps> = ({ onDataSourceChange }) => {
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [realDataStats, setRealDataStats] = useState<any>(null);
  const [mlModelStatus, setMLModelStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDataSource, setSelectedDataSource] = useState('multi-source');

  useEffect(() => {
    loadSystemStatus();
    const interval = setInterval(loadSystemStatus, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadSystemStatus = async () => {
    try {
      setIsLoading(true);
      
      // Get comprehensive system status from REAL backend
      const [backendHealth, apiStatus, models] = await Promise.all([
        satelliteApi.healthCheck(),
        realSatelliteAPI.getAPIStatus(),
        Promise.resolve(advancedML.getAvailableModels())
      ]);

      // Transform backend health response to expected format
      setSystemStatus({
        status: backendHealth.status === 'OK' ? 'HEALTHY' : 'DEGRADED',
        database: {
          connected: backendHealth.status === 'OK',
          responseTime: 50 // placeholder
        },
        performance: {
          activeAnalyses: 0,
          avgProcessingTime: 100
        }
      });
      setRealDataStats(apiStatus);
      setMLModelStatus(models);
    } catch (error) {
      console.error('Error loading system status:', error);
      setSystemStatus({
        status: 'ERROR',
        database: {
          connected: false,
          responseTime: 0
        },
        performance: {
          activeAnalyses: 0,
          avgProcessingTime: 0
        }
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDataSourceChange = (source: string) => {
    setSelectedDataSource(source);
    onDataSourceChange(source);
  };

  const getStatusColor = (status: boolean | string) => {
    if (typeof status === 'boolean') {
      return status ? 'text-green-500' : 'text-red-500';
    }
    return status === 'HEALTHY' ? 'text-green-500' : 'text-yellow-500';
  };

  const getStatusIcon = (status: boolean | string) => {
    if (typeof status === 'boolean') {
      return status ? CheckCircle : AlertTriangle;
    }
    return status === 'HEALTHY' ? CheckCircle : Clock;
  };

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-xl">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Satellite className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading real-time system status...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* System Overview */}
      <div className="bg-gradient-to-br from-white via-blue-50 to-purple-50 p-6 rounded-xl shadow-xl border border-blue-200/50">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
            <Database className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            🛰️ Real-Time System Status
          </h2>
        </div>

        {systemStatus && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="p-4 bg-white rounded-lg shadow-md border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">System Health</p>
                  <p className={`text-lg font-bold ${getStatusColor(systemStatus.status)}`}>
                    {systemStatus.status}
                  </p>
                </div>
                {React.createElement(getStatusIcon(systemStatus.status), { 
                  className: `h-8 w-8 ${getStatusColor(systemStatus.status)}` 
                })}
              </div>
            </div>

            <div className="p-4 bg-white rounded-lg shadow-md border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Database</p>
                  <p className={`text-lg font-bold ${getStatusColor(systemStatus.database?.connected)}`}>
                    {systemStatus.database?.connected ? 'Connected' : 'Disconnected'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {systemStatus.database?.responseTime?.toFixed(0)}ms response
                  </p>
                </div>
                <Database className={`h-8 w-8 ${getStatusColor(systemStatus.database?.connected)}`} />
              </div>
            </div>

            <div className="p-4 bg-white rounded-lg shadow-md border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Analyses</p>
                  <p className="text-lg font-bold text-blue-600">
                    {systemStatus.performance?.activeAnalyses || 0}
                  </p>
                  <p className="text-xs text-gray-500">
                    Avg: {systemStatus.performance?.avgProcessingTime?.toFixed(0) || 0}ms
                  </p>
                </div>
                <Activity className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Real Satellite Data Sources */}
      <div className="bg-gradient-to-br from-white via-green-50 to-blue-50 p-6 rounded-xl shadow-xl border border-green-200/50">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg">
            <Globe className="h-6 w-6 text-white" />
          </div>
          <h3 className="text-xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            🌍 Real Satellite Data Sources
          </h3>
        </div>

        {realDataStats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {Object.entries(realDataStats).map(([key, status]: [string, any]) => (
              <div key={key} className="p-4 bg-white rounded-lg shadow-md border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-semibold text-gray-800">{status.provider}</p>
                    <p className="text-sm text-gray-600">{key.replace('_', ' ')}</p>
                  </div>
                  {React.createElement(getStatusIcon(status.available), { 
                    className: `h-6 w-6 ${getStatusColor(status.available)}` 
                  })}
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Requests/Hour:</span>
                    <span className="font-medium">{status.requestsThisHour}/{status.rateLimit}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${status.available ? 'bg-green-500' : 'bg-red-500'}`}
                      style={{ width: `${(status.requestsThisHour / status.rateLimit) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Data Source Selection */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-800">Select Data Source:</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { id: 'multi-source', name: 'Multi-Source', icon: Globe },
              { id: 'nasa-landsat', name: 'NASA Landsat', icon: Satellite },
              { id: 'esa-sentinel', name: 'ESA Sentinel', icon: Satellite },
              { id: 'isro-bhuvan', name: 'ISRO Bhuvan', icon: Satellite }
            ].map((source) => {
              const Icon = source.icon;
              return (
                <button
                  key={source.id}
                  onClick={() => handleDataSourceChange(source.id)}
                  className={`p-3 rounded-lg border-2 transition-all duration-300 ${
                    selectedDataSource === source.id
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                  }`}
                >
                  <Icon className="h-6 w-6 mx-auto mb-2" />
                  <p className="text-sm font-medium">{source.name}</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ML Models Status */}
      <div className="bg-gradient-to-br from-white via-purple-50 to-pink-50 p-6 rounded-xl shadow-xl border border-purple-200/50">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg">
            <Brain className="h-6 w-6 text-white" />
          </div>
          <h3 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            🤖 Advanced ML Models
          </h3>
        </div>

        {mlModelStatus && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mlModelStatus.map((model: any, index: number) => (
              <div key={index} className="p-4 bg-white rounded-lg shadow-md border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-semibold text-gray-800">{model.name}</p>
                    <p className="text-sm text-gray-600">{model.type} v{model.version}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-600">{model.accuracy}%</p>
                    <p className="text-xs text-gray-500">Accuracy</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm">
                    <p className="text-gray-600">Training Data:</p>
                    <p className="font-medium text-gray-800">{model.trainingData}</p>
                  </div>
                  <div className="text-sm">
                    <p className="text-gray-600">Last Updated:</p>
                    <p className="font-medium text-gray-800">
                      {new Date(model.lastUpdated).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-br from-white via-orange-50 to-red-50 p-6 rounded-xl shadow-xl border border-orange-200/50">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg">
            <Zap className="h-6 w-6 text-white" />
          </div>
          <h3 className="text-xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
            ⚡ Quick Actions
          </h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => realSatelliteAPI.clearCache()}
            className="p-4 bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow"
          >
            <Database className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <p className="text-sm font-medium">Clear Cache</p>
          </button>

          <button
            onClick={loadSystemStatus}
            className="p-4 bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow"
          >
            <Activity className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <p className="text-sm font-medium">Refresh Status</p>
          </button>

          <button
            onClick={() => console.log('Running system diagnostics...')}
            className="p-4 bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow"
          >
            <CheckCircle className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <p className="text-sm font-medium">Run Diagnostics</p>
          </button>

          <button
            onClick={() => console.log('Exporting system logs...')}
            className="p-4 bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow"
          >
            <AlertTriangle className="h-8 w-8 text-orange-600 mx-auto mb-2" />
            <p className="text-sm font-medium">Export Logs</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default RealDataDashboard;
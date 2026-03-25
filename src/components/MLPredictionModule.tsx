import React, { useState } from 'react';
import { Brain, TrendingUp, AlertTriangle, Calendar, MapPin, Loader, BarChart3 } from 'lucide-react';
import { satelliteApi } from '../services/api';
import { dataStorage } from '../services/dataStorage';

interface MLPredictionModuleProps {
  onPredictionResult: (result: any) => void;
}

const MLPredictionModule: React.FC<MLPredictionModuleProps> = ({ onPredictionResult }) => {
  const [selectedPrediction, setSelectedPrediction] = useState('ndvi');
  const [coordinates, setCoordinates] = useState({ lat: 19.0760, lng: 72.8777 });
  const [timeframe, setTimeframe] = useState({ months: 12, years: 10 });
  const [isLoading, setIsLoading] = useState(false);
  const [predictionResults, setPredictionResults] = useState<any>(null);

  const predictionTypes = [
    { id: 'ndvi', name: 'NDVI Future Prediction', icon: TrendingUp, description: 'Predict vegetation health trends' },
    { id: 'deforestation', name: 'Deforestation Risk', icon: AlertTriangle, description: 'Assess deforestation probability' },
    { id: 'climate', name: 'Climate Impact', icon: BarChart3, description: 'Climate change effects on vegetation' }
  ];

  const runPrediction = async () => {
    setIsLoading(true);
    
    try {
      let result;
      
      switch (selectedPrediction) {
        case 'ndvi':
          result = await satelliteApi.predictNDVI(coordinates.lat, coordinates.lng, timeframe.months);
          break;
          
        case 'deforestation':
          result = await satelliteApi.predictDeforestation(
            coordinates.lat - 0.1,
            coordinates.lat + 0.1,
            coordinates.lng - 0.1,
            coordinates.lng + 0.1
          );
          break;
          
        case 'climate':
          result = await satelliteApi.predictClimate(coordinates.lat, coordinates.lng, timeframe.years);
          break;
          
        default:
          throw new Error('Invalid prediction type');
      }
      
      setPredictionResults(result);
      onPredictionResult(result);
      
      // Log the prediction activity
      const user = dataStorage.getCurrentUser();
      if (user) {
        dataStorage.logActivity(
          user.id, 
          'ml_prediction', 
          `Generated ${selectedPrediction} prediction for ${coordinates.lat.toFixed(4)}, ${coordinates.lng.toFixed(4)}`,
          result
        );
      }
      
    } catch (error) {
      console.error('Prediction failed:', error);
      alert('Prediction failed. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderPredictionResults = () => {
    if (!predictionResults) return null;

    switch (selectedPrediction) {
      case 'ndvi':
        return (
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-800">NDVI Future Predictions</h4>
            <div className="text-sm text-blue-600 mb-2">
              Location: {predictionResults.location?.latitude?.toFixed(4)}°N, {predictionResults.location?.longitude?.toFixed(4)}°E
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600">Prediction Method</p>
                <p className="font-medium">{predictionResults.predictionMethod}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600">Model Accuracy</p>
                <p className="font-medium">{predictionResults.accuracy?.toFixed(1)}%</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Next {timeframe.months} Months Predictions:</p>
              <div className="grid grid-cols-4 gap-2">
                {predictionResults.predictions?.slice(0, Math.min(12, timeframe.months)).map((pred: number, index: number) => (
                  <div key={index} className="text-center p-2 bg-gray-50 rounded">
                    <p className="text-xs text-gray-600">Month {index + 1}</p>
                    <p className="font-medium text-sm">{pred.toFixed(3)}</p>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Historical Data Points:</strong> {predictionResults.historicalDataPoints || 'N/A'}<br />
                <strong>Confidence Interval:</strong> ±{((predictionResults.confidenceIntervals?.[1] || 0) - (predictionResults.confidenceIntervals?.[0] || 0)).toFixed(3)}
              </p>
            </div>
          </div>
        );

      case 'deforestation':
        return (
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-800">Deforestation Risk Assessment</h4>
            <div className="text-sm text-blue-600 mb-2">
              Analysis Area: {(coordinates.lat - 0.1).toFixed(4)}° to {(coordinates.lat + 0.1).toFixed(4)}°N, {(coordinates.lng - 0.1).toFixed(4)}° to {(coordinates.lng + 0.1).toFixed(4)}°E
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-red-50 rounded-lg">
                <p className="text-sm text-gray-600">Risk Score</p>
                <p className="text-2xl font-bold text-red-600">{predictionResults.riskScore?.toFixed(1)}</p>
              </div>
              <div className={`p-3 rounded-lg ${
                predictionResults.riskLevel === 'LOW' ? 'bg-green-50' :
                predictionResults.riskLevel === 'MODERATE' ? 'bg-yellow-50' : 'bg-red-50'
              }`}>
                <p className="text-sm text-gray-600">Risk Level</p>
                <p className={`font-bold ${
                  predictionResults.riskLevel === 'LOW' ? 'text-green-600' :
                  predictionResults.riskLevel === 'MODERATE' ? 'text-yellow-600' : 'text-red-600'
                }`}>{predictionResults.riskLevel}</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Risk Factors:</p>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-sm">Average NDVI:</span>
                  <span className="font-medium">{predictionResults.factors?.avgNDVI?.toFixed(3)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Forest Cover:</span>
                  <span className="font-medium">{predictionResults.factors?.forestCover?.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Urban Proximity:</span>
                  <span className="font-medium">{predictionResults.factors?.urbanProximity?.toFixed(1)}%</span>
                </div>
              </div>
            </div>
            
            {predictionResults.recommendations && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Recommendations:</p>
                <ul className="text-sm space-y-1">
                  {predictionResults.recommendations.map((rec: string, index: number) => (
                    <li key={index} className="flex items-start space-x-2">
                      <span className="text-blue-500">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );

      case 'climate':
        return (
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-800">Climate Change Impact Prediction</h4>
            <div className="text-sm text-blue-600 mb-2">
              Location: {predictionResults.location?.latitude?.toFixed(4)}°N, {predictionResults.location?.longitude?.toFixed(4)}°E | Timeframe: {timeframe.years} years
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600">Current NDVI</p>
                <p className="text-xl font-bold">{predictionResults.currentNDVI?.toFixed(3)}</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <p className="text-sm text-gray-600">Predicted NDVI</p>
                <p className="text-xl font-bold">{predictionResults.predictedNDVI?.toFixed(3)}</p>
              </div>
            </div>
            
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Vegetation Change</p>
              <p className={`text-xl font-bold ${
                predictionResults.vegetationChange > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {predictionResults.vegetationChange > 0 ? '+' : ''}{predictionResults.vegetationChange?.toFixed(1)}%
              </p>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Climate Factors:</p>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-sm">Temperature Increase:</span>
                  <span className="font-medium">+{predictionResults.climateFactors?.temperatureIncrease?.toFixed(1)}°C</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Precipitation Change:</span>
                  <span className="font-medium">
                    {predictionResults.climateFactors?.precipitationChange > 0 ? '+' : ''}
                    {predictionResults.climateFactors?.precipitationChange?.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
            
            <div className="bg-purple-50 p-3 rounded-lg">
              <p className="text-sm text-purple-800">
                <strong>Model Type:</strong> {predictionResults.modelType || 'Climate-Vegetation Response Model'}<br />
                <strong>Impact Level:</strong> {predictionResults.impactLevel || 'MODERATE'}
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center space-x-2 mb-6">
        <Brain className="h-6 w-6 text-purple-600" />
        <h2 className="text-xl font-bold text-gray-800">ML Future Predictions</h2>
      </div>

      {/* Prediction Type Selection */}
      <div className="space-y-4 mb-6">
        <h3 className="text-lg font-semibold text-gray-700">Select Prediction Type</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {predictionTypes.map((type) => {
            const Icon = type.icon;
            return (
              <button
                key={type.id}
                onClick={() => setSelectedPrediction(type.id)}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  selectedPrediction === type.id
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-purple-300'
                }`}
              >
                <Icon className="h-6 w-6 mx-auto mb-2 text-purple-600" />
                <h4 className="font-medium text-gray-800">{type.name}</h4>
                <p className="text-sm text-gray-600 mt-1">{type.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Configuration */}
      <div className="space-y-4 mb-6">
        <h3 className="text-lg font-semibold text-gray-700">Configuration</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
            <input
              type="number"
              step="0.0001"
              value={coordinates.lat}
              onChange={(e) => setCoordinates(prev => ({ ...prev, lat: Number(e.target.value) }))}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
            <input
              type="number"
              step="0.0001"
              value={coordinates.lng}
              onChange={(e) => setCoordinates(prev => ({ ...prev, lng: Number(e.target.value) }))}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        {selectedPrediction === 'ndvi' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Prediction Period (Months)</label>
            <input
              type="number"
              min="1"
              max="60"
              value={timeframe.months}
              onChange={(e) => setTimeframe(prev => ({ ...prev, months: Number(e.target.value) }))}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
            />
          </div>
        )}

        {selectedPrediction === 'climate' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Prediction Period (Years)</label>
            <input
              type="number"
              min="1"
              max="50"
              value={timeframe.years}
              onChange={(e) => setTimeframe(prev => ({ ...prev, years: Number(e.target.value) }))}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
            />
          </div>
        )}
      </div>

      {/* Run Prediction Button */}
      <button
        onClick={runPrediction}
        disabled={isLoading}
        className="w-full flex items-center justify-center space-x-2 p-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-gray-400 transition-colors"
      >
        {isLoading ? <Loader className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
        <span>{isLoading ? 'Running ML Prediction...' : 'Run Prediction'}</span>
      </button>

      {/* Results */}
      {predictionResults && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          {renderPredictionResults()}
        </div>
      )}
    </div>
  );
};

export default MLPredictionModule;
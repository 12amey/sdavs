import React from 'react';
import { TrendingUp, TrendingDown, Activity, Droplet, Building, TreePine } from 'lucide-react';
import { AnalysisResult } from '../types/satellite';

interface StatisticsPanelProps {
  currentAnalysis: AnalysisResult | null;
  previousAnalysis: AnalysisResult | null;
}

const StatisticsPanel: React.FC<StatisticsPanelProps> = ({
  currentAnalysis,
  previousAnalysis
}) => {
  if (!currentAnalysis) return null;

  const calculateChange = (current: number, previous: number | undefined): number => {
    if (!previous) return 0;
    return ((current - previous) / previous) * 100;
  };

  const formatChange = (change: number): string => {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(1)}%`;
  };

  const stats = [
    {
      label: 'Forest Cover',
      value: `${currentAnalysis.totalForestCover.toFixed(1)}%`,
      change: calculateChange(currentAnalysis.totalForestCover, previousAnalysis?.totalForestCover),
      icon: TreePine,
      color: 'text-green-600'
    },
    {
      label: 'Healthy Vegetation',
      value: `${currentAnalysis.healthyVegetation.toFixed(1)}%`,
      change: calculateChange(currentAnalysis.healthyVegetation, previousAnalysis?.healthyVegetation),
      icon: Activity,
      color: 'text-green-500'
    },
    {
      label: 'Water Bodies',
      value: `${currentAnalysis.waterBodies.toFixed(1)}%`,
      change: calculateChange(currentAnalysis.waterBodies, previousAnalysis?.waterBodies),
      icon: Droplet,
      color: 'text-blue-600'
    },
    {
      label: 'Urban Areas',
      value: `${currentAnalysis.urbanAreas.toFixed(1)}%`,
      change: calculateChange(currentAnalysis.urbanAreas, previousAnalysis?.urbanAreas),
      icon: Building,
      color: 'text-gray-600'
    }
  ];

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">Current Statistics</h3>
      <div className="grid grid-cols-2 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          const isPositive = stat.change >= 0;
          const TrendIcon = isPositive ? TrendingUp : TrendingDown;
          
          return (
            <div key={index} className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <Icon className={`h-5 w-5 ${stat.color}`} />
                <div className={`flex items-center space-x-1 text-xs ${
                  isPositive ? 'text-green-600' : 'text-red-600'
                }`}>
                  <TrendIcon className="h-3 w-3" />
                  <span>{formatChange(stat.change)}</span>
                </div>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-gray-600">{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Average NDVI:</strong> {currentAnalysis.avgNDVI.toFixed(3)}
        </p>
        <p className="text-xs text-blue-600 mt-1">
          Analysis date: {new Date(currentAnalysis.date).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
};

export default StatisticsPanel;
export interface SatelliteData {
  id: number;
  latitude: number;
  longitude: number;
  ndviValue: number;
  ndwiValue?: number;
  redBand?: number;
  nirBand?: number;
  blueBand?: number;
  greenBand?: number;
  classification: 'HEALTHY' | 'MODERATE' | 'UNHEALTHY' | 'WATER' | 'URBAN';
  city?: string;
  state?: string;
  locationName?: string;
  analysisDate: string;
  createdAt: string;
  previousNdvi?: number;
  ndviChangePercent?: number;
  airQualityIndex?: number;
  pm25?: number;
  pm10?: number;
  deforestationRisk?: 'LOW' | 'MEDIUM' | 'HIGH';
  floodRisk?: number;
  temperature?: number;
  dataSource?: string;
}

export interface Region {
  id: string;
  name: string;
  bounds: [[number, number], [number, number]];
  center: [number, number];
}

export interface AnalysisResult {
  date: string;
  healthyVegetation: number;
  moderateVegetation: number;
  unhealthyVegetation: number;
  waterBodies: number;
  urbanAreas: number;
  totalForestCover: number;
  avgNDVI: number;
}
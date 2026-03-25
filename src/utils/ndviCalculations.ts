import { SatelliteData } from '../types/satellite';

// Standard NDVI calculation formula used by NASA, ESA, and other space agencies
// Formula: NDVI = (NIR - Red) / (NIR + Red)
// Range: -1.0 to +1.0
export const calculateNDVI = (red: number, nir: number): number => {
  if (red + nir === 0) return 0;
  return (nir - red) / (nir + red);
};

// Classification thresholds based on scientific literature
// Source: NASA Earth Observatory, ESA Sentinel documentation
export const classifyNDVI = (ndvi: number): SatelliteData['classification'] => {
  if (ndvi > 0.6) return 'healthy';      // Dense vegetation (forests, crops)
  if (ndvi > 0.3) return 'moderate';     // Moderate vegetation (grasslands)
  if (ndvi > 0.1) return 'unhealthy';    // Sparse vegetation (shrublands)
  if (ndvi < -0.1) return 'water';       // Water bodies (rivers, lakes)
  return 'urban';                        // Urban areas, bare soil, rock
};

// Color scheme based on standard NDVI visualization practices
// Used by NASA, USGS, and other earth observation organizations
export const getNDVIColor = (ndvi: number): string => {
  if (ndvi > 0.6) return '#228B22'; // Forest Green - Dense vegetation
  if (ndvi > 0.3) return '#9ACD32'; // Yellow Green - Moderate vegetation
  if (ndvi > 0.1) return '#DAA520'; // Golden Rod - Sparse vegetation
  if (ndvi < -0.1) return '#1E90FF'; // Dodger Blue - Water bodies
  return '#696969'; // Dim Gray - Urban/barren areas
};

export const getClassificationColor = (classification: SatelliteData['classification']): string => {
  switch (classification) {
    case 'healthy': return '#228B22';
    case 'moderate': return '#9ACD32';
    case 'unhealthy': return '#DAA520';
    case 'water': return '#1E90FF';
    case 'urban': return '#696969';
    default: return '#CCCCCC';
  }
};

export const analyzeLandCoverChange = (
  beforeData: SatelliteData[], 
  afterData: SatelliteData[]
): {
  forestLoss: number;
  forestGain: number;
  urbanGrowth: number;
  waterChange: number;
} => {
  const beforeCounts = countClassifications(beforeData);
  const afterCounts = countClassifications(afterData);
  
  const forestBefore = beforeCounts.healthy + beforeCounts.moderate;
  const forestAfter = afterCounts.healthy + afterCounts.moderate;
  
  return {
    forestLoss: Math.max(0, forestBefore - forestAfter),
    forestGain: Math.max(0, forestAfter - forestBefore),
    urbanGrowth: afterCounts.urban - beforeCounts.urban,
    waterChange: afterCounts.water - beforeCounts.water
  };
};

const countClassifications = (data: SatelliteData[]) => {
  return data.reduce((acc, point) => {
    acc[point.classification] = (acc[point.classification] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
};
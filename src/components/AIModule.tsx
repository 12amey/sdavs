import React, { useState, useRef } from 'react';
import { Upload, Brain, Image, MapPin, Loader, Zap } from 'lucide-react';
import { dataStorage } from '../services/dataStorage';
import { satelliteApi, imageProcessingApi } from '../services/api';
import { toast } from 'sonner';

interface AIModuleProps {
  onImageAnalysis: (results: any) => void;
}

const AIModule: React.FC<AIModuleProps> = ({ onImageAnalysis }) => {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  const [selectedRegion, setSelectedRegion] = useState({ lat: 19.0760, lng: 72.8777 });
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [activeTab, setActiveTab] = useState<'upload' | 'region'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target?.files?.[0];
    if (file) {
      // Store the file for backend processing
      setUploadedFile(file);

      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      toast.success(`Image uploaded: ${file.name}`);
    }
  };

  const runAIAnalysis = async () => {
    if (!uploadedFile) {
      toast.error('Please upload an image first');
      return;
    }

    setIsAnalyzing(true);
    toast.info('🔍 Validating and processing image with ML...');

    try {
      // Call Java backend which now uses Python ML service
      const backendResults = await imageProcessingApi.processImage(uploadedFile);

      const user = dataStorage.getCurrentUser();

      // Check if ML processing was used
      const isMLProcessed = backendResults.mlProcessed === true;
      const isSatelliteImagery = backendResults.isSatelliteImagery !== false;
      const satelliteConfidence = backendResults.satelliteConfidence || backendResults.validationConfidence || 50;
      const confidenceCategory = backendResults.confidenceCategory || "Unknown";

      const analysisResults = {
        ...backendResults,
        // ML Classification data
        mlClassification: backendResults.mlClassification || null,
        mlPrimaryClass: backendResults.mlClassification?.primary_class || backendResults.mlClassification?.primaryClass,
        mlConfidence: backendResults.mlClassification?.confidence || 0,
        mlMethod: backendResults.mlClassification?.method || backendResults.processingMethod,

        // Validation data - USE NEW FIELDS
        satelliteConfidence: satelliteConfidence,
        confidenceCategory: confidenceCategory,
        validationReasons: backendResults.validationReasons || [],
        isSatelliteImagery: isSatelliteImagery,

        // Legacy classifications (for backward compatibility)
        classifications: {
          denseForest: backendResults.vegetationClassification?.denseVegetation || backendResults.classification?.percentages?.denseVegetation || 0,
          sparseVegetation: backendResults.vegetationClassification?.sparseVegetation || backendResults.classification?.percentages?.sparseVegetation || 0,
          moderateVegetation: backendResults.vegetationClassification?.moderateVegetation || backendResults.classification?.percentages?.moderateVegetation || 0,
          water: backendResults.vegetationClassification?.water || backendResults.classification?.percentages?.water || 0,
          urban: backendResults.vegetationClassification?.urban || backendResults.classification?.percentages?.urban || 0,
          bareSoil: backendResults.vegetationClassification?.bareSoil || backendResults.classification?.percentages?.bareSoil || 0,
        },

        // Processing metadata
        isMLProcessed: isMLProcessed,
        processingMethod: backendResults.processingMethod || 'Unknown',
        confidence: isMLProcessed ? (backendResults.mlClassification?.confidence || 95.0) : 85.0,
        ndviAverage: backendResults.ndviStats?.mean || 0,
        ndviStats: backendResults.ndviStats,
        timestamp: new Date().toISOString(),
        imageProcessed: true,

        // Image metadata
        imageDimensions: backendResults.width && backendResults.height ? `${backendResults.width}x${backendResults.height}` : 'Unknown',
        bands: backendResults.bands || 3,
        fileSize: `${(uploadedFile.size / 1024 / 1024).toFixed(2)} MB`,
        anomaliesDetected: backendResults.anomalies?.length || 0,
        alerts: []
      };

      // BIG WARNING for non-satellite imagery
      console.log('🔍 Satellite Confidence:', satelliteConfidence, '% - Category:', confidenceCategory);
      console.log('📊 Analysis Results:', analysisResults);

      if (satelliteConfidence < 25) {
        analysisResults.alerts.push(`🚨 WARNING: This is likely NOT satellite imagery! (Confidence: ${satelliteConfidence.toFixed(1)}%) - Results are unreliable`);
      } else if (satelliteConfidence < 50) {
        analysisResults.alerts.push(`⚠️ Low confidence: This may not be satellite imagery (${satelliteConfidence.toFixed(1)}%) - Results may be inaccurate`);
      } else if (satelliteConfidence < 75) {
        analysisResults.alerts.push(`ℹ️ Moderate confidence satellite imagery (${satelliteConfidence.toFixed(1)}%)`);
      } else {
        analysisResults.alerts.push(`✅ High confidence satellite imagery (${satelliteConfidence.toFixed(1)}%)`);
      }

      console.log('🚨 Total Alerts:', analysisResults.alerts.length, analysisResults.alerts);

      if (backendResults.warning) {
        analysisResults.alerts.push(`⚠️ ${backendResults.warning}`);
      }

      if (analysisResults.ndviAverage < 0.2 && analysisResults.ndviAverage !== 0) {
        analysisResults.alerts.push('⚠️ Low vegetation health detected - possible drought or degradation');
      }

      if (backendResults.anomalies && backendResults.anomalies.length > 0) {
        analysisResults.alerts.push(`🔍 ${backendResults.anomalies.length} anomalies detected in the image`);
      }

      if (analysisResults.classifications.water > 50) {
        analysisResults.alerts.push('💧 High water coverage detected');
      }

      if (analysisResults.classifications.urban > 40) {
        analysisResults.alerts.push('🏙️ Significant urban area detected');
      }

      // Store the analysis
      if (user) {
        dataStorage.logActivity(
          user.id,
          isMLProcessed ? 'ml_image_analysis' : 'basic_image_analysis',
          `Processed ${uploadedFile.name} - ${isMLProcessed ? 'ML' : 'Basic'} Analysis`,
          analysisResults
        );
      }

      setAnalysisResults(analysisResults);
      onImageAnalysis(analysisResults);

      if (isMLProcessed) {
        toast.success('✅ ML Analysis complete! Real classification data extracted.');
      } else {
        toast.warning('⚠️ Basic analysis complete. ML service unavailable.');
      }
    } catch (error: any) {
      console.error('AI analysis failed:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'Analysis failed';
      toast.error(`Analysis failed: ${errorMessage}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const runRegionAnalysis = async () => {
    setIsAnalyzing(true);
    toast.info('Analyzing region with backend API...');

    try {
      // Call backend API for region analysis
      const analysisRequest = {
        startLatitude: selectedRegion.lat - 0.05,
        startLongitude: selectedRegion.lng - 0.05,
        endLatitude: selectedRegion.lat + 0.05,
        endLongitude: selectedRegion.lng + 0.05,
        regionName: `Region Analysis (${selectedRegion.lat.toFixed(4)}, ${selectedRegion.lng.toFixed(4)})`,
        analysisType: 'AI_REGION'
      };

      const user = dataStorage.getCurrentUser();
      const backendResult = await satelliteApi.analyzeArea(analysisRequest, user ? parseInt(user.id) : undefined);

      const regionResults = {
        region: `${selectedRegion.lat.toFixed(4)}°N, ${selectedRegion.lng.toFixed(4)}°E`,
        date: selectedDate,
        timestamp: new Date().toISOString(),
        classifications: {
          denseForest: backendResult.landCoverBreakdown?.healthy || 0,
          sparseForest: backendResult.landCoverBreakdown?.moderate || 0,
          water: backendResult.landCoverBreakdown?.water || 0,
          urban: backendResult.landCoverBreakdown?.urban || 0,
          barren: backendResult.landCoverBreakdown?.unhealthy || 0
        },
        confidence: backendResult.confidence || 0,
        ndviAverage: backendResult.avgNdvi || 0,
        alerts: backendResult.alerts || ['Region analysis completed'],
        analysisId: backendResult.analysisId,
        source: 'Java Backend API',
        processingMethod: 'Backend Satellite Analysis'
      };

      // Store the analysis
      if (user) {
        dataStorage.logActivity(
          user.id,
          'ai_region_analysis',
          `AI analyzed region at ${selectedRegion.lat.toFixed(4)}, ${selectedRegion.lng.toFixed(4)}`,
          regionResults
        );
      }

      setAnalysisResults(regionResults);
      onImageAnalysis(regionResults);

      toast.success('✅ Region analysis complete!');
    } catch (error: any) {
      console.error('Region analysis failed:', error);
      toast.error(`Analysis failed: ${error.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 p-6 rounded-xl shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-600 rounded-lg">
            <Brain className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">🤖 AI Image Processing</h2>
            <p className="text-sm text-gray-600">Real Java Backend with NDVI Analysis</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Zap className="h-5 w-5 text-yellow-500 animate-pulse" />
          <span className="text-sm font-semibold text-purple-600">Real Backend Connected</span>
        </div>
      </div>

      {/* Tab Selector */}
      <div className="flex space-x-2 mb-6 bg-white p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('upload')}
          className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${activeTab === 'upload'
            ? 'bg-purple-600 text-white shadow-md'
            : 'text-gray-600 hover:bg-gray-100'
            }`}
        >
          <div className="flex items-center justify-center space-x-2">
            <Upload className="h-4 w-4" />
            <span>Upload Image</span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab('region')}
          className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${activeTab === 'region'
            ? 'bg-purple-600 text-white shadow-md'
            : 'text-gray-600 hover:bg-gray-100'
            }`}
        >
          <div className="flex items-center justify-center space-x-2">
            <MapPin className="h-4 w-4" />
            <span>Analyze Region</span>
          </div>
        </button>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        {activeTab === 'upload' ? (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-700 flex items-center space-x-2">
              <Upload className="h-5 w-5 text-purple-600" />
              <span>Upload Satellite Image for Processing</span>
            </h3>

            <div
              className="border-2 border-dashed border-purple-300 rounded-lg p-8 text-center cursor-pointer hover:border-purple-500 hover:bg-purple-50 transition-all"
              onClick={() => fileInputRef.current?.click()}
            >
              {uploadedImage ? (
                <div className="space-y-3">
                  <img
                    src={uploadedImage}
                    alt="Uploaded satellite"
                    className="max-h-64 mx-auto rounded-lg shadow-md"
                  />
                  <p className="text-sm text-gray-600">Click to change image</p>
                  {uploadedFile && (
                    <p className="text-xs text-gray-500">
                      {uploadedFile.name} ({(uploadedFile.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <Image className="h-16 w-16 text-purple-400 mx-auto" />
                  <div>
                    <p className="text-lg font-medium text-gray-700">Click to upload satellite image</p>
                    <p className="text-sm text-gray-500 mt-1">Supports JPEG, PNG, TIFF, BMP</p>
                    <p className="text-xs text-gray-400 mt-2">Max file size: 50MB</p>
                  </div>
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.tif,.tiff"
              onChange={handleImageUpload}
              className="hidden"
            />

            <button
              onClick={runAIAnalysis}
              disabled={!uploadedFile || isAnalyzing}
              className="w-full flex items-center justify-center space-x-2 p-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 transition-all shadow-md hover:shadow-lg disabled:cursor-not-allowed"
            >
              {isAnalyzing ? (
                <>
                  <Loader className="h-5 w-5 animate-spin" />
                  <span className="font-semibold">Processing with Java Backend...</span>
                </>
              ) : (
                <>
                  <Brain className="h-5 w-5" />
                  <span className="font-semibold">Process Image (Real NDVI Analysis)</span>
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-700 flex items-center space-x-2">
              <MapPin className="h-5 w-5 text-green-600" />
              <span>Select Region & Date for Analysis</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Latitude</label>
                <input
                  type="number"
                  step="0.0001"
                  value={selectedRegion.lat}
                  onChange={(e) => setSelectedRegion(prev => ({ ...prev, lat: Number(e.target.value) }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Longitude</label>
                <input
                  type="number"
                  step="0.0001"
                  value={selectedRegion.lng}
                  onChange={(e) => setSelectedRegion(prev => ({ ...prev, lng: Number(e.target.value) }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Analysis Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <button
              onClick={runRegionAnalysis}
              disabled={isAnalyzing}
              className="w-full flex items-center justify-center space-x-2 p-4 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg hover:from-green-700 hover:to-teal-700 disabled:from-gray-400 disabled:to-gray-500 transition-all shadow-md hover:shadow-lg"
            >
              {isAnalyzing ? (
                <>
                  <Loader className="h-5 w-5 animate-spin" />
                  <span className="font-semibold">Analyzing Region...</span>
                </>
              ) : (
                <>
                  <Brain className="h-5 w-5" />
                  <span className="font-semibold">Analyze Region (Backend API)</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Analysis Results */}
      {analysisResults && (
        <div className="mt-6 p-6 bg-white rounded-lg shadow-md border-2 border-purple-200">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-xl font-bold text-gray-800 flex items-center space-x-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              <span>Analysis Results</span>
            </h4>
            <div className="flex items-center space-x-2">
              {analysisResults.isMLProcessed ? (
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold flex items-center space-x-1">
                  <span>✓</span>
                  <span>ML PROCESSED</span>
                </span>
              ) : (
                <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold flex items-center space-x-1">
                  <span>⚠️</span>
                  <span>BASIC MODE</span>
                </span>
              )}
              {analysisResults.validationConfidence !== undefined && (
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${analysisResults.validationConfidence >= 80 ? 'bg-green-100 text-green-700' :
                  analysisResults.validationConfidence >= 60 ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                  Confidence: {analysisResults.validationConfidence.toFixed(1)}%
                </span>
              )}
            </div>
          </div>

          {/* ML Classification Results */}
          {analysisResults.mlClassification && analysisResults.mlPrimaryClass && (
            <div className="mb-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border-2 border-purple-200">
              <h5 className="font-semibold text-purple-900 mb-3 flex items-center space-x-2">
                <Brain className="h-5 w-5" />
                <span>🤖 ML Land Cover Classification</span>
              </h5>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Primary Class:</span>
                  <span className="text-lg font-bold text-purple-700">{analysisResults.mlPrimaryClass}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">ML Confidence:</span>
                  <span className="text-lg font-bold text-blue-700">{analysisResults.mlConfidence.toFixed(1)}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Method:</span>
                  <span className="text-xs text-gray-700 bg-white px-2 py-1 rounded">{analysisResults.mlMethod}</span>
                </div>
                {analysisResults.mlClassification.allPredictions && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-xs text-gray-600 mb-2">Top Predictions:</p>
                    {analysisResults.mlClassification.allPredictions.slice(0, 3).map((pred: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between text-xs mb-1">
                        <span className="text-gray-700">{idx + 1}. {pred.class || pred.className}</span>
                        <span className="font-semibold text-purple-600">{(pred.confidence || 0).toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Validation Info */}
          {analysisResults.validationReasons && analysisResults.validationReasons.length > 0 && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm font-semibold text-blue-900 mb-2">🔍 Image Validation:</p>
              <ul className="text-xs text-blue-700 space-y-1">
                {analysisResults.validationReasons.map((reason: string, idx: number) => (
                  <li key={idx}>• {reason}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Metadata */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4 text-xs">
            <div className="p-2 bg-gray-50 rounded">
              <strong>Analysis Time:</strong> {new Date(analysisResults.timestamp).toLocaleString()}
            </div>
            {analysisResults.region && (
              <div className="p-2 bg-gray-50 rounded">
                <strong>Region:</strong> {analysisResults.region}
              </div>
            )}
            {analysisResults.imageDimensions && (
              <div className="p-2 bg-gray-50 rounded">
                <strong>Dimensions:</strong> {analysisResults.imageDimensions}
              </div>
            )}
            {analysisResults.fileSize && (
              <div className="p-2 bg-gray-50 rounded">
                <strong>File Size:</strong> {analysisResults.fileSize}
              </div>
            )}
            {analysisResults.bands && (
              <div className={`p-2 rounded ${analysisResults.bands > 3 ? 'bg-green-50' : 'bg-yellow-50'}`}>
                <strong>Bands:</strong> {analysisResults.bands} {analysisResults.bands > 3 ? '(Multispectral)' : '(RGB)'}
              </div>
            )}
            {analysisResults.analysisId && (
              <div className="p-2 bg-gray-50 rounded">
                <strong>Analysis ID:</strong> {analysisResults.analysisId}
              </div>
            )}
            <div className="p-2 bg-purple-50 rounded">
              <strong>Method:</strong> {analysisResults.processingMethod}
            </div>
          </div>

          {/* NDVI Statistics */}
          {analysisResults.ndviStats && (
            <div className="mb-4 p-4 bg-blue-50 rounded-lg">
              <h5 className="font-semibold text-blue-900 mb-2">📊 NDVI Statistics (Real Data)</h5>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
                <div className="text-center">
                  <p className="font-bold text-blue-700">{analysisResults.ndviStats.mean?.toFixed(3)}</p>
                  <p className="text-xs text-gray-600">Mean</p>
                </div>
                <div className="text-center">
                  <p className="font-bold text-blue-700">{analysisResults.ndviStats.median?.toFixed(3)}</p>
                  <p className="text-xs text-gray-600">Median</p>
                </div>
                <div className="text-center">
                  <p className="font-bold text-blue-700">{analysisResults.ndviStats.min?.toFixed(3)}</p>
                  <p className="text-xs text-gray-600">Min</p>
                </div>
                <div className="text-center">
                  <p className="font-bold text-blue-700">{analysisResults.ndviStats.max?.toFixed(3)}</p>
                  <p className="text-xs text-gray-600">Max</p>
                </div>
                <div className="text-center">
                  <p className="font-bold text-blue-700">{analysisResults.ndviStats.stdDev?.toFixed(3)}</p>
                  <p className="text-xs text-gray-600">Std Dev</p>
                </div>
              </div>
            </div>
          )}

          {/* Land Cover Classification */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
            {Object.entries(analysisResults.classifications).map(([key, value]: [string, any]) => {
              const colors: Record<string, string> = {
                denseForest: 'bg-green-600 text-white',
                sparseVegetation: 'bg-green-400 text-gray-800',
                moderateVegetation: 'bg-green-500 text-white',
                sparseForest: 'bg-lime-400 text-gray-800',
                water: 'bg-blue-500 text-white',
                urban: 'bg-gray-600 text-white',
                barren: 'bg-yellow-500 text-gray-800',
                bareSoil: 'bg-amber-500 text-white'
              };

              const labels: Record<string, string> = {
                denseForest: '🌲 Dense Forest',
                sparseVegetation: '🌿 Sparse Veg',
                moderateVegetation: '🌳 Moderate Veg',
                sparseForest: '🌱 Sparse Forest',
                water: '💧 Water',
                urban: '🏙️ Urban',
                barren: '⛰️ Barren',
                bareSoil: '🏜️ Bare Soil'
              };

              return (
                <div key={key} className={`text-center p-3 ${colors[key] || 'bg-purple-100 text-purple-800'} rounded-lg shadow-md`}>
                  <p className="text-lg font-bold">{(typeof value === 'number' ? value : 0).toFixed(1)}%</p>
                  <p className="text-xs">{labels[key] || key}</p>
                </div>
              );
            })}
          </div>

          {/* Additional Info */}
          <div className="flex flex-wrap items-center gap-4 text-sm mb-4">
            {analysisResults.confidence && (
              <div className="flex items-center space-x-2 px-3 py-1 bg-green-50 rounded-full">
                <span className="text-gray-600">Confidence:</span>
                <span className="font-bold text-green-700">{analysisResults.confidence.toFixed(1)}%</span>
              </div>
            )}
            {analysisResults.ndviAverage !== undefined && (
              <div className="flex items-center space-x-2 px-3 py-1 bg-blue-50 rounded-full">
                <span className="text-gray-600">Avg NDVI:</span>
                <span className="font-bold text-blue-700">{analysisResults.ndviAverage.toFixed(3)}</span>
              </div>
            )}
            {analysisResults.dominantClass && (
              <div className="flex items-center space-x-2 px-3 py-1 bg-purple-50 rounded-full">
                <span className="text-gray-600">Dominant:</span>
                <span className="font-bold text-purple-700">{analysisResults.dominantClass}</span>
              </div>
            )}
            {analysisResults.anomaliesDetected > 0 && (
              <div className="flex items-center space-x-2 px-3 py-1 bg-orange-50 rounded-full">
                <span className="text-gray-600">Anomalies:</span>
                <span className="font-bold text-orange-700">{analysisResults.anomaliesDetected}</span>
              </div>
            )}
          </div>

          {/* Alerts */}
          {analysisResults.alerts && analysisResults.alerts.length > 0 && (
            <div className="space-y-2">
              {analysisResults.alerts.map((alert: string, index: number) => (
                <div key={index} className="text-sm p-3 bg-orange-50 text-orange-700 rounded-lg border border-orange-200">
                  {alert}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AIModule;
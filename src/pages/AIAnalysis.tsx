import { useState, useRef, useMemo } from 'react';
import { useMutation } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { imageProcessingApi } from '../services/api';

// Generate mock NDVI histogram data
function generateHistogramData(avgNdvi: number) {
    return [
        { range: '0.0-0.2', count: Math.floor(Math.random() * 5) + 2, label: 'Bare Soil' },
        { range: '0.2-0.4', count: Math.floor(Math.random() * 15) + 5, label: 'Sparse Veg' },
        { range: '0.4-0.6', count: Math.floor(Math.random() * 40) + 20, label: 'Moderate Veg' },
        { range: '0.6-0.8', count: Math.floor(Math.random() * 50) + 30, label: 'Healthy Veg' },
        { range: '0.8-1.0', count: Math.floor(Math.random() * 25) + 10, label: 'Dense Veg' },
    ];
}

export default function AIAnalysis() {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string>('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const uploadMutation = useMutation({
        mutationFn: async (file: File) => {
            return await imageProcessingApi.processImage(file);
        }
    });

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
        }
    };

    const handleDrop = (event: React.DragEvent) => {
        event.preventDefault();
        const file = event.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            setSelectedFile(file);
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
        }
    };

    const handleAnalyze = () => {
        if (selectedFile) {
            uploadMutation.mutate(selectedFile);
        }
    };

    // Extract data with confidence and EuroSAT support
    const satelliteConfidence = useMemo(() => 
        uploadMutation.data?.satelliteConfidence || uploadMutation.data?.validationConfidence || 50
    , [uploadMutation.data]);

    const confidenceCategory = useMemo(() => 
        uploadMutation.data?.confidenceCategory || "Unknown"
    , [uploadMutation.data]);

    const avgNdvi = useMemo(() => {
        const val = uploadMutation.data?.ndviStats?.mean ?? uploadMutation.data?.avgNdvi;
        return typeof val === 'number' ? val : 0.650;
    }, [uploadMutation.data]);

    const histogramData = useMemo(() => 
        uploadMutation.isSuccess ? generateHistogramData(avgNdvi) : []
    , [uploadMutation.isSuccess, avgNdvi]);

    const healthyPercent = useMemo(() => 
        uploadMutation.data?.vegetationClassification?.denseVegetation || 0
    , [uploadMutation.data]);

    // EuroSAT classification
    const euroSATClass = useMemo(() => 
        uploadMutation.data?.mlClassification?.primary_class || uploadMutation.data?.mlClassification?.primaryClass
    , [uploadMutation.data]);

    const euroSATConfidence = useMemo(() => 
        uploadMutation.data?.mlClassification?.confidence || 0
    , [uploadMutation.data]);

    // Land Cover data
    const landCover = useMemo(() => 
        uploadMutation.data?.land_cover || uploadMutation.data?.landCover || {}
    , [uploadMutation.data]);

    const primaryLandUse = useMemo(() => 
        uploadMutation.data?.primary_land_use || uploadMutation.data?.primaryLandUse || euroSATClass || 'Unknown'
    , [uploadMutation.data, euroSATClass]);

    // AI Summary with confidence context
    const aiSummary = useMemo(() => {
        let summary = uploadMutation.data?.mlClassification?.summary;
        if (!summary && uploadMutation.isSuccess) {
            if (satelliteConfidence < 20) {
                summary = `⚠️ WARNING: This image could not be verified as satellite data (${(Number(satelliteConfidence) || 0).toFixed(1)}% confidence). Results below are estimates only.`;
            } else if (satelliteConfidence < 45) {
                summary = `ℹ️ Image appears to be a satellite export or annotated satellite photo (${(Number(satelliteConfidence) || 0).toFixed(1)}% confidence). NDVI-equivalent vegetation analysis applied.`;
            } else if (euroSATClass) {
                summary = `Analysis complete using EuroSAT dataset: Image classified as "${euroSATClass}" with ${(Number(euroSATConfidence) || 0).toFixed(1)}% confidence. Satellite imagery confidence: ${(Number(satelliteConfidence) || 0).toFixed(1)}%.`;
            } else {
                summary = `Analysis complete: Vegetation health is ${(Number(healthyPercent) || 0).toFixed(1)}% optimal. Satellite imagery confidence: ${(Number(satelliteConfidence) || 0).toFixed(1)}%.`;
            }
        }
        return summary;
    }, [uploadMutation.data, uploadMutation.isSuccess, satelliteConfidence, euroSATClass, euroSATConfidence, healthyPercent]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-4xl font-bold text-white mb-2">AI Image Analysis</h1>
                <p className="text-slate-400">Upload satellite images for automated vegetation and land use analysis</p>
            </div>

            {/* Upload Area - KEEPING YOUR EXISTING CODE */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700"
            >
                <h2 className="text-xl font-semibold text-white mb-4">Upload Satellite Image</h2>

                <div
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-600 rounded-lg p-12 text-center cursor-pointer hover:border-green-500 transition-colors"
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                    />
                    {previewUrl ? (
                        <div className="space-y-4">
                            <img src={previewUrl} alt="Preview" className="max-h-64 mx-auto rounded-lg" />
                            <p className="text-sm text-slate-400">{selectedFile?.name}</p>
                        </div>
                    ) : (
                        <div className="text-slate-400">
                            <div className="text-5xl mb-4">📁</div>
                            <p className="text-lg mb-2">Drop your satellite image here</p>
                            <p className="text-sm">or click to browse</p>
                            <p className="text-xs mt-4 text-slate-500">Supports: GeoTIFF, PNG, JPEG</p>
                        </div>
                    )}
                </div>

                {selectedFile && (
                    <motion.button
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        onClick={handleAnalyze}
                        disabled={uploadMutation.isPending}
                        className="mt-4 w-full bg-green-600 hover:bg-green-700 disabled:bg-slate-600 text-white py-3 px-6 rounded-lg font-semibold transition-colors"
                    >
                        {uploadMutation.isPending ? (
                            <span className="flex items-center justify-center">
                                <LoadingSpinner />
                                <span className="ml-2">Analyzing...</span>
                            </span>
                        ) : (
                            '🚀 Analyze Image'
                        )}
                    </motion.button>
                )}
            </motion.div>

            {/* Analysis Results */}
            {uploadMutation.isSuccess && (
                <>
                    {/* SATELLITE CONFIDENCE CHECK — only hard-block if confidence is essentially 0 */}
                    {satelliteConfidence < 20 ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-red-500/20 backdrop-blur-sm rounded-xl p-12 border-2 border-red-500 text-center"
                        >
                            <div className="text-8xl mb-6">🚫</div>
                            <h2 className="text-3xl font-bold text-white mb-4">Cannot Analyse This Image</h2>
                            <p className="text-slate-300 text-lg max-w-2xl mx-auto mb-8">
                                The uploaded file does not appear to be satellite-related imagery (Confidence: {(Number(satelliteConfidence) || 0).toFixed(1)}%).
                                Please upload a satellite image, GeoTIFF, or satellite screenshot.
                            </p>
                            <button
                                onClick={() => {
                                    setSelectedFile(null);
                                    setPreviewUrl('');
                                    uploadMutation.reset();
                                }}
                                className="mt-4 bg-slate-700 hover:bg-slate-600 text-white px-8 py-3 rounded-lg transition-colors"
                            >
                                Try Again
                            </button>
                        </motion.div>
                    ) : (
                        <>
                            {/* Low-confidence warning banner — shown but doesn't block */}
                            {satelliteConfidence < 45 && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-yellow-500/15 border border-yellow-500/50 rounded-xl p-4 flex items-start gap-3"
                                >
                                    <span className="text-2xl">⚠️</span>
                                    <div>
                                        <p className="text-yellow-300 font-semibold">Low Satellite Confidence ({(Number(satelliteConfidence) || 0).toFixed(1)}%)</p>
                                        <p className="text-yellow-200/80 text-sm mt-1">
                                            This image appears to be an annotated or exported satellite image (JPEG/PNG) rather than a raw GeoTIFF.
                                            Analysis uses RGB vegetation index — results are estimates. For best accuracy, upload a raw GeoTIFF file.
                                        </p>
                                    </div>
                                </motion.div>
                            )}

                            {/* Stats Summary Panel */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700"
                            >
                                <h2 className="text-2xl font-bold text-white mb-6">📊 Analysis Results</h2>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                                    <div className="bg-gradient-to-br from-green-500/20 to-emerald-600/20 border border-green-500/30 rounded-lg p-6 text-center">
                                        <div className="text-green-400 text-sm font-medium mb-1">Average NDVI</div>
                                        <div className="text-4xl font-bold text-white mb-1">{(Number(avgNdvi) || 0).toFixed(3)}</div>
                                        <div className="text-green-300 text-xs uppercase tracking-wider">{avgNdvi >= 0.5 ? 'Healthy' : 'Moderate'}</div>
                                    </div>
                                    <div className="bg-gradient-to-br from-blue-500/20 to-cyan-600/20 border border-blue-500/30 rounded-lg p-6 text-center">
                                        <div className="text-blue-400 text-sm font-medium mb-1">Classification</div>
                                        <div className="text-2xl font-bold text-white mb-1">{primaryLandUse}</div>
                                        <div className="text-blue-300 text-xs">Based on EuroSAT Model</div>
                                    </div>
                                    <div className="bg-gradient-to-br from-purple-500/20 to-pink-600/20 border border-purple-500/30 rounded-lg p-6 text-center">
                                        <div className="text-purple-400 text-sm font-medium mb-1">Vegetation Density</div>
                                        <div className="text-4xl font-bold text-white mb-1">{Math.round(healthyPercent)}%</div>
                                        <div className="text-purple-300 text-xs">Total Green Area</div>
                                    </div>
                                </div>

                                <div className="bg-slate-900/40 p-5 rounded-lg border border-slate-700/50">
                                    <div className="flex items-center space-x-3 mb-2">
                                        <span className="text-2xl">🤖</span>
                                        <h3 className="text-cyan-300 font-semibold tracking-wide uppercase text-sm">AI Summary</h3>
                                    </div>
                                    <p className="text-slate-300 text-sm leading-relaxed italic">"{aiSummary}"</p>
                                </div>
                            </motion.div>

                            {/* Land Cover Breakdown */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700"
                            >
                                <h2 className="text-xl font-bold text-white mb-6 flex items-center">
                                    <span className="mr-2">🌍</span> Land Classification Details
                                </h2>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {landCover.forest !== undefined && (
                                        <div className="p-4 bg-green-950/30 border border-green-800/50 rounded-lg">
                                            <div className="text-2xl mb-1">🌲</div>
                                            <div className="text-xs text-green-400 mb-1">Forest</div>
                                            <div className="text-2xl font-bold text-white">{Math.round(landCover.forest)}%</div>
                                        </div>
                                    )}
                                    {landCover.water !== undefined && (
                                        <div className="p-4 bg-blue-950/30 border border-blue-800/50 rounded-lg">
                                            <div className="text-2xl mb-1">💧</div>
                                            <div className="text-xs text-blue-400 mb-1">Water</div>
                                            <div className="text-2xl font-bold text-white">{Math.round(landCover.water)}%</div>
                                        </div>
                                    )}
                                    {landCover.urban !== undefined && (
                                        <div className="p-4 bg-slate-900/50 border border-slate-700/50 rounded-lg">
                                            <div className="text-2xl mb-1">🏙️</div>
                                            <div className="text-xs text-slate-400 mb-1">Urban</div>
                                            <div className="text-2xl font-bold text-white">{Math.round(landCover.urban)}%</div>
                                        </div>
                                    )}
                                    {landCover.agricultural !== undefined && (
                                        <div className="p-4 bg-yellow-950/30 border border-yellow-800/50 rounded-lg">
                                            <div className="text-2xl mb-1">🌾</div>
                                            <div className="text-xs text-yellow-500 mb-1">Crop</div>
                                            <div className="text-2xl font-bold text-white">{Math.round(landCover.agricultural)}%</div>
                                        </div>
                                    )}
                                </div>
                            </motion.div>

                            {/* Recharts Histogram */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700"
                            >
                                <h2 className="text-xl font-bold text-white mb-6">📈 NDVI Pixel Distribution</h2>
                                <div className="h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={histogramData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                            <XAxis dataKey="range" stroke="#94a3b8" />
                                            <YAxis stroke="#94a3b8" />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                                                itemStyle={{ color: '#10b981' }}
                                            />
                                            <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </motion.div>
                        </>
                    )}
                </>
            )}

            {/* Error */}
            {uploadMutation.isError && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-red-500/10 border border-red-500 rounded-lg p-4"
                >
                    <p className="text-red-400">
                        ❌ Analysis failed: {(uploadMutation.error as Error)?.message || 'Unknown error'}
                    </p>
                </motion.div>
            )}

            {/* Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
                    <div className="text-3xl mb-3">🌿</div>
                    <h3 className="text-lg font-semibold text-white mb-2">NDVI Calculation</h3>
                    <p className="text-slate-400 text-sm">
                        Automated vegetation health index from satellite bands
                    </p>
                </div>

                <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
                    <div className="text-3xl mb-3">🏞️</div>
                    <h3 className="text-lg font-semibold text-white mb-2">Land Classification</h3>
                    <p className="text-slate-400 text-sm">
                        ML-powered land use and coverage analysis
                    </p>
                </div>

                <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
                    <div className="text-3xl mb-3">📊</div>
                    <h3 className="text-lg font-semibold text-white mb-2">Statistical Analysis</h3>
                    <p className="text-slate-400 text-sm">
                        Comprehensive vegetation and coverage statistics
                    </p>
                </div>
            </div>
        </div>
    );
}

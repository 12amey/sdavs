import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SpeedInsights } from "@vercel/speed-insights/react";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import PageTransition from './components/PageTransition';
import Home from './pages/Home';
import IndiaMap from './pages/IndiaMap';
import EnvironmentalIntelligenceLedger from './pages/EnvironmentalIntelligenceLedger';
import MLPredictions from './pages/MLPredictions';
import AIAnalysis from './pages/AIAnalysis';
import SystemStatus from './pages/SystemStatus';
import EnvironmentalMonitoring from './pages/EnvironmentalMonitoring';
import Login from './pages/Login';
import ErrorBoundary from './components/ErrorBoundary';

const queryClient = new QueryClient();

// Protected route wrapper
function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) {
    const { user, isAuthenticated, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: '#050a14' }}>
                <div className="flex flex-col items-center gap-4">
                    <div className="relative w-16 h-16">
                        <div className="absolute inset-0 rounded-full border-2 border-cyan-500/20" />
                        <div className="absolute inset-0 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
                        <div className="absolute inset-0 flex items-center justify-center text-xl">🛰️</div>
                    </div>
                    <p className="text-xs font-bold tracking-widest uppercase" style={{ color: 'rgba(0,212,255,0.6)' }}>
                        Authenticating...
                    </p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && user && !allowedRoles.includes(user.role || '')) {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
}

function AppRoutes() {
    const { isAuthenticated } = useAuth();

    return (
        <Routes>
            <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} />

            <Route path="/" element={
                <ProtectedRoute>
                    <Layout><PageTransition bg="command"><Home /></PageTransition></Layout>
                </ProtectedRoute>
            } />

            <Route path="/map" element={
                <ProtectedRoute>
                    <Layout><PageTransition bg="map"><IndiaMap /></PageTransition></Layout>
                </ProtectedRoute>
            } />

            <Route path="/data" element={
                <ProtectedRoute>
                    <Layout><PageTransition bg="ledger"><EnvironmentalIntelligenceLedger /></PageTransition></Layout>
                </ProtectedRoute>
            } />

            <Route path="/ml" element={
                <ProtectedRoute allowedRoles={['admin', 'user']}>
                    <Layout><PageTransition bg="climate"><MLPredictions /></PageTransition></Layout>
                </ProtectedRoute>
            } />

            <Route path="/ai" element={
                <ProtectedRoute allowedRoles={['admin', 'user']}>
                    <Layout><PageTransition bg="ai"><AIAnalysis /></PageTransition></Layout>
                </ProtectedRoute>
            } />

            <Route path="/environmental" element={
                <ProtectedRoute>
                    <Layout><PageTransition bg="eco"><EnvironmentalMonitoring /></PageTransition></Layout>
                </ProtectedRoute>
            } />

            <Route path="/status" element={
                <ProtectedRoute allowedRoles={['admin']}>
                    <Layout><PageTransition bg="status"><SystemStatus /></PageTransition></Layout>
                </ProtectedRoute>
            } />
        </Routes>
    );
}

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <BrowserRouter>
                    <ErrorBoundary>
                        <AppRoutes />
                    </ErrorBoundary>
                </BrowserRouter>
                <Toaster
                    position="top-right"
                    toastOptions={{
                        style: {
                            background: 'rgba(10, 16, 30, 0.95)',
                            border: '1px solid rgba(0, 212, 255, 0.2)',
                            color: 'white',
                            backdropFilter: 'blur(20px)',
                        },
                    }}
                />
                <SpeedInsights />
            </AuthProvider>
        </QueryClientProvider>
    );
}

export default App;
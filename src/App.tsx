import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import IndiaMap from './pages/IndiaMap';
import DataTable from './pages/DataTable';
import MLPredictions from './pages/MLPredictions';
import AIAnalysis from './pages/AIAnalysis';
import SystemStatus from './pages/SystemStatus';
import EnvironmentalMonitoring from './pages/EnvironmentalMonitoring';
import Login from './pages/Login';
import ErrorBoundary from './components/ErrorBoundary';

const queryClient = new QueryClient();

// Protected route wrapper
function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) {
  const { user, isAuthenticated } = useAuth();

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
          <Layout><Home /></Layout>
        </ProtectedRoute>
      } />

      <Route path="/map" element={
        <ProtectedRoute>
          <Layout><IndiaMap /></Layout>
        </ProtectedRoute>
      } />

      <Route path="/data" element={
        <ProtectedRoute>
          <Layout><DataTable /></Layout>
        </ProtectedRoute>
      } />

      <Route path="/ml" element={
        <ProtectedRoute allowedRoles={['admin', 'analyst', 'researcher']}>
          <Layout><MLPredictions /></Layout>
        </ProtectedRoute>
      } />

      <Route path="/ai" element={
        <ProtectedRoute allowedRoles={['admin', 'analyst', 'researcher']}>
          <Layout><AIAnalysis /></Layout>
        </ProtectedRoute>
      } />

      <Route path="/environmental" element={
        <ProtectedRoute>
          <Layout><EnvironmentalMonitoring /></Layout>
        </ProtectedRoute>
      } />

      <Route path="/status" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <Layout><SystemStatus /></Layout>
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
        <Toaster position="top-right" />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
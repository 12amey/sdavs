import React, { useState, useEffect } from 'react';
import { User, LogIn, LogOut, Save, Download, History, Activity } from 'lucide-react';
import { dataStorage, StoredAnalysis } from '../services/dataStorage';
import { exportReportAsPDF, exportDataAsCSV, exportActivitiesAsCSV } from '../utils/exportUtils';

interface UserSessionProps {
  onLogin: (username: string) => void;
  onLogout: () => void;
  onSaveAnalysis: (analysis: any) => void;
  onGenerateReport: (format: 'pdf' | 'csv') => void;
}

const UserSession: React.FC<UserSessionProps> = ({
  onLogin,
  onLogout,
  onSaveAnalysis,
  onGenerateReport
}) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ id: string; username: string } | null>(null);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [userAnalyses, setUserAnalyses] = useState<StoredAnalysis[]>([]);
  const [userActivities, setUserActivities] = useState<any[]>([]);
  const [showAnalysisHistory, setShowAnalysisHistory] = useState(false);

  useEffect(() => {
    const user = dataStorage.getCurrentUser();
    if (user) {
      setCurrentUser(user);
      setIsLoggedIn(true);
      loadUserData(user.id);
    }
  }, []);

  const loadUserData = (userId: string) => {
    const analyses = dataStorage.getUserAnalyses(userId);
    const activities = dataStorage.getUserActivities(userId);
    setUserAnalyses(analyses);
    setUserActivities(activities);
  };

  const handleLogin = () => {
    if (loginForm.username.trim()) {
      const user = {
        id: Date.now().toString(),
        username: loginForm.username
      };
      
      dataStorage.setCurrentUser(user);
      setCurrentUser(user);
      setIsLoggedIn(true);
      loadUserData(user.id);
      onLogin(loginForm.username);
      setLoginForm({ username: '', password: '' });
    }
  };

  const handleLogout = () => {
    dataStorage.clearCurrentUser();
    setCurrentUser(null);
    setIsLoggedIn(false);
    setUserAnalyses([]);
    setUserActivities([]);
    onLogout();
  };

  const handleSaveCurrentAnalysis = () => {
    if (!currentUser) return;
    
    const mockAnalysis = {
      userId: currentUser.id,
      regionName: 'Current Session Analysis',
      coordinates: {
        startLat: 19.0760,
        startLng: 72.8777,
        endLat: 19.2760,
        endLng: 73.0777
      },
      results: {
        avgNDVI: 0.567,
        forestCover: 67.8,
        landCoverBreakdown: {
          healthy: 42.1,
          moderate: 25.7,
          unhealthy: 9.4,
          water: 8.2,
          urban: 14.6
        },
        areaSize: 1250.75,
        confidence: 92.4
      },
      analysisType: 'Manual Save'
    };
    
    const savedAnalysis = dataStorage.saveAnalysis(mockAnalysis);
    setUserAnalyses(prev => [savedAnalysis, ...prev]);
    onSaveAnalysis(savedAnalysis);
    alert('Analysis saved successfully!');
  };

  const handleGenerateReport = async (format: 'pdf' | 'csv') => {
    if (!currentUser) return;
    
    try {
      if (format === 'pdf') {
        await exportReportAsPDF([], 'User Session Report');
      } else {
        exportDataAsCSV([]);
      }
      onGenerateReport(format);
    } catch (error) {
      alert('Error generating report. Please try again.');
    }
  };

  const handleExportActivities = () => {
    exportActivitiesAsCSV();
  };

  const deleteAnalysis = (analysisId: string) => {
    if (confirm('Are you sure you want to delete this analysis?')) {
      setUserAnalyses(prev => prev.filter(a => a.id !== analysisId));
      if (currentUser) {
        dataStorage.logActivity(currentUser.id, 'analysis_deleted', `Deleted analysis ${analysisId}`);
      }
    }
  };

  const viewAnalysisDetails = (analysis: StoredAnalysis) => {
    const details = `Analysis Details:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📍 Region: ${analysis.regionName}
📅 Date: ${new Date(analysis.timestamp).toLocaleString()}
📏 Area: ${analysis.results.areaSize.toFixed(2)} km²

🌿 NDVI Analysis:
• Average NDVI: ${analysis.results.avgNDVI.toFixed(3)}
• Forest Cover: ${analysis.results.forestCover.toFixed(1)}%
• Confidence: ${analysis.results.confidence.toFixed(1)}%

🎨 Land Cover Breakdown:
• Healthy Vegetation: ${analysis.results.landCoverBreakdown.healthy.toFixed(1)}%
• Moderate Vegetation: ${analysis.results.landCoverBreakdown.moderate.toFixed(1)}%
• Unhealthy Vegetation: ${analysis.results.landCoverBreakdown.unhealthy.toFixed(1)}%
• Water Bodies: ${analysis.results.landCoverBreakdown.water.toFixed(1)}%
• Urban Areas: ${analysis.results.landCoverBreakdown.urban.toFixed(1)}%

📊 Coordinates:
• Start: ${analysis.coordinates.startLat.toFixed(4)}, ${analysis.coordinates.startLng.toFixed(4)}
• End: ${analysis.coordinates.endLat.toFixed(4)}, ${analysis.coordinates.endLng.toFixed(4)}

🔬 Analysis Type: ${analysis.analysisType}
💾 Source: ${analysis.source}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
    
    alert(details);
  };

  if (!isLoggedIn) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center space-x-2 mb-6">
          <User className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-800">User Login</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input
              type="text"
              value={loginForm.username}
              onChange={(e) => setLoginForm(prev => ({ ...prev, username: e.target.value }))}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your username"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={loginForm.password}
              onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your password"
            />
          </div>
          
          <button
            onClick={handleLogin}
            disabled={!loginForm.username.trim()}
            className="w-full flex items-center justify-center space-x-2 p-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
          >
            <LogIn className="h-4 w-4" />
            <span>Login</span>
          </button>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Demo Mode:</strong> Enter any username to login. Data is stored locally in your browser.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <User className="h-6 w-6 text-green-600" />
          <h2 className="text-xl font-bold text-gray-800">Welcome, {currentUser?.username}</h2>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </button>
      </div>

      {/* User Actions */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <button
          onClick={handleSaveCurrentAnalysis}
          className="flex items-center justify-center space-x-2 p-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
        >
          <Save className="h-4 w-4" />
          <span>Save Analysis</span>
        </button>
        
        <button
          onClick={() => setShowAnalysisHistory(!showAnalysisHistory)}
          className="flex items-center justify-center space-x-2 p-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
        >
          <History className="h-4 w-4" />
          <span>View History</span>
        </button>
      </div>

      {/* Export Options */}
      <div className="space-y-3 mb-6">
        <h3 className="text-lg font-semibold text-gray-700">Export Options</h3>
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => handleGenerateReport('pdf')}
            className="flex items-center justify-center space-x-2 p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>PDF Report</span>
          </button>
          
          <button
            onClick={() => handleGenerateReport('csv')}
            className="flex items-center justify-center space-x-2 p-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>CSV Data</span>
          </button>
          
          <button
            onClick={handleExportActivities}
            className="flex items-center justify-center space-x-2 p-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            <Activity className="h-4 w-4" />
            <span>Activities</span>
          </button>
        </div>
      </div>

      {/* User Statistics */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <p className="text-2xl font-bold text-green-600">{userAnalyses.length}</p>
          <p className="text-sm text-gray-600">Saved Analyses</p>
        </div>
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <p className="text-2xl font-bold text-blue-600">{userActivities.length}</p>
          <p className="text-sm text-gray-600">Activities</p>
        </div>
        <div className="text-center p-3 bg-purple-50 rounded-lg">
          <p className="text-2xl font-bold text-purple-600">
            {currentUser ? Math.floor((Date.now() - parseInt(currentUser.id)) / (1000 * 60)) : 0}
          </p>
          <p className="text-sm text-gray-600">Minutes Active</p>
        </div>
      </div>

      {/* Analysis History */}
      {showAnalysisHistory && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-700">Analysis History</h3>
          {userAnalyses.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No saved analyses yet. Perform some analyses to see them here.</p>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {userAnalyses.map((analysis) => (
                <div key={analysis.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-800">{analysis.regionName}</h4>
                      <p className="text-sm text-gray-600">
                        {new Date(analysis.timestamp).toLocaleDateString()} - 
                        NDVI: {analysis.results.avgNDVI.toFixed(3)} - 
                        Forest: {analysis.results.forestCover.toFixed(1)}%
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => viewAnalysisDetails(analysis)}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                      >
                        View
                      </button>
                      <button
                        onClick={() => deleteAnalysis(analysis.id)}
                        className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Recent Activities */}
      <div className="mt-6 space-y-3">
        <h3 className="text-lg font-semibold text-gray-700">Recent Activities</h3>
        {userActivities.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No activities recorded yet.</p>
        ) : (
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {userActivities.slice(0, 5).map((activity) => (
              <div key={activity.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-sm text-gray-700">{activity.details}</span>
                <span className="text-xs text-gray-500">
                  {new Date(activity.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserSession;
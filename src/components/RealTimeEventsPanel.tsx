import React, { useState, useEffect } from 'react';
import { AlertTriangle, Flame, Zap, Waves, Wind, Mountain, Satellite, RefreshCw, MapPin, Calendar, ExternalLink } from 'lucide-react';
import { nasaEONETAPI, EONETEvent, EONETCategory } from '../services/nasaEONETAPI';

interface RealTimeEventsPanelProps {
  onEventSelect?: (event: EONETEvent) => void;
}

const RealTimeEventsPanel: React.FC<RealTimeEventsPanelProps> = ({ onEventSelect }) => {
  const [events, setEvents] = useState<EONETEvent[]>([]);
  const [categories, setCategories] = useState<EONETCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [apiStatus, setApiStatus] = useState<any>(null);
  const [statistics, setStatistics] = useState<any>(null);

  useEffect(() => {
    loadInitialData();
    const interval = setInterval(refreshData, 5 * 60 * 1000); // Refresh every 5 minutes
    return () => clearInterval(interval);
  }, []);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      const [eventsData, categoriesData, statusData, statsData] = await Promise.all([
        nasaEONETAPI.fetchRecentEvents(30),
        nasaEONETAPI.fetchCategories(),
        nasaEONETAPI.getAPIStatus(),
        nasaEONETAPI.getEventStatistics()
      ]);
      
      setEvents(eventsData);
      setCategories(categoriesData);
      setApiStatus(statusData);
      setStatistics(statsData);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error loading EONET data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshData = async () => {
    try {
      const eventsData = selectedCategory 
        ? await nasaEONETAPI.fetchEvents(selectedCategory, 'open', 100, 30)
        : await nasaEONETAPI.fetchRecentEvents(30);
      
      setEvents(eventsData);
      setLastUpdate(new Date());
      
      // Update API status
      const statusData = await nasaEONETAPI.getAPIStatus();
      setApiStatus(statusData);
    } catch (error) {
      console.error('Error refreshing EONET data:', error);
    }
  };

  const handleCategoryChange = async (categoryId: string) => {
    setSelectedCategory(categoryId);
    setIsLoading(true);
    
    try {
      const eventsData = categoryId 
        ? await nasaEONETAPI.fetchEvents(categoryId, 'open', 100, 30)
        : await nasaEONETAPI.fetchRecentEvents(30);
      
      setEvents(eventsData);
    } catch (error) {
      console.error('Error filtering events:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getCategoryIcon = (categoryTitle: string) => {
    const title = categoryTitle.toLowerCase();
    if (title.includes('fire') || title.includes('wildfire')) return Flame;
    if (title.includes('storm') || title.includes('cyclone')) return Wind;
    if (title.includes('flood') || title.includes('water')) return Waves;
    if (title.includes('volcano')) return Mountain;
    if (title.includes('earthquake')) return Zap;
    return AlertTriangle;
  };

  const getEventSeverity = (event: EONETEvent): 'low' | 'medium' | 'high' | 'critical' => {
    const hasGeometry = event.geometry && event.geometry.length > 0;
    const hasMagnitude = event.geometry.some(g => g.magnitudeValue);
    const isRecent = event.geometry.some(g => {
      const eventDate = new Date(g.date);
      const daysDiff = (Date.now() - eventDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysDiff <= 7;
    });

    if (hasMagnitude && isRecent) return 'critical';
    if (isRecent) return 'high';
    if (hasGeometry) return 'medium';
    return 'low';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  if (isLoading && events.length === 0) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-xl">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Satellite className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading real-time NASA EONET data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-white via-red-50 to-orange-50 p-6 rounded-xl shadow-xl border border-red-200/50">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-br from-red-500 to-orange-600 rounded-lg">
            <AlertTriangle className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
              🌍 Real-Time Earth Events (NASA EONET)
            </h2>
            <p className="text-sm text-gray-600">Live natural disasters and environmental events</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {apiStatus && (
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-xs ${
              apiStatus.status === 'online' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                apiStatus.status === 'online' ? 'bg-green-500 animate-pulse' : 'bg-red-500'
              }`}></div>
              <span>{apiStatus.status === 'online' ? 'API Online' : 'API Offline'}</span>
              <span>({apiStatus.responseTime}ms)</span>
            </div>
          )}
          
          <button
            onClick={refreshData}
            disabled={isLoading}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Statistics */}
      {statistics && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="text-center p-3 bg-white rounded-lg shadow-md">
            <p className="text-2xl font-bold text-red-600">{statistics.activeEvents}</p>
            <p className="text-sm text-gray-600">Active Events</p>
          </div>
          <div className="text-center p-3 bg-white rounded-lg shadow-md">
            <p className="text-2xl font-bold text-orange-600">{statistics.recentEvents}</p>
            <p className="text-sm text-gray-600">Recent (7 days)</p>
          </div>
          <div className="text-center p-3 bg-white rounded-lg shadow-md">
            <p className="text-2xl font-bold text-blue-600">{statistics.totalEvents}</p>
            <p className="text-sm text-gray-600">Total Events</p>
          </div>
          <div className="text-center p-3 bg-white rounded-lg shadow-md">
            <p className="text-2xl font-bold text-green-600">{categories.length}</p>
            <p className="text-sm text-gray-600">Categories</p>
          </div>
        </div>
      )}

      {/* Category Filter */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Category:</label>
        <select
          value={selectedCategory}
          onChange={(e) => handleCategoryChange(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
        >
          <option value="">All Categories</option>
          {categories.map(category => (
            <option key={category.id} value={category.id.toString()}>
              {category.title}
            </option>
          ))}
        </select>
      </div>

      {/* Events List */}
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {events.length === 0 ? (
          <div className="text-center py-8">
            <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No events found for the selected criteria</p>
          </div>
        ) : (
          events.map(event => {
            const severity = getEventSeverity(event);
            const severityColor = getSeverityColor(severity);
            const CategoryIcon = getCategoryIcon(event.categories[0]?.title || '');
            
            return (
              <div
                key={event.id}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-300 hover:shadow-lg ${severityColor}`}
                onClick={() => onEventSelect?.(event)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <CategoryIcon className="h-6 w-6 mt-1 flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800 mb-1">{event.title}</h3>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">{event.description}</p>
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>
                            {event.geometry[0] ? new Date(event.geometry[0].date).toLocaleDateString() : 'Unknown'}
                          </span>
                        </div>
                        
                        {event.geometry[0] && (
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-3 w-3" />
                            <span>
                              {event.geometry[0].coordinates[1]?.toFixed(2)}°, {event.geometry[0].coordinates[0]?.toFixed(2)}°
                            </span>
                          </div>
                        )}
                        
                        <div className="flex items-center space-x-1">
                          <span className="capitalize font-medium">{severity}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 mt-2">
                        {event.categories.map(cat => (
                          <span key={cat.id} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                            {cat.title}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {event.sources.length > 0 && (
                    <a
                      href={event.sources[0].url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-sm"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="h-4 w-4" />
                      <span>Source</span>
                    </a>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Last Update */}
      {lastUpdate && (
        <div className="mt-4 text-center text-xs text-gray-500">
          Last updated: {lastUpdate.toLocaleString()}
        </div>
      )}
    </div>
  );
};

export default RealTimeEventsPanel;
// Real-time data storage service using localStorage and Supabase
import { supabaseService, type AnalysisRecord, type UserActivityRecord } from './supabaseClient';

export interface StoredAnalysis {
  id: string;
  userId: string;
  timestamp: string;
  regionName: string;
  coordinates: {
    startLat: number;
    startLng: number;
    endLat: number;
    endLng: number;
  };
  results: {
    avgNDVI: number;
    forestCover: number;
    landCoverBreakdown: {
      healthy: number;
      moderate: number;
      unhealthy: number;
      water: number;
      urban: number;
    };
    areaSize: number;
    confidence: number;
  };
  analysisType: string;
  source: 'real-time' | 'stored';
}

export interface UserActivity {
  id: string;
  userId: string;
  timestamp: string;
  action: string;
  details: string;
  data?: any;
}

class DataStorageService {
  private readonly ANALYSIS_KEY = 'sdavs_analyses';
  private readonly ACTIVITY_KEY = 'sdavs_activities';
  private readonly USER_KEY = 'sdavs_current_user';
  private useSupabase = true;

  async saveAnalysis(analysis: Omit<StoredAnalysis, 'id' | 'timestamp'>): Promise<StoredAnalysis> {
    const newAnalysis: StoredAnalysis = {
      ...analysis,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      source: 'real-time'
    };

    if (this.useSupabase) {
      try {
        const record: AnalysisRecord = {
          user_id: analysis.userId,
          region_name: analysis.regionName,
          start_latitude: analysis.coordinates.startLat,
          start_longitude: analysis.coordinates.startLng,
          end_latitude: analysis.coordinates.endLat,
          end_longitude: analysis.coordinates.endLng,
          area_size_km2: analysis.results.areaSize,
          avg_ndvi: analysis.results.avgNDVI,
          forest_cover_percent: analysis.results.forestCover,
          healthy_vegetation: analysis.results.landCoverBreakdown.healthy,
          moderate_vegetation: analysis.results.landCoverBreakdown.moderate,
          unhealthy_vegetation: analysis.results.landCoverBreakdown.unhealthy,
          water_bodies: analysis.results.landCoverBreakdown.water,
          urban_areas: analysis.results.landCoverBreakdown.urban,
          analysis_type: analysis.analysisType,
          confidence: analysis.results.confidence,
          alerts: [],
          change_detection: {
            forestLoss: 0,
            urbanGrowth: 0,
            waterChange: 0
          },
          source: 'real-time'
        };

        const saved = await supabaseService.saveAnalysis(record);
        if (saved) {
          newAnalysis.id = saved.id!;
        }
      } catch (error) {
        console.error('Supabase save failed, using localStorage:', error);
        this.saveToLocalStorage(newAnalysis);
      }
    } else {
      this.saveToLocalStorage(newAnalysis);
    }

    await this.logActivity(analysis.userId, 'analysis_saved', `Saved analysis for ${analysis.regionName}`, newAnalysis);

    return newAnalysis;
  }

  private saveToLocalStorage(analysis: StoredAnalysis): void {
    const analyses = this.getStoredAnalyses();
    analyses.unshift(analysis);
    const limitedAnalyses = analyses.slice(0, 50);
    localStorage.setItem(this.ANALYSIS_KEY, JSON.stringify(limitedAnalyses));
  }

  // Get all stored analyses
  getStoredAnalyses(): StoredAnalysis[] {
    const stored = localStorage.getItem(this.ANALYSIS_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  // Get analyses for specific user
  async getUserAnalyses(userId: string): Promise<StoredAnalysis[]> {
    if (this.useSupabase) {
      try {
        const records = await supabaseService.getAnalyses(userId);
        return records.map(r => ({
          id: r.id!,
          userId: r.user_id,
          timestamp: r.created_at!,
          regionName: r.region_name,
          coordinates: {
            startLat: Number(r.start_latitude),
            startLng: Number(r.start_longitude),
            endLat: Number(r.end_latitude),
            endLng: Number(r.end_longitude)
          },
          results: {
            avgNDVI: Number(r.avg_ndvi),
            forestCover: Number(r.forest_cover_percent),
            landCoverBreakdown: {
              healthy: Number(r.healthy_vegetation),
              moderate: Number(r.moderate_vegetation),
              unhealthy: Number(r.unhealthy_vegetation),
              water: Number(r.water_bodies),
              urban: Number(r.urban_areas)
            },
            areaSize: Number(r.area_size_km2),
            confidence: Number(r.confidence)
          },
          analysisType: r.analysis_type,
          source: r.source as 'real-time' | 'stored'
        }));
      } catch (error) {
        console.error('Failed to fetch from Supabase:', error);
        return this.getStoredAnalyses().filter(analysis => analysis.userId === userId);
      }
    }
    return this.getStoredAnalyses().filter(analysis => analysis.userId === userId);
  }

  // Log user activity
  async logActivity(userId: string, action: string, details: string, data?: any): Promise<void> {
    if (this.useSupabase) {
      try {
        const record: UserActivityRecord = {
          user_id: userId,
          action,
          details,
          data
        };
        await supabaseService.logActivity(record);
      } catch (error) {
        console.error('Failed to log activity to Supabase:', error);
        this.logActivityToLocalStorage(userId, action, details, data);
      }
    } else {
      this.logActivityToLocalStorage(userId, action, details, data);
    }
  }

  private logActivityToLocalStorage(userId: string, action: string, details: string, data?: any): void {
    const activities = this.getUserActivitiesSync(userId);
    const newActivity: UserActivity = {
      id: Date.now().toString(),
      userId,
      timestamp: new Date().toISOString(),
      action,
      details,
      data
    };

    activities.unshift(newActivity);
    const limitedActivities = activities.slice(0, 100);

    const allActivities = this.getAllActivities();
    const otherUserActivities = allActivities.filter(a => a.userId !== userId);
    const updatedActivities = [...limitedActivities, ...otherUserActivities];

    localStorage.setItem(this.ACTIVITY_KEY, JSON.stringify(updatedActivities));
  }

  // Get activities for specific user
  async getUserActivities(userId: string): Promise<UserActivity[]> {
    if (this.useSupabase) {
      try {
        const records = await supabaseService.getActivities(userId);
        return records.map(r => ({
          id: r.id!,
          userId: r.user_id,
          timestamp: r.created_at!,
          action: r.action,
          details: r.details,
          data: r.data
        }));
      } catch (error) {
        console.error('Failed to fetch activities from Supabase:', error);
        return this.getUserActivitiesSync(userId);
      }
    }
    return this.getUserActivitiesSync(userId);
  }

  private getUserActivitiesSync(userId: string): UserActivity[] {
    return this.getAllActivities().filter(activity => activity.userId === userId);
  }

  // Get all activities
  getAllActivities(): UserActivity[] {
    const stored = localStorage.getItem(this.ACTIVITY_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  // Get current user
  getCurrentUser(): { id: string; username: string } | null {
    const stored = localStorage.getItem(this.USER_KEY);
    return stored ? JSON.parse(stored) : null;
  }

  // Set current user
  setCurrentUser(user: { id: string; username: string }): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this.logActivity(user.id, 'user_login', `User ${user.username} logged in`);
  }

  // Clear current user
  clearCurrentUser(): void {
    const user = this.getCurrentUser();
    if (user) {
      this.logActivity(user.id, 'user_logout', `User ${user.username} logged out`);
    }
    localStorage.removeItem(this.USER_KEY);
  }

  // Generate real-time NDVI data for coordinates
  generateRealTimeData(lat: number, lng: number): {
    ndvi: number;
    classification: string;
    confidence: number;
    timestamp: string;
  } {
    // Simulate real-time satellite data based on geographic principles
    const latFactor = Math.abs(lat) / 90.0; // Distance from equator
    const seasonalFactor = Math.sin((new Date().getMonth() / 12) * 2 * Math.PI) * 0.2;
    const timeVariation = Math.sin(Date.now() / 86400000) * 0.1; // Daily variation
    
    // Base NDVI calculation with real-time variations
    let ndvi = 0.5 - latFactor * 0.3 + seasonalFactor + timeVariation + (Math.random() - 0.5) * 0.1;
    ndvi = Math.max(-1, Math.min(1, ndvi)); // Clamp to valid range
    
    // Classification based on NDVI
    let classification: string;
    if (ndvi > 0.6) classification = 'healthy';
    else if (ndvi > 0.3) classification = 'moderate';
    else if (ndvi > 0.1) classification = 'unhealthy';
    else if (ndvi < -0.1) classification = 'water';
    else classification = 'urban';
    
    return {
      ndvi,
      classification,
      confidence: 85 + Math.random() * 10,
      timestamp: new Date().toISOString()
    };
  }

  // Clear all data (for testing)
  clearAllData(): void {
    localStorage.removeItem(this.ANALYSIS_KEY);
    localStorage.removeItem(this.ACTIVITY_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  // Export data as JSON
  exportData(): {
    analyses: StoredAnalysis[];
    activities: UserActivity[];
    exportTimestamp: string;
  } {
    return {
      analyses: this.getStoredAnalyses(),
      activities: this.getAllActivities(),
      exportTimestamp: new Date().toISOString()
    };
  }
}

export const dataStorage = new DataStorageService();
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey || supabaseAnonKey === 'YOUR_SUPABASE_ANON_KEY_HERE') {
  console.warn('Supabase credentials missing. Cloud storage will be disabled, falling back to localStorage.');
}

// Create client with dummy values if missing to avoid throw, 
// though actual calls will fail and be caught by the service fallbacks.
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder'
);

export interface AnalysisRecord {
  id?: string;
  user_id: string;
  region_name: string;
  start_latitude: number;
  start_longitude: number;
  end_latitude: number;
  end_longitude: number;
  area_size_km2: number;
  avg_ndvi: number;
  forest_cover_percent: number;
  healthy_vegetation: number;
  moderate_vegetation: number;
  unhealthy_vegetation: number;
  water_bodies: number;
  urban_areas: number;
  analysis_type: string;
  confidence: number;
  alerts: string[];
  change_detection: {
    forestLoss: number;
    urbanGrowth: number;
    waterChange: number;
  };
  source: string;
  created_at?: string;
}

export interface UserActivityRecord {
  id?: string;
  user_id: string;
  action: string;
  details: string;
  data?: any;
  created_at?: string;
}

export interface MLPredictionRecord {
  id?: string;
  user_id: string;
  prediction_type: string;
  latitude: number;
  longitude: number;
  predictions: number[];
  confidence_intervals?: number[];
  risk_score?: number;
  risk_level?: string;
  factors?: any;
  recommendations?: string[];
  accuracy?: number;
  created_at?: string;
}

export const supabaseService = {
  async saveAnalysis(analysis: AnalysisRecord) {
    const { data, error } = await supabase
      .from('analyses')
      .insert(analysis)
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async getAnalyses(userId: string, limit: number = 50) {
    const { data, error } = await supabase
      .from('analyses')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  async getAnalysisById(id: string) {
    const { data, error } = await supabase
      .from('analyses')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async deleteAnalysis(id: string, userId: string) {
    const { error } = await supabase
      .from('analyses')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
  },

  async logActivity(activity: UserActivityRecord) {
    const { data, error } = await supabase
      .from('user_activities')
      .insert(activity)
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async getActivities(userId: string, limit: number = 100) {
    const { data, error } = await supabase
      .from('user_activities')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  async savePrediction(prediction: MLPredictionRecord) {
    const { data, error } = await supabase
      .from('ml_predictions')
      .insert(prediction)
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async getPredictions(userId: string, predictionType?: string, limit: number = 50) {
    let query = supabase
      .from('ml_predictions')
      .select('*')
      .eq('user_id', userId);

    if (predictionType) {
      query = query.eq('prediction_type', predictionType);
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  async getRecentAnalysisStats(userId: string) {
    const { data, error } = await supabase
      .from('analyses')
      .select('avg_ndvi, forest_cover_percent, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;
    return data || [];
  }
};

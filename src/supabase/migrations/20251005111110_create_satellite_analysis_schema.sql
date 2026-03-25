/*
  # Satellite Analysis System - Complete Database Schema

  ## Overview
  Creates comprehensive database structure for satellite analysis application including
  analysis results, user activities, ML predictions, and real-time monitoring data.

  ## New Tables

  ### 1. analyses
  Stores all satellite analysis results with geographic and vegetation data
  - Primary fields: region coordinates, NDVI values, land cover percentages
  - Supports JSON storage for alerts and change detection metrics
  - Indexed for fast user queries and time-based filtering

  ### 2. user_activities  
  Tracks all user interactions and system events
  - Logs actions, timestamps, and metadata
  - Enables audit trails and user behavior analysis
  - Supports flexible JSON data storage

  ### 3. ml_predictions
  Stores machine learning predictions for environmental analysis
  - NDVI forecasts, deforestation risk, climate impact
  - Includes confidence scores and risk levels
  - Stores recommendations and contributing factors

  ## Security
  - Row Level Security (RLS) enabled on all tables
  - Users can only access their own data
  - Policies for SELECT, INSERT, UPDATE, DELETE operations
  - Authentication required for all data access

  ## Performance
  - Indexes on user_id for fast filtering
  - Indexes on created_at for time-based queries
  - Indexes on frequently searched fields

  ## Data Types
  - numeric: High precision for geographic coordinates and calculations
  - jsonb: Flexible storage for complex nested data
  - timestamptz: UTC timestamps with timezone support
*/

-- =====================================================
-- TABLE: analyses
-- =====================================================
CREATE TABLE IF NOT EXISTS analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  region_name text NOT NULL,
  start_latitude numeric NOT NULL,
  start_longitude numeric NOT NULL,
  end_latitude numeric NOT NULL,
  end_longitude numeric NOT NULL,
  area_size_km2 numeric DEFAULT 0,
  avg_ndvi numeric DEFAULT 0,
  forest_cover_percent numeric DEFAULT 0,
  healthy_vegetation numeric DEFAULT 0,
  moderate_vegetation numeric DEFAULT 0,
  unhealthy_vegetation numeric DEFAULT 0,
  water_bodies numeric DEFAULT 0,
  urban_areas numeric DEFAULT 0,
  analysis_type text DEFAULT 'NDVI',
  confidence numeric DEFAULT 0,
  alerts jsonb DEFAULT '[]'::jsonb,
  change_detection jsonb DEFAULT '{}'::jsonb,
  source text DEFAULT 'real-time',
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- TABLE: user_activities
-- =====================================================
CREATE TABLE IF NOT EXISTS user_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  action text NOT NULL,
  details text NOT NULL,
  data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- TABLE: ml_predictions
-- =====================================================
CREATE TABLE IF NOT EXISTS ml_predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  prediction_type text NOT NULL,
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  predictions jsonb DEFAULT '[]'::jsonb,
  confidence_intervals jsonb DEFAULT '[]'::jsonb,
  risk_score numeric DEFAULT 0,
  risk_level text DEFAULT 'LOW',
  factors jsonb DEFAULT '{}'::jsonb,
  recommendations jsonb DEFAULT '[]'::jsonb,
  accuracy numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- ENABLE ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE ml_predictions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES: analyses
-- =====================================================

-- Allow users to view their own analyses
CREATE POLICY "Users can view own analyses"
  ON analyses FOR SELECT
  TO authenticated
  USING (auth.uid()::text = user_id);

-- Allow users to insert their own analyses
CREATE POLICY "Users can insert own analyses"
  ON analyses FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = user_id);

-- Allow users to update their own analyses
CREATE POLICY "Users can update own analyses"
  ON analyses FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

-- Allow users to delete their own analyses
CREATE POLICY "Users can delete own analyses"
  ON analyses FOR DELETE
  TO authenticated
  USING (auth.uid()::text = user_id);

-- =====================================================
-- RLS POLICIES: user_activities
-- =====================================================

-- Allow users to view their own activities
CREATE POLICY "Users can view own activities"
  ON user_activities FOR SELECT
  TO authenticated
  USING (auth.uid()::text = user_id);

-- Allow users to insert their own activities
CREATE POLICY "Users can insert own activities"
  ON user_activities FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = user_id);

-- Allow users to update their own activities
CREATE POLICY "Users can update own activities"
  ON user_activities FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

-- Allow users to delete their own activities
CREATE POLICY "Users can delete own activities"
  ON user_activities FOR DELETE
  TO authenticated
  USING (auth.uid()::text = user_id);

-- =====================================================
-- RLS POLICIES: ml_predictions
-- =====================================================

-- Allow users to view their own predictions
CREATE POLICY "Users can view own predictions"
  ON ml_predictions FOR SELECT
  TO authenticated
  USING (auth.uid()::text = user_id);

-- Allow users to insert their own predictions
CREATE POLICY "Users can insert own predictions"
  ON ml_predictions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = user_id);

-- Allow users to update their own predictions
CREATE POLICY "Users can update own predictions"
  ON ml_predictions FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

-- Allow users to delete their own predictions
CREATE POLICY "Users can delete own predictions"
  ON ml_predictions FOR DELETE
  TO authenticated
  USING (auth.uid()::text = user_id);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Analyses table indexes
CREATE INDEX IF NOT EXISTS idx_analyses_user_id 
  ON analyses(user_id);

CREATE INDEX IF NOT EXISTS idx_analyses_created_at 
  ON analyses(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_analyses_region 
  ON analyses(region_name);

CREATE INDEX IF NOT EXISTS idx_analyses_type 
  ON analyses(analysis_type);

-- User activities table indexes
CREATE INDEX IF NOT EXISTS idx_activities_user_id 
  ON user_activities(user_id);

CREATE INDEX IF NOT EXISTS idx_activities_created_at 
  ON user_activities(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_activities_action 
  ON user_activities(action);

-- ML predictions table indexes
CREATE INDEX IF NOT EXISTS idx_predictions_user_id 
  ON ml_predictions(user_id);

CREATE INDEX IF NOT EXISTS idx_predictions_created_at 
  ON ml_predictions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_predictions_type 
  ON ml_predictions(prediction_type);

CREATE INDEX IF NOT EXISTS idx_predictions_risk_level 
  ON ml_predictions(risk_level);
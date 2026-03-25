-- Add ALL missing columns to satellite_data table
ALTER TABLE satellite_data ADD COLUMN IF NOT EXISTS ndwi_value DOUBLE PRECISION;
ALTER TABLE satellite_data ADD COLUMN IF NOT EXISTS state VARCHAR(100);
ALTER TABLE satellite_data ADD COLUMN IF NOT EXISTS pm10 DOUBLE PRECISION;
ALTER TABLE satellite_data ADD COLUMN IF NOT EXISTS last_comparison_date TIMESTAMP;
ALTER TABLE satellite_data ADD COLUMN IF NOT EXISTS ndvi_change_percent DOUBLE PRECISION;
ALTER TABLE satellite_data ADD COLUMN IF NOT EXISTS previous_ndvi DOUBLE PRECISION;

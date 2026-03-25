package com.satellite;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.Statement;

public class DatabaseFix {
    public static void main(String[] args) {
        String url = "jdbc:postgresql://aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres?sslmode=require";
        String user = "postgres.irrfzqlarfqhebyqoerl";
        String password = "Amey@2005";

        try (Connection conn = DriverManager.getConnection(url, user, password);
             Statement stmt = conn.createStatement()) {
            
            System.out.println("Applying schema fixes...");
            
            // Drop view cascade if it's there
            stmt.execute("DROP MATERIALIZED VIEW IF EXISTS mv_dashboard_stats CASCADE");
            
            // Add missing columns if they aren't there
            String[] queries = {
                "ALTER TABLE satellite_data ADD COLUMN IF NOT EXISTS air_quality_index double precision",
                "ALTER TABLE satellite_data ADD COLUMN IF NOT EXISTS pm25 double precision",
                "ALTER TABLE satellite_data ADD COLUMN IF NOT EXISTS pm10 double precision",
                "ALTER TABLE satellite_data ADD COLUMN IF NOT EXISTS temperature double precision",
                "ALTER TABLE satellite_data ADD COLUMN IF NOT EXISTS flood_risk double precision",
                "ALTER TABLE satellite_data ADD COLUMN IF NOT EXISTS deforestation_risk text",
                "ALTER TABLE satellite_data ADD COLUMN IF NOT EXISTS previous_ndvi double precision",
                "ALTER TABLE satellite_data ADD COLUMN IF NOT EXISTS ndvi_change_percent double precision",
                "ALTER TABLE satellite_data ADD COLUMN IF NOT EXISTS last_comparison_date timestamp",
                "ALTER TABLE satellite_data ADD COLUMN IF NOT EXISTS ndwi_value double precision",
                "ALTER TABLE satellite_data ADD COLUMN IF NOT EXISTS created_at timestamp DEFAULT CURRENT_TIMESTAMP"
            };
            
            for (String query : queries) {
                try {
                    stmt.execute(query);
                } catch (Exception ignore) {
                    System.out.println("Skip: " + query);
                }
            }
            
            System.out.println("Fixes applied successfully.");
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}

package com.satellite.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class DatabasePatcher implements CommandLineRunner {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) throws Exception {
        System.out.println("🔧 Running Database Patcher...");
        try {
            // Add missing ndwi_value column
            jdbcTemplate.execute("ALTER TABLE satellite_data ADD COLUMN IF NOT EXISTS ndwi_value DOUBLE PRECISION");
            System.out.println("✅ Successfully added ndwi_value column to satellite_data table");
            
            // Fix metadata column type in disaster_events if needed (though we fixed the entity mapping)
            // jdbcTemplate.execute("ALTER TABLE disaster_events ALTER COLUMN metadata TYPE TEXT USING metadata::text");
            
        } catch (Exception e) {
            System.err.println("❌ Database patch failed: " + e.getMessage());
            // Don't throw exception to allow app to start if column already exists or other non-critical error
        }
    }
}

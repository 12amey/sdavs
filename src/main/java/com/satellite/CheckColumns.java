package com.satellite;

import java.sql.*;
import java.util.*;

public class CheckColumns {
    public static void main(String[] args) {
        String url = "jdbc:postgresql://aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres?sslmode=require";
        String user = "postgres.irrfzqlarfqhebyqoerl";
        String password = "Amey@2005";

        try (Connection conn = DriverManager.getConnection(url, user, password)) {
            DatabaseMetaData meta = conn.getMetaData();
            ResultSet rs = meta.getColumns(null, "public", "satellite_data", "%");
            Set<String> columns = new HashSet<>();
            while (rs.next()) {
                columns.add(rs.getString("COLUMN_NAME"));
            }
            System.out.println("COLUMNS: " + columns);
            
            // Check for missing columns
            String[] required = {"air_quality_index", "pm25", "pm10", "temperature", "flood_risk", "deforestation_risk"};
            for (String col : required) {
                if (!columns.contains(col)) {
                    System.out.println("MISSING: " + col);
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}

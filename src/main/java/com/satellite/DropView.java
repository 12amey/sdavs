package com.satellite;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.Statement;

public class DropView {
    public static void main(String[] args) {
        String url = "jdbc:postgresql://aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres?sslmode=require";
        String user = "postgres.irrfzqlarfqhebyqoerl";
        String password = "Amey@2005";

        try (Connection conn = DriverManager.getConnection(url, user, password);
             Statement stmt = conn.createStatement()) {
            System.out.println("Dropping materialized view...");
            stmt.execute("DROP MATERIALIZED VIEW IF EXISTS mv_dashboard_stats CASCADE");
            System.out.println("Materialized view dropped successfully.");
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}

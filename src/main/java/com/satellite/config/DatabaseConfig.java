package com.satellite.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.boot.jdbc.DataSourceBuilder;

import javax.sql.DataSource;

@Configuration
public class DatabaseConfig {
    
    @Value("${spring.datasource.url}")
    private String datasourceUrl;
    
    @Value("${spring.datasource.username}")
    private String datasourceUsername;
    
    @Value("${spring.datasource.password}")
    private String datasourcePassword;
    
    @Value("${spring.datasource.driver-class-name}")
    private String datasourceDriver;
    
    @Bean
    @Primary
    public DataSource dataSource() {
        return DataSourceBuilder.create()
                .url(datasourceUrl)
                .username(datasourceUsername)
                .password(datasourcePassword)
                .driverClassName(datasourceDriver)
                .build();
    }
}
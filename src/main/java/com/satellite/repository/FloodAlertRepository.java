package com.satellite.repository;

import com.satellite.model.FloodAlert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FloodAlertRepository extends JpaRepository<FloodAlert, Long> {
    
    // Find active alerts
    List<FloodAlert> findByIsActiveTrue();
    
    // Find alerts by city
    List<FloodAlert> findByCityName(String cityName);
    
    // Find active alerts by city
    List<FloodAlert> findByCityNameAndIsActiveTrue(String cityName);
    
    // Find by alert level
    List<FloodAlert> findByAlertLevel(String alertLevel);
    
    // Count active alerts
    long countByIsActiveTrue();
    
    // Count active alerts by level
    long countByAlertLevelAndIsActiveTrue(String alertLevel);
}

package com.satellite.repository;

import com.satellite.model.DeforestationAlert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DeforestationAlertRepository extends JpaRepository<DeforestationAlert, Long> {
    
    // Find all unresolved alerts
    List<DeforestationAlert> findByIsResolvedFalse();
    
    // Find alerts by city
    List<DeforestationAlert> findByCityName(String cityName);
    
    // Find unresolved alerts by city
    List<DeforestationAlert> findByCityNameAndIsResolvedFalse(String cityName);
    
    // Find alerts by risk level
    List<DeforestationAlert> findByRiskLevel(String riskLevel);
    
    // Count alerts by city
    long countByCityName(String cityName);
    
    // Count unresolved alerts
    long countByIsResolvedFalse();
    
    // Find recent alerts - use service layer for date calculations
    @Query("SELECT d FROM DeforestationAlert d WHERE d.isResolved = false ORDER BY d.detectionDate DESC")
    List<DeforestationAlert> findRecentAlerts();
}

package com.satellite.repository;

import com.satellite.model.EnvironmentalRisk;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EnvironmentalRiskRepository extends JpaRepository<EnvironmentalRisk, Long> {
    
    // Find by city name
    Optional<EnvironmentalRisk> findByCityName(String cityName);
    
    // Find by risk level
    List<EnvironmentalRisk> findByRiskLevel(String riskLevel);
    
    // Find all ordered by risk score descending
    List<EnvironmentalRisk> findAllByOrderByTotalRiskScoreDesc();
    
    // Count by risk level
    long countByRiskLevel(String riskLevel);
}

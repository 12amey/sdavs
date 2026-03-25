package com.satellite.repository;

import com.satellite.model.NdwiData;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface NdwiDataRepository extends JpaRepository<NdwiData, Long> {
    
    // Find by city
    List<NdwiData> findByCityName(String cityName);
    
    // Find latest NDWI for a city
    Optional<NdwiData> findFirstByCityNameOrderByAnalysisDateDesc(String cityName);
    
    // Find historical NDWI data (last N days)
    @Query("SELECT n FROM NdwiData n WHERE n.cityName = ?1 AND n.analysisDate >= ?2 ORDER BY n.analysisDate DESC")
    List<NdwiData> findHistoricalData(String cityName, LocalDateTime sinceDate);
    
    // Find anomalies
    List<NdwiData> findByIsAnomalyTrue();
    
    // Get last 5 records for a city - use service layer with Pageable
    List<NdwiData> findByCityNameOrderByAnalysisDateDesc(String cityName);
}

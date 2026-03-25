package com.satellite.repository;

import com.satellite.model.AqiData;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface AqiDataRepository extends JpaRepository<AqiData, Long> {
    
    // Find by city
    List<AqiData> findByCityName(String cityName);
    
    // Find latest AQI for a city
    Optional<AqiData> findFirstByCityNameOrderByFetchDateDesc(String cityName);
    
    // Find last 7 days of data for a city
    @Query("SELECT a FROM AqiData a WHERE a.cityName = ?1 AND a.fetchDate >= ?2 ORDER BY a.fetchDate DESC")
    List<AqiData> findLast7Days(String cityName, LocalDateTime sevenDaysAgo);
    
    // Find by category
    List<AqiData> findByCategory(String category);
    
    // Get recent data - use service layer for date filtering
    List<AqiData> findAllByOrderByFetchDateDesc();
}

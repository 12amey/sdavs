package com.satellite.repository;

import com.satellite.model.SatelliteData;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface SatelliteDataRepository extends JpaRepository<SatelliteData, Long> {
    
    @Query("SELECT s FROM SatelliteData s WHERE s.latitude BETWEEN :minLat AND :maxLat " +
           "AND s.longitude BETWEEN :minLon AND :maxLon")
    List<SatelliteData> findByCoordinateRange(
        @Param("minLat") Double minLat, 
        @Param("maxLat") Double maxLat,
        @Param("minLon") Double minLon, 
        @Param("maxLon") Double maxLon
    );
    
    @Query("SELECT s FROM SatelliteData s WHERE s.latitude BETWEEN :minLat AND :maxLat " +
           "AND s.longitude BETWEEN :minLon AND :maxLon " +
           "AND s.analysisDate BETWEEN :startDate AND :endDate")
    List<SatelliteData> findByCoordinateRangeAndDateRange(
        @Param("minLat") Double minLat, 
        @Param("maxLat") Double maxLat,
        @Param("minLon") Double minLon, 
        @Param("maxLon") Double maxLon,
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate
    );
    
    @Query("SELECT AVG(s.ndviValue) FROM SatelliteData s WHERE s.latitude BETWEEN :minLat AND :maxLat " +
           "AND s.longitude BETWEEN :minLon AND :maxLon")
    Double findAverageNdviByCoordinateRange(
        @Param("minLat") Double minLat, 
        @Param("maxLat") Double maxLat,
        @Param("minLon") Double minLon, 
        @Param("maxLon") Double maxLon
    );
    
    @Query("SELECT s.classification, COUNT(s) FROM SatelliteData s " +
           "WHERE s.latitude BETWEEN :minLat AND :maxLat " +
           "AND s.longitude BETWEEN :minLon AND :maxLon " +
           "GROUP BY s.classification")
    List<Object[]> findClassificationCountsByCoordinateRange(
        @Param("minLat") Double minLat, 
        @Param("maxLat") Double maxLat,
        @Param("minLon") Double minLon, 
        @Param("maxLon") Double maxLon
    );
    
    List<SatelliteData> findByAnalysisDateBetween(LocalDateTime startDate, LocalDateTime endDate);
    
    List<SatelliteData> findByClassification(SatelliteData.Classification classification);
    
    List<SatelliteData> findByCity(String city);
    
    // Alias for findByCityName - same as findByCity
    default List<SatelliteData> findByCityName(String cityName) {
       return findByCity(cityName);
    }
    
    // Alias for area analysis - uses existing findByCoordinateRange
    default List<SatelliteData> findByLatitudeBetweenAndLongitudeBetween(
            Double minLat, Double maxLat, Double minLon, Double maxLon) {
        return findByCoordinateRange(minLat, maxLat, minLon, maxLon);
    }
}
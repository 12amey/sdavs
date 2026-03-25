package com.satellite.repository;

import com.satellite.model.DisasterEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface DisasterEventRepository extends JpaRepository<DisasterEvent, Long> {
    
    Optional<DisasterEvent> findByEonetId(String eonetId);
    
    List<DisasterEvent> findByEventDateAfter(LocalDateTime date);
    
    List<DisasterEvent> findByCategory(String category);
    
    @Query("SELECT d FROM DisasterEvent d WHERE d.latitude BETWEEN :minLat AND :maxLat AND d.longitude BETWEEN :minLon AND :maxLon AND d.eventDate > :afterDate")
    List<DisasterEvent> findActiveEventsInBounds(
        @Param("minLat") Double minLat,
        @Param("maxLat") Double maxLat,
        @Param("minLon") Double minLon,
        @Param("maxLon") Double maxLon,
        @Param("afterDate") LocalDateTime afterDate
    );
    
    @Query("SELECT DISTINCT d.category FROM DisasterEvent d")
    List<String> findDistinctCategories();
}

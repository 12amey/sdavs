package com.satellite.repository;

import com.satellite.model.UserAnalysis;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface UserAnalysisRepository extends JpaRepository<UserAnalysis, Long> {
    
    List<UserAnalysis> findByUserIdOrderByCreatedAtDesc(Long userId);
    
    @Query("SELECT ua FROM UserAnalysis ua WHERE ua.user.id = :userId " +
           "AND ua.createdAt BETWEEN :startDate AND :endDate " +
           "ORDER BY ua.createdAt DESC")
    List<UserAnalysis> findByUserIdAndDateRange(
        @Param("userId") Long userId,
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate
    );
    
    @Query("SELECT ua FROM UserAnalysis ua WHERE ua.user.id = :userId " +
           "ORDER BY ua.createdAt DESC")
    List<UserAnalysis> findTop10ByUserIdOrderByCreatedAtDesc(@Param("userId") Long userId);
}
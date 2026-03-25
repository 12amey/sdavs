package com.satellite.repository;

import com.satellite.model.DataUpdateLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DataUpdateLogRepository extends JpaRepository<DataUpdateLog, Long> {
    
    // Use Spring Data convention instead of invalid JPQL LIMIT
    default Optional<DataUpdateLog> findLatestUpdate() {
        List<DataUpdateLog> results = findTop1ByOrderByUpdateTimestampDesc();
        return results.isEmpty() ? Optional.empty() : Optional.of(results.get(0));
    }
    
    // Find recent update logs for status monitoring
    List<DataUpdateLog> findTop5ByOrderByUpdateTimestampDesc();
    List<DataUpdateLog> findTop10ByOrderByUpdateTimestampDesc();
    List<DataUpdateLog> findTop1ByOrderByUpdateTimestampDesc();
}


package com.satellite.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "data_update_log")
public class DataUpdateLog {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "update_timestamp")
    private LocalDateTime updateTimestamp;
    
    @Column(name = "cities_updated")
    private Integer citiesUpdated;
    
    @Column(name = "status")
    private String status;
    
    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    public DataUpdateLog() {
    }

    public DataUpdateLog(LocalDateTime updateTimestamp, Integer citiesUpdated, String status, String errorMessage) {
        this.updateTimestamp = updateTimestamp;
        this.citiesUpdated = citiesUpdated;
        this.status = status;
        this.errorMessage = errorMessage;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public LocalDateTime getUpdateTimestamp() {
        return updateTimestamp;
    }

    public void setUpdateTimestamp(LocalDateTime updateTimestamp) {
        this.updateTimestamp = updateTimestamp;
    }

    public Integer getCitiesUpdated() {
        return citiesUpdated;
    }

    public void setCitiesUpdated(Integer citiesUpdated) {
        this.citiesUpdated = citiesUpdated;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getErrorMessage() {
        return errorMessage;
    }

    public void setErrorMessage(String errorMessage) {
        this.errorMessage = errorMessage;
    }
    
    // Convenience method for API compatibility
    public String getErrors() {
        return errorMessage;
    }
}



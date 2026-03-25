package com.satellite.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.satellite.model.DisasterEvent;
import com.satellite.repository.DisasterEventRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
public class EONETService {
    
    private static final Logger logger = LoggerFactory.getLogger(EONETService.class);
    private static final String EONET_API = "https://eonet.gsfc.nasa.gov/api/v3/events";
    
    @Autowired
    private DisasterEventRepository repository;
    
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    /**
     * Fetch and cache active disaster events from EONET
     * Runs every 5 minutes
     */
    @Scheduled(fixedRate = 300000) // 5 minutes
    public void syncDisasterEvents() {
        logger.info("Starting EONET disaster events sync");
        
        try {
            String url = EONET_API + "?status=open&limit=100";
            String response = restTemplate.getForObject(url, String.class);
            
            JsonNode root = objectMapper.readTree(response);
            JsonNode events = root.get("events");
            
            int synced = 0;
            if (events != null && events.isArray()) {
                for (JsonNode eventNode : events) {
                    try {
                        DisasterEvent event = parseEONETEvent(eventNode);
                        
                        // Check if event already exists
                        repository.findByEonetId(event.getEonetId())
                            .ifPresentOrElse(
                                existing -> {
                                    // Update existing
                                    existing.setTitle(event.getTitle());
                                    existing.setDescription(event.getDescription());
                                    existing.setMetadata(event.getMetadata());
                                    repository.save(existing);
                                },
                                () -> {
                                    // Save new
                                    repository.save(event);
                                }
                            );
                        synced++;
                    } catch (Exception e) {
                        logger.error("Failed to parse EONET event", e);
                    }
                }
            }
            
            logger.info("EONET sync completed. Synced {} events", synced);
            
        } catch (Exception e) {
            logger.error("EONET sync failed", e);
        }
    }
    
    /**
     * Get all active disaster events
     */
    @Cacheable(value = "disasters", key = "'all'")
    public List<DisasterEvent> getAllActiveEvents() {
        LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);
        return repository.findByEventDateAfter(thirtyDaysAgo);
    }
    
    /**
     * Get disaster events in specific bounds
     */
    public List<DisasterEvent> getEventsInBounds(double minLat, double maxLat, 
                                                   double minLon, double maxLon) {
        LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);
        return repository.findActiveEventsInBounds(minLat, maxLat, minLon, maxLon, thirtyDaysAgo);
    }
    
    /**
     * Get events by category
     */
    public List<DisasterEvent> getEventsByCategory(String category) {
        return repository.findByCategory(category);
    }
    
    /**
     * Parse EONET JSON to DisasterEvent entity
     */
    private DisasterEvent parseEONETEvent(JsonNode eventNode) {
        DisasterEvent event = new DisasterEvent();
        
        event.setEonetId(eventNode.get("id").asText());
        event.setTitle(eventNode.get("title").asText());
        
        // Get category
        JsonNode categories = eventNode.get("categories");
        if (categories != null && categories.isArray() && categories.size() > 0) {
            event.setCategory(categories.get(0).get("title").asText());
        }
        
        // Get coordinates from first geometry
        JsonNode geometries = eventNode.get("geometry");
        if (geometries != null && geometries.isArray() && geometries.size() > 0) {
            JsonNode firstGeom = geometries.get(0);
            JsonNode coords = firstGeom.get("coordinates");
            
            if (coords != null && coords.isArray() && coords.size() >= 2) {
                event.setLongitude(coords.get(0).asDouble());
                event.setLatitude(coords.get(1).asDouble());
            }
            
            // Get date
            String dateStr = firstGeom.get("date").asText();
            try {
                ZonedDateTime zdt = ZonedDateTime.parse(dateStr);
                event.setEventDate(zdt.toLocalDateTime());
            } catch (Exception e) {
                event.setEventDate(LocalDateTime.now());
            }
        }
        
        // Description
        if (eventNode.has("description")) {
            event.setDescription(eventNode.get("description").asText());
        }
        
        // Store full metadata as JSON
        event.setMetadata(eventNode.toString());
        
        return event;
    }
}

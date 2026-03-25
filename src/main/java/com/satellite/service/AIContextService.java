package com.satellite.service;

import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class AIContextService {
    
    /**
     * Build contextual prompt for AI analysis with structured response format
     */
    public String buildContextualPrompt(Map<String, Object> metadata) {
        StringBuilder context = new StringBuilder();
        
        // Domain context
        context.append("You are analyzing a satellite image for vegetation health and land use classification.\n\n");
        
        // Expected response format
        context.append("You MUST respond with ONLY valid JSON in this exact structure:\n");
        context.append("{\n");
        context.append("  \"ndvi_average\": <float between 0.0 and 1.0>,\n");
        context.append("  \"vegetation_health\": \"HEALTHY\" | \"MODERATE\" | \"STRESSED\" | \"DEGRADED\",\n");
        context.append("  \"land_use_primary\": \"FOREST\" | \"AGRICULTURE\" | \"URBAN\" | \"WATER\" | \"BARREN\",\n");
        context.append("  \"coverage_percent\": <integer between 0 and 100>,\n");
        context.append("  \"anomalies\": [\"description of unusual patterns, if any\"],\n");
        context.append("  \"recommendations\": [\"actionable insights based on analysis\"]\n");
        context.append("}\n\n");
        
        // Add metadata context if available
        if (metadata != null && !metadata.isEmpty()) {
            context.append("Additional Context:\n");
            
            if (metadata.containsKey("location")) {
                context.append("- Location: ").append(metadata.get("location")).append("\n");
            }
            if (metadata.containsKey("city")) {
                context.append("- City: ").append(metadata.get("city")).append("\n");
            }
            if (metadata.containsKey("date")) {
                context.append("- Date: ").append(metadata.get("date")).append("\n");
            }
            if (metadata.containsKey("season")) {
                context.append("- Season: ").append(metadata.get("season")).append("\n");
            }
            
            context.append("\n");
        }
        
        // Analysis guidelines
        context.append("Analysis Guidelines:\n");
        context.append("- NDVI > 0.6 typically indicates healthy vegetation\n");
        context.append("- NDVI 0.4-0.6 indicates moderate vegetation health\n");
        context.append("- NDVI < 0.4 indicates stressed or sparse vegetation\n");
        context.append("- Look for patterns like deforestation, urban expansion, or drought stress\n");
        context.append("- Consider seasonal variations in your recommendations\n\n");
        
        context.append("Analyze the image and respond ONLY with the JSON object, no additional text.\n");
        
        return context.toString();
    }
    
    /**
     * Extract JSON from AI response (handles markdown code fences)
     */
    public String extractJSON(String aiResponse) {
        if (aiResponse == null || aiResponse.trim().isEmpty()) {
            return "{}";
        }
        
        // Remove markdown code fences if present
        String cleaned = aiResponse.trim();
        if (cleaned.startsWith("```json")) {
            cleaned = cleaned.substring(7);
        } else if (cleaned.startsWith("```")) {
            cleaned = cleaned.substring(3);
        }
        if (cleaned.endsWith("```")) {
            cleaned = cleaned.substring(0, cleaned.length() - 3);
        }
        cleaned = cleaned.trim();
        
        // Find JSON object boundaries
        int start = cleaned.indexOf("{");
        int end = cleaned.lastIndexOf("}");
        
        if (start >= 0 && end > start) {
            return cleaned.substring(start, end + 1);
        }
        
        return cleaned;
    }
    
    /**
     * Validate structured AI response
     */
    public Map<String, Object> validateResponse(Map<String, Object> response) {
        Map<String, Object> validated = new HashMap<>(response);
        
        // Ensure required fields exist with defaults
        validated.putIfAbsent("ndvi_average", 0.5);
        validated.putIfAbsent("vegetation_health", "MODERATE");
        validated.putIfAbsent("land_use_primary", "UNKNOWN");
        validated.putIfAbsent("coverage_percent", 50);
        validated.putIfAbsent("anomalies", new String[]{});
        validated.putIfAbsent("recommendations", new String[]{});
        
        // Validate NDVI range
        if (validated.get("ndvi_average") instanceof Number) {
            double ndvi = ((Number) validated.get("ndvi_average")).doubleValue();
            if (ndvi < 0.0) ndvi = 0.0;
            if (ndvi > 1.0) ndvi = 1.0;
            validated.put("ndvi_average", ndvi);
        }
        
        // Validate coverage percent
        if (validated.get("coverage_percent") instanceof Number) {
            int coverage = ((Number) validated.get("coverage_percent")).intValue();
            if (coverage < 0) coverage = 0;
            if (coverage > 100) coverage = 100;
            validated.put("coverage_percent", coverage);
        }
        
        return validated;
    }
}

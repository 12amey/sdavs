package com.satellite.exception;

import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@ControllerAdvice
public class GlobalExceptionHandler {
    
    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);
    
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleException(Exception ex, HttpServletRequest request) {
        String errorId = UUID.randomUUID().toString();
        
        // Add error context to MDC for structured logging
        MDC.put("errorId", errorId);
        MDC.put("errorType", ex.getClass().getSimpleName());
        MDC.put("errorMessage", ex.getMessage());
        
        // Log error with full stack trace
        logger.error("CRITICAL_ERROR [{}]: {} at {}", 
            errorId, ex.getMessage(), request.getRequestURI(), ex);
        
        // Build error response
        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("errorId", errorId);
        errorResponse.put("timestamp", LocalDateTime.now());
        errorResponse.put("path", request.getRequestURI());
        errorResponse.put("message", ex.getMessage());
        errorResponse.put("type", ex.getClass().getSimpleName());
        
        MDC.clear();
        
        return ResponseEntity
            .status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(errorResponse);
    }
    
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalArgument(
            IllegalArgumentException ex, 
            HttpServletRequest request) {
        
        String errorId = UUID.randomUUID().toString();
        
        MDC.put("errorId", errorId);
        logger.warn("Invalid request [{}]: {} at {}", errorId, ex.getMessage(), request.getRequestURI());
        
        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("errorId", errorId);
        errorResponse.put("timestamp", LocalDateTime.now());
        errorResponse.put("path", request.getRequestURI());
        errorResponse.put("message", ex.getMessage());
        
        MDC.clear();
        
        return ResponseEntity
            .status(HttpStatus.BAD_REQUEST)
            .body(errorResponse);
    }
}

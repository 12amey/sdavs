package com.satellite.interceptor;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.UUID;

@Component
public class LoggingInterceptor implements HandlerInterceptor {
    
    private static final Logger logger = LoggerFactory.getLogger(LoggingInterceptor.class);
    
    @Override
    public boolean preHandle(HttpServletRequest request, 
                            HttpServletResponse response, 
                            Object handler) {
        long startTime = System.currentTimeMillis();
        request.setAttribute("startTime", startTime);
        
        // Add contextual information to MDC for structured logging
        String requestId = UUID.randomUUID().toString();
        MDC.put("requestId", requestId);
        MDC.put("method", request.getMethod());
        MDC.put("path", request.getRequestURI());
        MDC.put("ip", request.getRemoteAddr());
        MDC.put("userAgent", request.getHeader("User-Agent"));
        
        // Add custom header for request tracking
        response.setHeader("X-Request-ID", requestId);
        
        logger.info("Incoming request: {} {}", request.getMethod(), request.getRequestURI());
        return true;
    }
    
    @Override
    public void afterCompletion(HttpServletRequest request, 
                               HttpServletResponse response, 
                               Object handler, 
                               Exception ex) {
        long startTime = (Long) request.getAttribute("startTime");
        long duration = System.currentTimeMillis() - startTime;
        
        MDC.put("duration", String.valueOf(duration));
        MDC.put("status", String.valueOf(response.getStatus()));
        
        if (ex != null) {
            logger.error("Request failed with exception", ex);
        } else if (response.getStatus() >= 500) {
            logger.error("Request completed with server error: status={}, duration={}ms", 
                        response.getStatus(), duration);
        } else if (response.getStatus() >= 400) {
            logger.warn("Request completed with client error: status={}, duration={}ms", 
                       response.getStatus(), duration);
        } else {
            logger.info("Request completed: status={}, duration={}ms", 
                       response.getStatus(), duration);
        }
        
        // Alert on slow requests (>5 seconds)
        if (duration > 5000) {
            logger.warn("SLOW_REQUEST_ALERT: {} took {}ms", request.getRequestURI(), duration);
        }
        
        // Alert on very slow requests (>15 seconds)
        if (duration > 15000) {
            logger.error("CRITICAL_SLOW_REQUEST: {} took {}ms - INVESTIGATE IMMEDIATELY", 
                        request.getRequestURI(), duration);
        }
        
        MDC.clear();
    }
}

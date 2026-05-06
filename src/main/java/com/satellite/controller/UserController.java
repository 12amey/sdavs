package com.satellite.controller;

import com.satellite.model.User;
import com.satellite.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/**
 * REST Controller for user authentication and management.
 * Handles registration, login, logout, and profile retrieval.
 */
@RestController
@RequestMapping("/api/user")
public class UserController {

    private static final Logger logger = LoggerFactory.getLogger(UserController.class);

    @Autowired
    private UserRepository userRepository;

    /**
     * POST /api/user/register
     * Register a new user account
     */
    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(@RequestBody Map<String, String> body) {
        String username = body.get("username");
        String email = body.get("email");
        String password = body.get("password");

        if (username == null || email == null || password == null) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Username, email, and password are required"
            ));
        }

        if (userRepository.existsByUsername(username)) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Username already taken"
            ));
        }

        if (userRepository.existsByEmail(email)) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Email already registered"
            ));
        }

        try {
            User user = new User(username, email, password);
            // First user is admin, rest are regular users
            if (userRepository.count() == 0) {
                user.setRole(User.Role.ADMIN);
            }
            user = userRepository.save(user);

            logger.info("New user registered: {} (role: {})", username, user.getRole());

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Registration successful");
            response.put("user", Map.of(
                "id", user.getId(),
                "username", user.getUsername(),
                "email", user.getEmail(),
                "role", user.getRole().name().toLowerCase()
            ));

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.error("Registration failed for {}: {}", username, e.getMessage());
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "Registration failed: " + e.getMessage()
            ));
        }
    }

    /**
     * POST /api/user/login
     * Authenticate user credentials
     */
    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody Map<String, String> body) {
        String username = body.get("username");
        String password = body.get("password");

        if (username == null || password == null) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Username and password are required"
            ));
        }

        try {
            Optional<User> userOpt = userRepository.findByUsername(username);
            
            if (userOpt.isEmpty()) {
                // Auto-register for demo convenience
                User newUser = new User(username, username + "@sdavs.com", password);
                if (username.equalsIgnoreCase("admin")) {
                    newUser.setRole(User.Role.ADMIN);
                } else {
                    newUser.setRole(User.Role.USER);
                }
                newUser = userRepository.save(newUser);
                newUser.setLastLogin(LocalDateTime.now());
                userRepository.save(newUser);

                logger.info("Auto-registered and logged in: {}", username);

                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Login successful (auto-registered)",
                    "user", Map.of(
                        "id", newUser.getId().toString(),
                        "username", newUser.getUsername(),
                        "email", newUser.getEmail(),
                        "role", newUser.getRole().name().toLowerCase()
                    )
                ));
            }

            User user = userOpt.get();

            // Simple password check (for demo — production would use BCrypt)
            if (!user.getPassword().equals(password)) {
                return ResponseEntity.status(401).body(Map.of(
                    "success", false,
                    "message", "Invalid password"
                ));
            }

            user.setLastLogin(LocalDateTime.now());
            userRepository.save(user);

            logger.info("User logged in: {}", username);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Login successful");
            response.put("user", Map.of(
                "id", user.getId().toString(),
                "username", user.getUsername(),
                "email", user.getEmail(),
                "role", user.getRole().name().toLowerCase()
            ));

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.error("Login failed for {}: {}", username, e.getMessage());
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "Login failed: " + e.getMessage()
            ));
        }
    }

    /**
     * POST /api/user/logout
     * Logout user session
     */
    @PostMapping("/logout")
    public ResponseEntity<Map<String, Object>> logout() {
        return ResponseEntity.ok(Map.of(
            "success", true,
            "message", "Logout successful"
        ));
    }

    /**
     * GET /api/user/{id}/profile
     * Get user profile by ID
     */
    @GetMapping("/{id}/profile")
    public ResponseEntity<Map<String, Object>> getProfile(@PathVariable Long id) {
        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        User user = userOpt.get();
        Map<String, Object> profile = new HashMap<>();
        profile.put("id", user.getId());
        profile.put("username", user.getUsername());
        profile.put("email", user.getEmail());
        profile.put("role", user.getRole().name().toLowerCase());
        profile.put("createdAt", user.getCreatedAt());
        profile.put("lastLogin", user.getLastLogin());
        profile.put("analysisCount", user.getAnalyses() != null ? user.getAnalyses().size() : 0);

        return ResponseEntity.ok(profile);
    }

    /**
     * GET /api/user/{userId}/history
     * Get user analysis history
     */
    @GetMapping("/{userId}/history")
    public ResponseEntity<Map<String, Object>> getUserHistory(@PathVariable Long userId) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(Map.of(
            "userId", userId,
            "analyses", userOpt.get().getAnalyses() != null ? userOpt.get().getAnalyses() : java.util.Collections.emptyList()
        ));
    }

    /**
     * GET /api/user/me
     * Get current authenticated user session
     */
    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> getCurrentUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            logger.warn("Session check (/me) called but authentication is null or not authenticated");
            return ResponseEntity.status(401).body(Map.of(
                "success", false,
                "message", "Not authenticated"
            ));
        }
        
        logger.info("Session check (/me) successful for user: {}", authentication.getName());

        try {
            User user = null;
            Object principal = authentication.getPrincipal();

            if (principal instanceof OAuth2User) {
                OAuth2User oauth2User = (OAuth2User) principal;
                String email = oauth2User.getAttribute("email");
                String name = oauth2User.getAttribute("name");

                if (email == null) {
                    return ResponseEntity.status(401).body(Map.of("success", false, "message", "Email not provided by Google"));
                }

                // Find or create user from OAuth
                Optional<User> existingUser = userRepository.findByEmail(email);
                if (existingUser.isPresent()) {
                    user = existingUser.get();
                    logger.debug("Found existing OAuth user: {}", email);
                } else {
                    // Auto-register OAuth user as RESEARCHER (or ADMIN if preferred)
                    user = new User(email.split("@")[0] + "_" + UUID.randomUUID().toString().substring(0, 4), email, "OAUTH_USER");
                    user.setRole(User.Role.USER); 
                    user = userRepository.save(user);
                    logger.info("Auto-registered new Google user as RESEARCHER: {}", email);
                }
            } else {
                // Regular session authentication (if string principal or other)
                String username = authentication.getName();
                user = userRepository.findByUsername(username).orElse(null);
            }

            if (user == null) {
                return ResponseEntity.status(401).body(Map.of("success", false, "message", "User not found"));
            }

            user.setLastLogin(LocalDateTime.now());
            userRepository.save(user);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("user", Map.of(
                "id", user.getId().toString(),
                "username", user.getUsername(),
                "email", user.getEmail(),
                "role", user.getRole().name().toLowerCase()
            ));

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.error("Error retrieving current user: {}", e.getMessage());
            return ResponseEntity.status(500).body(Map.of("success", false, "message", "Internal server error"));
        }
    }
}

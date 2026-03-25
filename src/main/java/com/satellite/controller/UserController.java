package com.satellite.controller;

import com.satellite.model.User;
import com.satellite.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

/**
 * REST Controller for user authentication and management.
 * Handles registration, login, logout, and profile retrieval.
 */
@RestController
@RequestMapping("/api/user")
@CrossOrigin(origins = "*")
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
                    newUser.setRole(User.Role.RESEARCHER);
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
}

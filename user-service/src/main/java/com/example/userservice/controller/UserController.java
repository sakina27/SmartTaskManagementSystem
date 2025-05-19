package com.example.userservice.controller;

import com.example.userservice.dto.GoogleTokenRequest;
import com.example.userservice.model.User;
import com.example.userservice.repository.UserRepository;
import com.example.userservice.service.UserService;
import com.example.userservice.util.JwtUtil;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private BCryptPasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    // Manual User Registration
    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody User user) {
        try {
            if (userService.getUserByEmail(user.getEmail()) != null) {
                return ResponseEntity.badRequest().body("User already exists.");
            }
            user.setPassword(passwordEncoder.encode(user.getPassword()));
            userService.createUser(user);

            return ResponseEntity.ok("User registered successfully.");
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error during registration: " + e.getMessage());
        }
    }

    // Manual Email/Password Login
    @PostMapping("/login")
    public ResponseEntity<?> loginUser(@RequestBody Map<String, String> credentials) {
        try {
            String email = credentials.get("email");
            String password = credentials.get("password");

            User user = userService.getUserByEmail(email);
            if (user == null || !passwordEncoder.matches(password, user.getPassword())) {
                return ResponseEntity.status(401).body("Invalid email or password.");
            }

            String token = jwtUtil.generateToken(user.getEmail());

            Map<String, Object> response = new HashMap<>();
            response.put("token", token);

            // Also send user info on login for frontend convenience
            Map<String, Object> userInfo = new HashMap<>();
            userInfo.put("id", user.getId());
            userInfo.put("email", user.getEmail());
            userInfo.put("name", user.getName());
            response.put("user", userInfo);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Login error: " + e.getMessage());
        }
    }

    // Google OAuth Login
    @PostMapping("/google-login")
    public ResponseEntity<?> googleLogin(@RequestBody GoogleTokenRequest request) {
        try {
            String googleToken = request.getToken();

            // Verify the Google token with Google's tokeninfo endpoint
            JsonObject decodedToken = verifyGoogleToken(googleToken);
            String email = decodedToken.get("email").getAsString();
            String name = decodedToken.get("name").getAsString();

            // Check if the user exists, else create
            User user = userService.getUserByEmail(email);
            if (user == null) {
                user = new User();
                user.setName(name);
                user.setEmail(email);
                user.setPassword(passwordEncoder.encode("defaultPassword")); // Consider a better approach later
                user = userService.createUser(user);
            }

            // Generate JWT token
            String token = jwtUtil.generateToken(user.getEmail());

            Map<String, Object> response = new HashMap<>();
            response.put("token", token);

            // Include user details in response for frontend
            Map<String, Object> userInfo = new HashMap<>();
            userInfo.put("id", user.getId());
            userInfo.put("email", user.getEmail());
            userInfo.put("name", user.getName());
            response.put("user", userInfo);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(401).body("Google login failed: " + e.getMessage());
        }
    }

    // Helper method to verify Google token
    private JsonObject verifyGoogleToken(String googleToken) throws Exception {
        String url = "https://oauth2.googleapis.com/tokeninfo?id_token=" + googleToken;
        RestTemplate restTemplate = new RestTemplate();
        String response = restTemplate.getForObject(url, String.class);
        JsonObject jsonResponse = JsonParser.parseString(response).getAsJsonObject();
        if (!jsonResponse.has("email")) {
            throw new Exception("Invalid Google token.");
        }
        return jsonResponse;
    }

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable("id") String id) {
        System.out.println("In UserController:"+id);
        return userRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}

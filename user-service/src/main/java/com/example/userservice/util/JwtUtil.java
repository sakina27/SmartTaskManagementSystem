package com.example.userservice.util;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.Claims;
import javax.crypto.spec.SecretKeySpec;
import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Date;

@Component
public class JwtUtil {

    @Value("${jwt.secret-key}")
    private String secretKey;// Secret key injected from application.properties or environment variable

    private final long expirationTime = 1000 * 60 * 60 * 10;  // 10 hours

    // Generate JWT token for the given username
    private SecretKey getSigningKey() {
        return new SecretKeySpec(secretKey.getBytes(StandardCharsets.UTF_8), SignatureAlgorithm.HS256.getJcaName());
    }

    public String generateToken(String username) {
        return Jwts.builder()
                .setSubject(username)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + expirationTime))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }


    // Extract claims (like username and expiration date) from the token
    public Claims extractClaims(String token) {
        try {
            return Jwts.parserBuilder()
                    .setSigningKey(getSigningKey())
                    .build()
                    .parseClaimsJws(token)
                    .getBody();

        } catch (Exception e) {
            // Log and handle the exception (optional logging)
            return null;
        }
    }

    // Check if the token is expired
    public boolean isTokenExpired(String token) {
        Claims claims = extractClaims(token);
        return claims != null && claims.getExpiration().before(new Date());
    }


    // Extract the username from the token
    public String extractUsername(String token) {
        Claims claims = extractClaims(token);
        return (claims != null) ? claims.getSubject() : null;
    }

    // Validate the token's authenticity (correct username and not expired)
    public boolean validateToken(String token, String username) {
        return (username.equals(extractUsername(token)) && !isTokenExpired(token));
    }
}

package com.example.taskservice.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        System.out.println("Inside addCorsMappings in WebConfig");
        registry.addMapping("/api/**")
                .allowedOrigins("http://localhost:3000", "https://taskmanager.com:30443")
                //.allowedOrigins("https://taskmanager.com:30443")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS")
                .allowedHeaders("*");
    }
}


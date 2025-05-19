package com.example.notificationservice.model;

import lombok.Data;

@Data
public class Task {
    private String id;
    private String title;
    private String description;
    private String status;
    private String dueDate;  // e.g., "2025-05-20"
    private String priority;
    private String userId;
}

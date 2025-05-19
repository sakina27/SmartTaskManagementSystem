package com.example.taskservice.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Date;

@Data
@Document(collection = "tasks")
public class Task {
    @Id
    private String id;
    private String title;
    private String description;
    private String status;
    private String dueDate;
    private String priority;
    private String userId;
    private Date createdAt; // ✅ Add this if not already present
	private Date scheduledAt;     // ✅ When the task is scheduled (from Google Calendar)
    private String googleEventId;
}


package com.example.commentservice.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.util.Date;

@Data
@Document(collection = "comments")
public class Comment {
    @Id
    private String id;
    private String taskId;
    private String content;
    private Date createdAt = new Date();

    @JsonIgnore
    private String userId;
}

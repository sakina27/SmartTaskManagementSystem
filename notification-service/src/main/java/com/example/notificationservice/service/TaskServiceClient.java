package com.example.notificationservice.service;

import com.example.notificationservice.model.Task;
import com.example.notificationservice.model.User;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.List;

@Service
public class TaskServiceClient {

    private final WebClient taskWebClient;
    private final WebClient userWebClient;

    public TaskServiceClient(
            @Value("${task.service.url}") String taskServiceUrl,
            @Value("${user.service.url}") String userServiceUrl

    ) {
        this.taskWebClient = WebClient.builder()
                .baseUrl(taskServiceUrl + "/api")
                .build();

        this.userWebClient = WebClient.builder()
                .baseUrl(userServiceUrl + "/api")
                .build();
    }

    public List<Task> getAllIncompleteTasks() {
        return taskWebClient.get()
                .uri("/tasks/incomplete")
                .retrieve()
                .bodyToFlux(Task.class)
                .collectList()
                .block();
    }

    public User getUserById(String userId) {
        return userWebClient.get()
                .uri("/users/{id}", userId)
                .retrieve()
                .bodyToMono(User.class)
                .block();
    }
}

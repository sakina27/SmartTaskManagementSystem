package com.example.taskservice.service;

import com.example.taskservice.model.Task;

import java.util.List;

public interface TaskService {
    Task createTask(Task task);
    List<Task> getTasksByUserId(String userId);
    Task getTaskById(String taskId);
    Task updateTask(Task task);

}

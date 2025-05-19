package com.example.taskservice.controller;

import com.example.taskservice.model.Task;
import com.example.taskservice.repository.TaskRepository;
import com.example.taskservice.service.GmailService;
import com.example.taskservice.service.TaskService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {

    @Autowired
    private TaskService taskService;

    @Autowired
    private GmailService gmailService;

    @Autowired
    private TaskRepository taskRepository;

    // Create a new task manually
    @PostMapping
    public ResponseEntity<Task> createTask(@RequestBody Task task) {
        Task createdTask = taskService.createTask(task);
        return ResponseEntity.ok(createdTask);
    }

    // Fetch tasks by userId from MongoDB
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Task>> getTasksByUser(@PathVariable String userId) {
        List<Task> tasks = taskService.getTasksByUserId(userId);
        return ResponseEntity.ok(tasks);
    }

    // Fetch tasks from Google Calendar and save them as Task objects in MongoDB
    @GetMapping("/fetch-google-calendar")
    public ResponseEntity<String> fetchFromGoogleCalendar(@RequestParam String accessToken,
                                                          @RequestParam String userId) {
        try {
            gmailService.fetchTasksFromGoogleCalendar(accessToken, userId);
            return ResponseEntity.ok("Fetched tasks from Google Calendar and stored them.");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Failed to fetch tasks from Google Calendar");
        }
    }

    // Update task partially (status or other fields if needed)
    @PatchMapping("/{taskId}")
    public ResponseEntity<Task> updateTaskStatus(@PathVariable String taskId, @RequestBody Task updatedTask) {
        try {
            Task existingTask = taskService.getTaskById(taskId);
            if (existingTask == null) {
                return ResponseEntity.notFound().build();
            }
            // Only update status field for now
            if (updatedTask.getStatus() != null) {
                existingTask.setStatus(updatedTask.getStatus());
            }
            Task savedTask = taskService.updateTask(existingTask);
            return ResponseEntity.ok(savedTask);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).build();
        }
    }



    @GetMapping("/incomplete")
    public List<Task> getIncompleteTasks() {
        // Assuming "COMPLETED" is the status for finished tasks
        return taskRepository.findByStatusNot("Complete");
    }
}

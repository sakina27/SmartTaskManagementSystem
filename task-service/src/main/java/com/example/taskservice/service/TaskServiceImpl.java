package com.example.taskservice.service;

import com.example.taskservice.model.Task;
import com.example.taskservice.repository.TaskRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.data.domain.Sort;

import java.util.Date;
import java.util.List;

@Service
public class TaskServiceImpl implements TaskService {

    @Autowired
    private TaskRepository taskRepository;

    @Override
    public Task createTask(Task task) {
        if (task.getCreatedAt() == null) {
            task.setCreatedAt(new Date()); // ✅ Set creation timestamp if not present
        }
        System.out.println("Saving task: " + task); // Optional: debug log
        return taskRepository.save(task);
    }

    @Override
    public List<Task> getTasksByUserId(String userId) {
        return taskRepository.findByUserId(userId, Sort.by(Sort.Direction.DESC, "createdAt"));
    }

    @Override
    public Task getTaskById(String taskId) {
        return taskRepository.findById(taskId).orElse(null);
    }
    @Override
    public Task updateTask(Task task) {
        return taskRepository.save(task);
    }
}

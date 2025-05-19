package com.example.taskservice.repository;

import com.example.taskservice.model.Task;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.domain.Sort;
import java.util.List;
import java.util.Optional;

public interface TaskRepository extends MongoRepository<Task, String> {
    List<Task> findByUserId(String userId, Sort sort);

    //List<Task> findByStatusIgnoreCase(String status);
    List<Task> findByStatusNot(String status);

    Optional<Task> findByGoogleEventId(String googleEventId);
}

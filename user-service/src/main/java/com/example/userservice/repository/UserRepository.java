package com.example.userservice.repository;

import com.example.userservice.model.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRepository extends MongoRepository<User, String> {
    boolean existsByEmail(String email);  // Custom query to check if email exists

    // Add this method to find user by email
    User findByEmail(String email);  // Custom query to find user by email

}

package com.example.commentservice.service;

import com.example.commentservice.model.Comment;
import com.example.commentservice.repository.CommentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CommentService {

    @Autowired
    private CommentRepository commentRepository;

    public Comment addComment(Comment comment) {
        return commentRepository.save(comment);
    }

    public List<Comment> getCommentsByTaskId(String taskId) {
        return commentRepository.findByTaskId(taskId);
    }

    public void deleteComment(String id) {
        commentRepository.deleteById(id);
    }

    public Comment updateComment(String id, String newContent) {
        Comment comment = commentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Comment not found"));
        comment.setContent(newContent);
        return commentRepository.save(comment);
    }

}

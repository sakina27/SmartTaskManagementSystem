package com.example.notificationservice.service;

import com.example.notificationservice.model.Task;
import com.example.notificationservice.model.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

@Service
public class NotificationService {

    private static final Logger logger = LoggerFactory.getLogger(NotificationService.class);

    @Autowired
    private TaskServiceClient taskServiceClient;

    @Autowired
    private EmailService emailService;

    @Scheduled(cron = "0 0 9 * * ?") // 9 AM every day
    public void sendDailyTaskReminders() {
        sendNotifications();
    }

    public List<String> sendNotifications() {
        List<Task> tasks = taskServiceClient.getAllIncompleteTasks();
        List<String> notifiedUsers = new ArrayList<>();

        for (Task task : tasks) {
            logger.info("Task Info: " + task);
            User user = taskServiceClient.getUserById(task.getUserId());
            logger.info("User Info: " + user);
            if (user == null || user.getEmail() == null) {
                logger.warn("Skipping task [{}] - no valid user/email found.", task.getId());
                continue;
            }

            try {
                DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
                LocalDate dueDate = LocalDate.parse(task.getDueDate(), formatter);
                long daysRemaining = ChronoUnit.DAYS.between(LocalDate.now(), dueDate);
                if (daysRemaining < 0) daysRemaining = 0;

                String subject = "Reminder: Task pending - " + task.getDescription();
                String text = String.format(
                        "Hi %s,\n\nYou have an incomplete task:\n\n" +
                                "Task: %s\nPriority: %s\nDays Remaining: %d\n\nPlease complete it soon.\n\nThanks,\nTask Manager",
                        user.getName(), task.getDescription(), task.getPriority(), daysRemaining
                );

                emailService.sendSimpleMessage(user.getEmail(), subject, text);
                logger.info("Notification sent to {} for task '{}'", user.getEmail(), task.getDescription());
                notifiedUsers.add(user.getEmail());

            } catch (Exception e) {
                logger.error("Failed to send notification to userId={} for taskId={}. Error: {}", task.getUserId(), task.getId(), e.getMessage());
            }
        }

        return notifiedUsers;
    }
}

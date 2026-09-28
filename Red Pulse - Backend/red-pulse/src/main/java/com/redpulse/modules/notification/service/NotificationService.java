package com.redpulse.modules.notification.service;

import com.redpulse.common.exception.ResourceNotFoundException;
import com.redpulse.common.exception.ForbiddenException;
import com.redpulse.enums.NotificationType;
import com.redpulse.modules.notification.dto.NotificationResponse;
import com.redpulse.modules.notification.entity.Notification;
import com.redpulse.modules.notification.repository.NotificationRepository;
import com.redpulse.modules.user.entity.User;
import com.redpulse.modules.user.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public NotificationService(NotificationRepository notificationRepository, UserRepository userRepository) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<NotificationResponse> getUserNotifications(UUID userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(NotificationResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getUnreadNotifications(UUID userId) {
        List<NotificationResponse> unread = notificationRepository.findByUserIdAndReadFalseOrderByCreatedAtDesc(userId)
                .stream()
                .map(NotificationResponse::fromEntity)
                .collect(Collectors.toList());

        Map<String, Object> response = new HashMap<>();
        response.put("unreadCount", unread.size());
        response.put("notifications", unread);
        return response;
    }

    @Transactional
    public NotificationResponse markAsRead(UUID id, UUID userId) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found"));
        if (!notification.getUser().getId().equals(userId)) {
            throw new ForbiddenException("You can only update your own notifications");
        }
        notification.setRead(true);
        return NotificationResponse.fromEntity(notificationRepository.save(notification));
    }

    @Transactional
    public Map<String, String> markAllAsRead(UUID userId) {
        notificationRepository.markAllAsReadByUserId(userId);
        Map<String, String> result = new HashMap<>();
        result.put("message", "All notifications marked as read");
        return result;
    }

    @Transactional
    public void deleteNotification(UUID id) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found"));
        notificationRepository.delete(notification);
    }

    @Transactional
    public void sendNotification(UUID userId, NotificationType type, String title, String message, String refType, UUID refId) {
        userRepository.findById(userId).ifPresent(user -> {
            Notification n = new Notification(user, type, title, message, refType, refId);
            notificationRepository.save(n);
        });
    }
}

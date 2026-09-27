package com.redpulse.modules.notification.dto;

import com.redpulse.enums.NotificationType;
import com.redpulse.modules.notification.entity.Notification;
import java.time.LocalDateTime;
import java.util.UUID;

public class NotificationResponse {

    private UUID id;
    private UUID userId;
    private NotificationType type;
    private String title;
    private String message;
    private boolean read;
    private String referenceType;
    private UUID referenceId;
    private LocalDateTime createdAt;

    public NotificationResponse() {}

    public static NotificationResponse fromEntity(Notification n) {
        NotificationResponse resp = new NotificationResponse();
        resp.id = n.getId();
        resp.userId = n.getUser().getId();
        resp.type = n.getType();
        resp.title = n.getTitle();
        resp.message = n.getMessage();
        resp.read = n.isRead();
        resp.referenceType = n.getReferenceType();
        resp.referenceId = n.getReferenceId();
        resp.createdAt = n.getCreatedAt();
        return resp;
    }

    public UUID getId() { return id; }
    public UUID getUserId() { return userId; }
    public NotificationType getType() { return type; }
    public String getTitle() { return title; }
    public String getMessage() { return message; }
    public boolean isRead() { return read; }
    public String getReferenceType() { return referenceType; }
    public UUID getReferenceId() { return referenceId; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}

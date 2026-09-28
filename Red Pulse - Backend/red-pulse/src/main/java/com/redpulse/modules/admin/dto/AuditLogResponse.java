package com.redpulse.modules.admin.dto;

import com.redpulse.modules.admin.entity.AuditLog;
import java.time.LocalDateTime;
import java.util.UUID;

public class AuditLogResponse {

    private UUID id;
    private String userEmail;
    private String action;
    private String entityType;
    private UUID entityId;
    private String description;
    private String ipAddress;
    private LocalDateTime createdAt;

    public AuditLogResponse() {}

    public static AuditLogResponse fromEntity(AuditLog log) {
        AuditLogResponse resp = new AuditLogResponse();
        resp.id = log.getId();
        resp.userEmail = log.getUser() != null ? log.getUser().getEmail() : "SYSTEM";
        resp.action = log.getAction();
        resp.entityType = log.getEntityType();
        resp.entityId = log.getEntityId();
        resp.description = log.getDescription();
        resp.ipAddress = log.getIpAddress();
        resp.createdAt = log.getCreatedAt();
        return resp;
    }

    public UUID getId() { return id; }
    public String getUserEmail() { return userEmail; }
    public String getAction() { return action; }
    public String getEntityType() { return entityType; }
    public UUID getEntityId() { return entityId; }
    public String getDescription() { return description; }
    public String getIpAddress() { return ipAddress; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}

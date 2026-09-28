package com.redpulse.modules.request.dto;

import com.redpulse.enums.EmergencyStatus;
import com.redpulse.modules.request.entity.EmergencyRequest;
import java.time.LocalDateTime;
import java.util.UUID;

public class EmergencyRequestResponse {

    private UUID id;
    private UUID bloodRequestId;
    private String bloodGroup;
    private int unitsRequired;
    private String emergencyLevel;
    private EmergencyStatus status;
    private String contactName;
    private String contactPhone;
    private String locationDescription;
    private LocalDateTime createdAt;

    public EmergencyRequestResponse() {}

    public static EmergencyRequestResponse fromEntity(EmergencyRequest entity) {
        EmergencyRequestResponse resp = new EmergencyRequestResponse();
        resp.id = entity.getId();
        resp.bloodRequestId = entity.getBloodRequest().getId();
        resp.bloodGroup = entity.getBloodRequest().getBloodGroup().name();
        resp.unitsRequired = entity.getBloodRequest().getUnitsRequired();
        resp.emergencyLevel = entity.getEmergencyLevel();
        resp.status = entity.getStatus();
        resp.contactName = entity.getContactName();
        resp.contactPhone = entity.getContactPhone();
        resp.locationDescription = entity.getLocationDescription();
        resp.createdAt = entity.getCreatedAt();
        return resp;
    }

    public UUID getId() { return id; }
    public UUID getBloodRequestId() { return bloodRequestId; }
    public String getBloodGroup() { return bloodGroup; }
    public int getUnitsRequired() { return unitsRequired; }
    public String getEmergencyLevel() { return emergencyLevel; }
    public EmergencyStatus getStatus() { return status; }
    public String getContactName() { return contactName; }
    public String getContactPhone() { return contactPhone; }
    public String getLocationDescription() { return locationDescription; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}

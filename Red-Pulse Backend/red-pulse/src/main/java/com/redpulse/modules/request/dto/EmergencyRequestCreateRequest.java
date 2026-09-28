package com.redpulse.modules.request.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public class EmergencyRequestCreateRequest {

    @NotNull(message = "Blood request ID is required")
    private UUID bloodRequestId;

    private String emergencyLevel = "CRITICAL";

    @NotBlank(message = "Emergency contact name is required")
    private String contactName;

    @NotBlank(message = "Emergency contact phone is required")
    private String contactPhone;

    private String locationDescription;

    public EmergencyRequestCreateRequest() {}

    public UUID getBloodRequestId() { return bloodRequestId; }
    public void setBloodRequestId(UUID bloodRequestId) { this.bloodRequestId = bloodRequestId; }
    public String getEmergencyLevel() { return emergencyLevel; }
    public void setEmergencyLevel(String emergencyLevel) { this.emergencyLevel = emergencyLevel; }
    public String getContactName() { return contactName; }
    public void setContactName(String contactName) { this.contactName = contactName; }
    public String getContactPhone() { return contactPhone; }
    public void setContactPhone(String contactPhone) { this.contactPhone = contactPhone; }
    public String getLocationDescription() { return locationDescription; }
    public void setLocationDescription(String locationDescription) { this.locationDescription = locationDescription; }
}

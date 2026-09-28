package com.redpulse.modules.request.dto;

import com.redpulse.enums.BloodGroup;
import com.redpulse.enums.BloodRequestStatus;
import com.redpulse.enums.Urgency;
import com.redpulse.modules.request.entity.BloodRequest;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public class BloodRequestResponse {

    private UUID id;
    private UUID requesterId;
    private String requesterName;
    private UUID hospitalId;
    private String hospitalName;
    private BloodGroup bloodGroup;
    private int unitsRequired;
    private Urgency urgency;
    private BloodRequestStatus status;
    private LocalDate requiredBy;
    private String city;
    private String state;
    private String additionalNotes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public BloodRequestResponse() {}

    public static BloodRequestResponse fromEntity(BloodRequest req) {
        BloodRequestResponse resp = new BloodRequestResponse();
        resp.id = req.getId();
        resp.requesterId = req.getRequester().getId();
        resp.requesterName = req.getRequester().getFirstName() + " " + req.getRequester().getLastName();
        if (req.getHospital() != null) {
            resp.hospitalId = req.getHospital().getId();
            resp.hospitalName = req.getHospital().getHospitalName();
        }
        resp.bloodGroup = req.getBloodGroup();
        resp.unitsRequired = req.getUnitsRequired();
        resp.urgency = req.getUrgency();
        resp.status = req.getStatus();
        resp.requiredBy = req.getRequiredBy();
        resp.city = req.getCity();
        resp.state = req.getState();
        resp.additionalNotes = req.getAdditionalNotes();
        resp.createdAt = req.getCreatedAt();
        resp.updatedAt = req.getUpdatedAt();
        return resp;
    }

    public UUID getId() { return id; }
    public UUID getRequesterId() { return requesterId; }
    public String getRequesterName() { return requesterName; }
    public UUID getHospitalId() { return hospitalId; }
    public String getHospitalName() { return hospitalName; }
    public BloodGroup getBloodGroup() { return bloodGroup; }
    public int getUnitsRequired() { return unitsRequired; }
    public Urgency getUrgency() { return urgency; }
    public BloodRequestStatus getStatus() { return status; }
    public LocalDate getRequiredBy() { return requiredBy; }
    public String getCity() { return city; }
    public String getState() { return state; }
    public String getAdditionalNotes() { return additionalNotes; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}

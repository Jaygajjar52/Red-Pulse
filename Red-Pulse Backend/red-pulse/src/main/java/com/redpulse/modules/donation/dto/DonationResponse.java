package com.redpulse.modules.donation.dto;

import com.redpulse.enums.BloodGroup;
import com.redpulse.enums.DonationStatus;
import com.redpulse.modules.donation.entity.Donation;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public class DonationResponse {

    private UUID id;
    private UUID donorId;
    private String donorName;
    private UUID hospitalId;
    private String hospitalName;
    private UUID appointmentId;
    private BloodGroup bloodGroup;
    private LocalDate donationDate;
    private int quantityUnits;
    private DonationStatus status;
    private String notes;
    private LocalDateTime createdAt;

    public DonationResponse() {}

    public static DonationResponse fromEntity(Donation d) {
        DonationResponse resp = new DonationResponse();
        resp.id = d.getId();
        resp.donorId = d.getDonor().getId();
        resp.donorName = d.getDonor().getFirstName() + " " + d.getDonor().getLastName();
        resp.hospitalId = d.getHospital().getId();
        resp.hospitalName = d.getHospital().getHospitalName();
        if (d.getAppointment() != null) {
            resp.appointmentId = d.getAppointment().getId();
        }
        resp.bloodGroup = d.getBloodGroup();
        resp.donationDate = d.getDonationDate();
        resp.quantityUnits = d.getQuantityUnits();
        resp.status = d.getStatus();
        resp.notes = d.getNotes();
        resp.createdAt = d.getCreatedAt();
        return resp;
    }

    public UUID getId() { return id; }
    public UUID getDonorId() { return donorId; }
    public String getDonorName() { return donorName; }
    public UUID getHospitalId() { return hospitalId; }
    public String getHospitalName() { return hospitalName; }
    public UUID getAppointmentId() { return appointmentId; }
    public BloodGroup getBloodGroup() { return bloodGroup; }
    public LocalDate getDonationDate() { return donationDate; }
    public int getQuantityUnits() { return quantityUnits; }
    public DonationStatus getStatus() { return status; }
    public String getNotes() { return notes; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}

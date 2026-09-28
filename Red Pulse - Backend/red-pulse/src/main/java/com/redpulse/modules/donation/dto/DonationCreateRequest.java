package com.redpulse.modules.donation.dto;

import com.redpulse.enums.BloodGroup;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.UUID;

public class DonationCreateRequest {

    @NotNull(message = "Donor ID is required")
    private UUID donorId;

    @NotNull(message = "Hospital ID is required")
    private UUID hospitalId;

    private UUID appointmentId;

    @NotNull(message = "Blood group is required")
    private BloodGroup bloodGroup;

    private LocalDate donationDate;

    @Min(value = 1, message = "At least 1 unit is required")
    private int quantityUnits = 1;

    private String notes;

    public DonationCreateRequest() {}

    public UUID getDonorId() { return donorId; }
    public void setDonorId(UUID donorId) { this.donorId = donorId; }
    public UUID getHospitalId() { return hospitalId; }
    public void setHospitalId(UUID hospitalId) { this.hospitalId = hospitalId; }
    public UUID getAppointmentId() { return appointmentId; }
    public void setAppointmentId(UUID appointmentId) { this.appointmentId = appointmentId; }
    public BloodGroup getBloodGroup() { return bloodGroup; }
    public void setBloodGroup(BloodGroup bloodGroup) { this.bloodGroup = bloodGroup; }
    public LocalDate getDonationDate() { return donationDate; }
    public void setDonationDate(LocalDate donationDate) { this.donationDate = donationDate; }
    public int getQuantityUnits() { return quantityUnits; }
    public void setQuantityUnits(int quantityUnits) { this.quantityUnits = quantityUnits; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}

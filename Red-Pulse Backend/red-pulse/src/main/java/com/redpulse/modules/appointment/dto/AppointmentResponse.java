package com.redpulse.modules.appointment.dto;

import com.redpulse.enums.AppointmentStatus;
import com.redpulse.modules.appointment.entity.Appointment;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.UUID;

public class AppointmentResponse {

    private UUID id;
    private UUID donorId;
    private String donorName;
    private UUID hospitalId;
    private String hospitalName;
    private UUID bloodRequestId;
    private LocalDate appointmentDate;
    private LocalTime appointmentTime;
    private AppointmentStatus status;
    private String notes;
    private LocalDateTime createdAt;
    private LocalDateTime confirmedAt;
    private LocalDateTime completedAt;
    private LocalDateTime cancelledAt;

    public AppointmentResponse() {}

    public static AppointmentResponse fromEntity(Appointment a) {
        AppointmentResponse resp = new AppointmentResponse();
        resp.id = a.getId();
        resp.donorId = a.getDonor().getId();
        resp.donorName = a.getDonor().getFirstName() + " " + a.getDonor().getLastName();
        resp.hospitalId = a.getHospital().getId();
        resp.hospitalName = a.getHospital().getHospitalName();
        if (a.getBloodRequest() != null) {
            resp.bloodRequestId = a.getBloodRequest().getId();
        }
        resp.appointmentDate = a.getAppointmentDate();
        resp.appointmentTime = a.getAppointmentTime();
        resp.status = a.getStatus();
        resp.notes = a.getNotes();
        resp.createdAt = a.getCreatedAt();
        resp.confirmedAt = a.getConfirmedAt();
        resp.completedAt = a.getCompletedAt();
        resp.cancelledAt = a.getCancelledAt();
        return resp;
    }

    public UUID getId() { return id; }
    public UUID getDonorId() { return donorId; }
    public String getDonorName() { return donorName; }
    public UUID getHospitalId() { return hospitalId; }
    public String getHospitalName() { return hospitalName; }
    public UUID getBloodRequestId() { return bloodRequestId; }
    public LocalDate getAppointmentDate() { return appointmentDate; }
    public LocalTime getAppointmentTime() { return appointmentTime; }
    public AppointmentStatus getStatus() { return status; }
    public String getNotes() { return notes; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getConfirmedAt() { return confirmedAt; }
    public LocalDateTime getCompletedAt() { return completedAt; }
    public LocalDateTime getCancelledAt() { return cancelledAt; }
}

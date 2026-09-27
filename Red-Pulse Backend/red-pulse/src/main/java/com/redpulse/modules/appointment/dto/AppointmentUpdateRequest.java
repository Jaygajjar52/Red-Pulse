package com.redpulse.modules.appointment.dto;

import java.time.LocalDate;
import java.time.LocalTime;

public class AppointmentUpdateRequest {

    private LocalDate appointmentDate;
    private LocalTime appointmentTime;
    private String notes;

    public AppointmentUpdateRequest() {}

    public LocalDate getAppointmentDate() { return appointmentDate; }
    public void setAppointmentDate(LocalDate appointmentDate) { this.appointmentDate = appointmentDate; }
    public LocalTime getAppointmentTime() { return appointmentTime; }
    public void setAppointmentTime(LocalTime appointmentTime) { this.appointmentTime = appointmentTime; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}

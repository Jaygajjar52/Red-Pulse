package com.redpulse.modules.appointment.controller;

import com.redpulse.common.security.UserPrincipal;
import com.redpulse.modules.appointment.dto.AppointmentCreateRequest;
import com.redpulse.modules.appointment.dto.AppointmentResponse;
import com.redpulse.modules.appointment.service.AppointmentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api")
public class AppointmentController {

    private final AppointmentService appointmentService;

    public AppointmentController(AppointmentService appointmentService) {
        this.appointmentService = appointmentService;
    }

    @PostMapping("/appointments")
    public ResponseEntity<AppointmentResponse> createAppointment(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @RequestBody AppointmentCreateRequest request
    ) {
        AppointmentResponse response = appointmentService.createAppointment(currentUser.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/appointments")
    public ResponseEntity<List<AppointmentResponse>> getAllAppointments() {
        List<AppointmentResponse> response = appointmentService.getAllAppointments();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/appointments/{id}")
    public ResponseEntity<AppointmentResponse> getAppointmentById(@PathVariable UUID id) {
        AppointmentResponse response = appointmentService.getAppointmentById(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/donors/{donorId}/appointments")
    public ResponseEntity<List<AppointmentResponse>> getDonorAppointments(@PathVariable UUID donorId) {
        List<AppointmentResponse> response = appointmentService.getAppointmentsByDonor(donorId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/hospitals/{hospitalId}/appointments")
    public ResponseEntity<List<AppointmentResponse>> getHospitalAppointments(@PathVariable UUID hospitalId) {
        List<AppointmentResponse> response = appointmentService.getAppointmentsByHospital(hospitalId);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/appointments/{id}/confirm")
    public ResponseEntity<AppointmentResponse> confirmAppointment(@PathVariable UUID id,
                                                                   @AuthenticationPrincipal UserPrincipal currentUser) {
        AppointmentResponse response = appointmentService.confirmAppointment(id, currentUser.getId());
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/appointments/{id}/complete")
    public ResponseEntity<AppointmentResponse> completeAppointment(@PathVariable UUID id) {
        AppointmentResponse response = appointmentService.completeAppointment(id);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/appointments/{id}/cancel")
    public ResponseEntity<AppointmentResponse> cancelAppointment(@PathVariable UUID id,
                                                                  @AuthenticationPrincipal UserPrincipal currentUser) {
        AppointmentResponse response = appointmentService.cancelAppointment(id, currentUser.getId());
        return ResponseEntity.ok(response);
    }
}

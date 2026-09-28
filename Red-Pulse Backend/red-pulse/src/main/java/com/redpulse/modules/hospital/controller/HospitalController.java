package com.redpulse.modules.hospital.controller;

import com.redpulse.common.security.UserPrincipal;
import com.redpulse.modules.hospital.dto.HospitalRequest;
import com.redpulse.modules.hospital.dto.HospitalResponse;
import com.redpulse.modules.hospital.service.HospitalService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import com.redpulse.modules.request.dto.BloodRequestResponse;
import com.redpulse.modules.request.service.BloodRequestService;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/hospitals")
public class HospitalController {

    private final HospitalService hospitalService;
    private final BloodRequestService bloodRequestService;

    public HospitalController(HospitalService hospitalService, BloodRequestService bloodRequestService) {
        this.hospitalService = hospitalService;
        this.bloodRequestService = bloodRequestService;
    }

    @GetMapping
    public ResponseEntity<List<HospitalResponse>> getAllHospitals(
            @RequestParam(required = false) String city
    ) {
        List<HospitalResponse> response = hospitalService.getAllHospitals(city);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<HospitalResponse> getHospitalById(@PathVariable UUID id) {
        HospitalResponse response = hospitalService.getHospitalById(id);
        return ResponseEntity.ok(response);
    }

    @PostMapping
    public ResponseEntity<HospitalResponse> createHospital(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @RequestBody HospitalRequest request
    ) {
        HospitalResponse response = hospitalService.createHospital(currentUser.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<HospitalResponse> updateHospital(
            @PathVariable UUID id,
            @Valid @RequestBody HospitalRequest request
    ) {
        HospitalResponse response = hospitalService.updateHospital(id, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteHospital(@PathVariable UUID id) {
        hospitalService.deleteHospital(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me")
    public ResponseEntity<HospitalResponse> getMyHospital(
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        HospitalResponse response = hospitalService.getHospitalByUserId(currentUser.getId());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}/blood-requests")
    public ResponseEntity<List<BloodRequestResponse>> getHospitalBloodRequests(@PathVariable UUID id) {
        List<BloodRequestResponse> response = bloodRequestService.getRequestsByHospital(id);
        return ResponseEntity.ok(response);
    }
}

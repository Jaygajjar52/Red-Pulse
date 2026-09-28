package com.redpulse.modules.request.controller;

import com.redpulse.common.security.UserPrincipal;
import com.redpulse.enums.BloodGroup;
import com.redpulse.enums.BloodRequestStatus;
import com.redpulse.modules.request.dto.BloodRequestCreateRequest;
import com.redpulse.modules.request.dto.BloodRequestResponse;
import com.redpulse.modules.request.service.BloodRequestService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/blood-requests")
public class BloodRequestController {

    private final BloodRequestService bloodRequestService;

    public BloodRequestController(BloodRequestService bloodRequestService) {
        this.bloodRequestService = bloodRequestService;
    }

    @PostMapping
    public ResponseEntity<BloodRequestResponse> createRequest(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @RequestBody BloodRequestCreateRequest request
    ) {
        BloodRequestResponse response = bloodRequestService.createRequest(currentUser.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<BloodRequestResponse>> getAllRequests(
            @RequestParam(required = false) String city,
            @RequestParam(required = false) BloodGroup bloodGroup,
            @RequestParam(required = false) BloodRequestStatus status
    ) {
        List<BloodRequestResponse> response = bloodRequestService.getAllRequests(city, bloodGroup, status);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/my")
    public ResponseEntity<List<BloodRequestResponse>> getMyRequests(
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        List<BloodRequestResponse> response = bloodRequestService.getMyRequests(currentUser.getId());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/emergency")
    public ResponseEntity<List<BloodRequestResponse>> getEmergencyRequests() {
        List<BloodRequestResponse> response = bloodRequestService.getEmergencyRequests();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<BloodRequestResponse> getRequestById(@PathVariable UUID id) {
        BloodRequestResponse response = bloodRequestService.getRequestById(id);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<BloodRequestResponse> updateRequest(
            @PathVariable UUID id,
            @Valid @RequestBody BloodRequestCreateRequest request
    ) {
        BloodRequestResponse response = bloodRequestService.updateRequest(id, request);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/cancel")
    public ResponseEntity<BloodRequestResponse> cancelRequest(@PathVariable UUID id) {
        BloodRequestResponse response = bloodRequestService.cancelRequest(id);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/fulfill")
    public ResponseEntity<BloodRequestResponse> fulfillRequest(@PathVariable UUID id) {
        BloodRequestResponse response = bloodRequestService.fulfillRequest(id);
        return ResponseEntity.ok(response);
    }
}

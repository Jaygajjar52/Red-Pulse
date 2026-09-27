package com.redpulse.modules.request.controller;

import com.redpulse.modules.request.dto.EmergencyRequestCreateRequest;
import com.redpulse.modules.request.dto.EmergencyRequestResponse;
import com.redpulse.modules.request.service.EmergencyRequestService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/emergency-requests")
public class EmergencyRequestController {

    private final EmergencyRequestService emergencyService;

    public EmergencyRequestController(EmergencyRequestService emergencyService) {
        this.emergencyService = emergencyService;
    }

    @PostMapping
    public ResponseEntity<EmergencyRequestResponse> createEmergency(
            @Valid @RequestBody EmergencyRequestCreateRequest request
    ) {
        EmergencyRequestResponse response = emergencyService.createEmergency(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<EmergencyRequestResponse>> listEmergencies() {
        List<EmergencyRequestResponse> response = emergencyService.listEmergencies();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<EmergencyRequestResponse> getEmergencyById(@PathVariable UUID id) {
        EmergencyRequestResponse response = emergencyService.getEmergencyById(id);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/alert-donors")
    public ResponseEntity<Map<String, Object>> alertDonors(@PathVariable UUID id) {
        Map<String, Object> response = emergencyService.alertDonors(id);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/resolve")
    public ResponseEntity<EmergencyRequestResponse> resolveEmergency(@PathVariable UUID id) {
        EmergencyRequestResponse response = emergencyService.resolveEmergency(id);
        return ResponseEntity.ok(response);
    }
}

package com.redpulse.modules.matching.controller;

import com.redpulse.modules.hospital.dto.HospitalResponse;
import com.redpulse.modules.matching.dto.DonorMatchResponse;
import com.redpulse.modules.matching.dto.LocationUpdateRequest;
import com.redpulse.modules.matching.service.MatchingService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api")
public class MatchingController {

    private final MatchingService matchingService;

    public MatchingController(MatchingService matchingService) {
        this.matchingService = matchingService;
    }

    @GetMapping("/blood-requests/{requestId}/matches")
    public ResponseEntity<List<DonorMatchResponse>> getRankedMatches(
            @PathVariable UUID requestId,
            @RequestParam(required = false, defaultValue = "50") Double radius
    ) {
        List<DonorMatchResponse> response = matchingService.getRankedMatches(requestId, radius);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/blood-requests/{requestId}/matches/nearby")
    public ResponseEntity<List<DonorMatchResponse>> getNearbyMatches(
            @PathVariable UUID requestId,
            @RequestParam(required = false, defaultValue = "15") Double radius
    ) {
        List<DonorMatchResponse> response = matchingService.getRankedMatches(requestId, radius);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/blood-requests/{requestId}/match")
    public ResponseEntity<List<DonorMatchResponse>> startMatching(
            @PathVariable UUID requestId,
            @RequestParam(required = false, defaultValue = "30") Double radius
    ) {
        List<DonorMatchResponse> response = matchingService.getRankedMatches(requestId, radius);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/blood-requests/{requestId}/match/{donorId}/notify")
    public ResponseEntity<Map<String, Object>> notifyDonor(
            @PathVariable UUID requestId,
            @PathVariable UUID donorId
    ) {
        Map<String, Object> response = matchingService.notifyDonor(requestId, donorId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/donors/{donorId}/match-score/{requestId}")
    public ResponseEntity<Map<String, Object>> getMatchScore(
            @PathVariable UUID donorId,
            @PathVariable UUID requestId
    ) {
        Map<String, Object> response = matchingService.getMatchScoreBreakdown(donorId, requestId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/donors/{donorId}/location")
    public ResponseEntity<Map<String, Double>> getDonorLocation(@PathVariable UUID donorId) {
        Map<String, Double> response = matchingService.getDonorLocation(donorId);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/donors/{donorId}/location")
    public ResponseEntity<Map<String, Double>> updateDonorLocation(
            @PathVariable UUID donorId,
            @Valid @RequestBody LocationUpdateRequest request
    ) {
        Map<String, Double> response = matchingService.updateDonorLocation(donorId, request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/donors/nearby")
    public ResponseEntity<List<DonorMatchResponse>> findNearbyDonors(
            @RequestParam Double latitude,
            @RequestParam Double longitude,
            @RequestParam(required = false, defaultValue = "15") Double radius
    ) {
        List<DonorMatchResponse> response = matchingService.findNearbyDonors(latitude, longitude, radius);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/hospitals/nearby")
    public ResponseEntity<List<HospitalResponse>> findNearbyHospitals(
            @RequestParam Double latitude,
            @RequestParam Double longitude,
            @RequestParam(required = false, defaultValue = "20") Double radius
    ) {
        List<HospitalResponse> response = matchingService.findNearbyHospitals(latitude, longitude, radius);
        return ResponseEntity.ok(response);
    }
}

package com.redpulse.modules.donation.controller;

import com.redpulse.modules.donation.dto.DonationCreateRequest;
import com.redpulse.modules.donation.dto.DonationResponse;
import com.redpulse.modules.donation.service.DonationService;
import com.redpulse.common.security.UserPrincipal;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/donations")
public class DonationController {

    private final DonationService donationService;

    public DonationController(DonationService donationService) {
        this.donationService = donationService;
    }

    @PostMapping
    public ResponseEntity<DonationResponse> createDonation(@Valid @RequestBody DonationCreateRequest request) {
        DonationResponse response = donationService.createDonation(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<DonationResponse>> getAllDonations() {
        List<DonationResponse> response = donationService.getAllDonations();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<DonationResponse> getDonationById(@PathVariable UUID id) {
        DonationResponse response = donationService.getDonationById(id);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/complete")
    public ResponseEntity<DonationResponse> completeDonation(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        DonationResponse response = donationService.verifyDonation(id, currentUser.getId());
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/cancel")
    public ResponseEntity<DonationResponse> cancelDonation(@PathVariable UUID id) {
        DonationResponse response = donationService.cancelDonation(id);
        return ResponseEntity.ok(response);
    }
}

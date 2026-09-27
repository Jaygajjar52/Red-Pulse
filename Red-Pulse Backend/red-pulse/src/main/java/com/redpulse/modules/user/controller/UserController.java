  package com.redpulse.modules.user.controller;

import com.redpulse.common.security.UserPrincipal;
import com.redpulse.modules.user.dto.AvailabilityUpdateRequest;
import com.redpulse.modules.user.dto.DonorEligibilityResponse;
import com.redpulse.modules.user.dto.DonorProfileRequest;
import com.redpulse.modules.user.dto.DonorProfileResponse;
import com.redpulse.modules.user.dto.UpdateUserRequest;
import com.redpulse.modules.user.dto.UserResponse;
import java.util.UUID;
import com.redpulse.modules.user.service.UserProfileService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserProfileService userProfileService;

    public UserController(UserProfileService userProfileService) {
        this.userProfileService = userProfileService;
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponse> getCurrentUser(
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {

        UserResponse response =
                userProfileService.getCurrentUserProfile(
                        currentUser.getId()
                );

        return ResponseEntity.ok(response);
    }

    @PutMapping("/me")
    public ResponseEntity<UserResponse> updateCurrentUser(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @RequestBody UpdateUserRequest request
    ) {

        UserResponse response =
                userProfileService.updateUserProfile(
                        currentUser.getId(),
                        request
                );

        return ResponseEntity.ok(response);
    }

    @PostMapping("/donor-profile")
    public ResponseEntity<DonorProfileResponse> createOrUpdateDonorProfile(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @RequestBody DonorProfileRequest request
    ) {

        DonorProfileResponse response =
                userProfileService.createOrUpdateDonorProfile(
                        currentUser.getId(),
                        request
                );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    @GetMapping("/donor-profile")
    public ResponseEntity<DonorProfileResponse> getDonorProfile(
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {

        DonorProfileResponse response =
                userProfileService.getDonorProfile(
                        currentUser.getId()
                );

        return ResponseEntity.ok(response);
    }

    @PatchMapping("/donor-profile/availability")
    public ResponseEntity<DonorProfileResponse> updateAvailability(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @RequestBody AvailabilityUpdateRequest request
    ) {

        DonorProfileResponse response =
                userProfileService.updateAvailability(
                        currentUser.getId(),
                        request
                );

        return ResponseEntity.ok(response);
    }

    @GetMapping("/donor-profile/eligibility")
    public ResponseEntity<DonorEligibilityResponse> checkEligibility(
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {

        DonorEligibilityResponse response =
                userProfileService.checkEligibility(
                        currentUser.getId()
                );

        return ResponseEntity.ok(response);
    }

    @GetMapping("/donors/{id}")
    public ResponseEntity<DonorProfileResponse> getDonorById(@PathVariable UUID id) {
        DonorProfileResponse response = userProfileService.getDonorById(id);
        return ResponseEntity.ok(response);
    }

}

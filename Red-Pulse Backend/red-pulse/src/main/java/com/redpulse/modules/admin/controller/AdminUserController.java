package com.redpulse.modules.admin.controller;

import com.redpulse.modules.admin.service.AdminService;
import com.redpulse.modules.hospital.dto.HospitalResponse;
import com.redpulse.modules.user.dto.DonorProfileResponse;
import com.redpulse.modules.user.dto.UserResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {

    private final AdminService adminService;

    public AdminUserController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/users")
    public ResponseEntity<List<UserResponse>> getAllUsers(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String status
    ) {
        return ResponseEntity.ok(adminService.getAllUsers(search, role, status));
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<UserResponse> getUserById(@PathVariable UUID id) {
        return ResponseEntity.ok(adminService.getUserById(id));
    }

    @PatchMapping("/users/{id}/block")
    public ResponseEntity<UserResponse> blockUser(@PathVariable UUID id) {
        return ResponseEntity.ok(adminService.blockUser(id));
    }

    @PatchMapping("/users/{id}/unblock")
    public ResponseEntity<UserResponse> unblockUser(@PathVariable UUID id) {
        return ResponseEntity.ok(adminService.unblockUser(id));
    }

    @GetMapping("/donors")
    public ResponseEntity<List<DonorProfileResponse>> getAllDonors() {
        return ResponseEntity.ok(adminService.getAllDonors());
    }

    @PatchMapping("/donors/{id}/verify")
    public ResponseEntity<DonorProfileResponse> verifyDonor(@PathVariable UUID id) {
        return ResponseEntity.ok(adminService.verifyDonor(id));
    }

    @GetMapping("/hospitals")
    public ResponseEntity<List<HospitalResponse>> getManageHospitals() {
        return ResponseEntity.ok(adminService.getManageHospitals());
    }
}

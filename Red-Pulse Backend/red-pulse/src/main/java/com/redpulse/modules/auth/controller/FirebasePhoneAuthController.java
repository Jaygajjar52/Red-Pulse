package com.redpulse.modules.auth.controller;

import com.redpulse.modules.auth.dto.AuthResponse;
import com.redpulse.modules.auth.dto.FirebasePhoneAuthRequest;
import com.redpulse.modules.auth.service.FirebasePhoneAuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth/firebase")
public class FirebasePhoneAuthController {

    private final FirebasePhoneAuthService firebasePhoneAuthService;

    public FirebasePhoneAuthController(FirebasePhoneAuthService firebasePhoneAuthService) {
        this.firebasePhoneAuthService = firebasePhoneAuthService;
    }

    @PostMapping("/phone")
    public ResponseEntity<AuthResponse> authenticatePhone(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @Valid @RequestBody(required = false) FirebasePhoneAuthRequest request
    ) {
        FirebasePhoneAuthRequest safeRequest = request == null ? new FirebasePhoneAuthRequest() : request;
        return ResponseEntity.ok(firebasePhoneAuthService.authenticate(authorization, safeRequest));
    }
}

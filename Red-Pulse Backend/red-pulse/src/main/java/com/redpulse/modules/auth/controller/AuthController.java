package com.redpulse.modules.auth.controller;

import com.redpulse.common.security.UserPrincipal;
import com.redpulse.modules.auth.dto.AuthResponse;
import com.redpulse.modules.auth.dto.ForgotPasswordRequest;
import com.redpulse.modules.auth.dto.LoginRequest;
import com.redpulse.modules.auth.dto.RefreshTokenRequest;
import com.redpulse.modules.auth.dto.RegisterRequest;
import com.redpulse.modules.auth.dto.ResetPasswordRequest;
import com.redpulse.modules.auth.service.AuthService;

import com.redpulse.modules.user.dto.UserResponse;
import com.redpulse.modules.user.service.UserProfileService;
import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final UserProfileService userProfileService;

    public AuthController(
            AuthService authService,
            UserProfileService userProfileService
    ) {
        this.authService = authService;
        this.userProfileService = userProfileService;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(
            @Valid @RequestBody RegisterRequest request
    ) {

        AuthResponse response =
                authService.register(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(
            @Valid @RequestBody LoginRequest request
    ) {

        AuthResponse response =
                authService.login(request);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refreshToken(
            @Valid @RequestBody RefreshTokenRequest request
    ) {

        AuthResponse response =
                authService.refreshToken(request);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<String> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request
    ) {

        authService.forgotPassword(request);

        return ResponseEntity.ok("If an account exists, password reset instructions will be sent.");
    }

    @PostMapping("/reset-password")
    public ResponseEntity<String> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request
    ) {

        authService.resetPassword(request);

        return ResponseEntity.ok(
                "Password reset successfully"
        );
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponse> getCurrentUser(
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {

        UserResponse user =
                userProfileService.getCurrentUserProfile(currentUser.getId());

        return ResponseEntity.ok(user);
    }
}

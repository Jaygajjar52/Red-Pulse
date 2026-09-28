package com.redpulse.modules.request.controller;

import com.redpulse.common.security.JwtUtils;
import com.redpulse.common.security.UserPrincipal;
import com.redpulse.common.phone.IndianPhoneNumber;
import com.redpulse.enums.Role;
import com.redpulse.enums.Urgency;
import com.redpulse.enums.UserStatus;
import com.redpulse.modules.auth.dto.AuthResponse;
import com.redpulse.modules.hospital.entity.Hospital;
import com.redpulse.modules.hospital.repository.HospitalRepository;
import com.redpulse.modules.request.dto.*;
import com.redpulse.modules.request.entity.EmergencyRequest;
import com.redpulse.modules.request.repository.BloodRequestRepository;
import com.redpulse.modules.request.repository.EmergencyRequestRepository;
import com.redpulse.modules.request.service.EmergencyEmailOtpService;
import com.redpulse.modules.user.dto.UserResponse;
import com.redpulse.modules.user.entity.User;
import com.redpulse.modules.user.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/api/emergency")
public class EmergencyOtpController {
    private final UserRepository userRepository;
    private final BloodRequestRepository bloodRequestRepository;
    private final EmergencyRequestRepository emergencyRepository;
    private final HospitalRepository hospitalRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;
    private final long accessTokenExpiration;
    private final EmergencyEmailOtpService emailOtpService;

    public EmergencyOtpController(UserRepository userRepository,
                                  BloodRequestRepository bloodRequestRepository,
                                  EmergencyRequestRepository emergencyRepository,
                                  HospitalRepository hospitalRepository,
                                  PasswordEncoder passwordEncoder,
                                  JwtUtils jwtUtils,
                                  @Value("${jwt.access-token-expiration}") long accessTokenExpiration,
                                  EmergencyEmailOtpService emailOtpService) {
        this.userRepository = userRepository;
        this.bloodRequestRepository = bloodRequestRepository;
        this.emergencyRepository = emergencyRepository;
        this.hospitalRepository = hospitalRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtils = jwtUtils;
        this.accessTokenExpiration = accessTokenExpiration;
        this.emailOtpService = emailOtpService;
    }

    @PostMapping("/otp/request")
    public ResponseEntity<Map<String, Object>> requestOtp(
            @Valid @RequestBody EmergencyEmailOtpRequest request, HttpServletRequest httpRequest) {
        return ResponseEntity.ok(emailOtpService.request(request, httpRequest.getRemoteAddr(),
                httpRequest.getHeader("User-Agent")));
    }

    @PostMapping("/otp/verify")
    public ResponseEntity<Map<String, Object>> verifyOtp(
            @Valid @RequestBody EmergencyEmailOtpVerifyRequest request) {
        return ResponseEntity.ok(emailOtpService.verify(request));
    }

    @PostMapping("/verify-and-dispatch")
    @Transactional
    public ResponseEntity<Map<String, Object>> verifyAndDispatch(
            @Valid @RequestBody EmergencyOtpDispatchPayload payload) {
        String cleanPhone = IndianPhoneNumber.normalize(payload.getPhone());
        emailOtpService.consumeVerification(payload.getVerificationId(), payload.getEmail(), cleanPhone);

        User requester = userRepository.findByPhone(cleanPhone).orElseGet(() -> createRequester(payload, cleanPhone));
        Hospital hospital = payload.getHospitalId() == null ? null :
                hospitalRepository.findById(payload.getHospitalId()).orElse(null);
        String city = "Ahmedabad";
        String state = "Gujarat";
        if (payload.getApproximateLocation() != null && !payload.getApproximateLocation().isBlank()) {
            String[] parts = payload.getApproximateLocation().split(",");
            if (parts.length > 0 && !parts[0].isBlank()) city = parts[0].trim();
            if (parts.length > 1 && !parts[1].isBlank()) state = parts[1].trim();
        }

        com.redpulse.modules.request.entity.BloodRequest bloodRequest =
                new com.redpulse.modules.request.entity.BloodRequest(
                        requester, hospital, payload.getBloodGroup(), payload.getUnitsRequired(),
                        Urgency.CRITICAL, LocalDate.now(), city, state,
                        payload.getDescription() == null ? "Urgent Blood SOS Dispatch" : payload.getDescription());
        var savedBloodRequest = bloodRequestRepository.save(bloodRequest);
        EmergencyRequest emergency = new EmergencyRequest(savedBloodRequest, "CRITICAL",
                payload.getName(), cleanPhone,
                payload.getApproximateLocation() == null ? city : payload.getApproximateLocation());
        emergency.setStatus(com.redpulse.enums.EmergencyStatus.ALERT_SENT);
        EmergencyRequest savedEmergency = emergencyRepository.save(emergency);

        UserPrincipal principal = UserPrincipal.fromUser(requester);
        AuthResponse authResponse = new AuthResponse(jwtUtils.generateAccessToken(principal),
                jwtUtils.generateRefreshToken(principal), "Bearer", accessTokenExpiration / 1000);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Emergency SOS triggered! Broadcast sent to matching local donors.");
        response.put("auth", authResponse);
        response.put("user", UserResponse.fromEntity(requester));
        response.put("emergency", EmergencyRequestResponse.fromEntity(savedEmergency));
        response.put("bloodRequestId", savedBloodRequest.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    private User createRequester(EmergencyOtpDispatchPayload payload, String phone) {
        String suppliedName = payload.getName() == null ? "Emergency Requester" : payload.getName().trim();
        String[] names = suppliedName.split("\\s+", 2);
        String email = payload.getEmail().trim().toLowerCase(Locale.ROOT);
        return userRepository.findByEmail(email).orElseGet(() -> {
            User user = new User(names[0], names.length > 1 ? names[1] : "Requester",
                    email, passwordEncoder.encode(UUID.randomUUID().toString()), phone,
                    Role.REQUESTER, UserStatus.ACTIVE);
            user.setActive(true);
            user.setVerified(true);
            return userRepository.save(user);
        });
    }
}

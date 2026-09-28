 package com.redpulse.modules.auth.service;

import com.redpulse.common.exception.BadRequestException;
import com.redpulse.common.exception.ConflictException;
import com.redpulse.common.exception.ResourceNotFoundException;
import com.redpulse.common.exception.UnauthorizedException;
import com.redpulse.common.security.JwtUtils;
import com.redpulse.common.phone.IndianPhoneNumber;
import com.redpulse.common.notification.EmailService;
import com.redpulse.common.security.UserPrincipal;
import com.redpulse.enums.Role;
import com.redpulse.enums.UserStatus;
import com.redpulse.modules.auth.dto.AuthResponse;
import com.redpulse.modules.auth.dto.ForgotPasswordRequest;
import com.redpulse.modules.auth.dto.LoginRequest;
import com.redpulse.modules.auth.dto.RefreshTokenRequest;
import com.redpulse.modules.auth.dto.RegisterRequest;
import com.redpulse.modules.auth.dto.ResetPasswordRequest;
import com.redpulse.modules.user.entity.User;
import com.redpulse.modules.user.repository.UserRepository;

import com.redpulse.enums.AvailabilityStatus;
import com.redpulse.enums.BloodGroup;
import com.redpulse.modules.hospital.entity.Hospital;
import com.redpulse.modules.hospital.repository.HospitalRepository;
import com.redpulse.modules.user.entity.DonorProfile;
import com.redpulse.modules.user.repository.DonorProfileRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.Duration;
import java.time.Period;
import java.util.Map;
import java.util.UUID;
import java.security.SecureRandom;
import java.security.MessageDigest;
import java.util.Base64;
import java.util.concurrent.ConcurrentHashMap;

@Service
@Transactional
public class AuthService {

    private final UserRepository userRepository;
    private final HospitalRepository hospitalRepository;
    private final DonorProfileRepository donorProfileRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtils jwtUtils;
    private final EmailService emailService;

    private final long accessTokenExpiration;

    private final Map<String, PasswordResetEntry> passwordResetTokens =
            new ConcurrentHashMap<>();

    public AuthService(
            UserRepository userRepository,
            HospitalRepository hospitalRepository,
            DonorProfileRepository donorProfileRepository,
            PasswordEncoder passwordEncoder,
            AuthenticationManager authenticationManager,
            JwtUtils jwtUtils,
            long accessTokenExpiration
    ) {
        this(userRepository, hospitalRepository, donorProfileRepository, passwordEncoder,
                authenticationManager, jwtUtils, (email, token) -> {}, accessTokenExpiration);
    }

    @Autowired
    public AuthService(
            UserRepository userRepository,
            HospitalRepository hospitalRepository,
            DonorProfileRepository donorProfileRepository,
            PasswordEncoder passwordEncoder,
            AuthenticationManager authenticationManager,
            JwtUtils jwtUtils,
            EmailService emailService,
            @Value("${jwt.access-token-expiration}") long accessTokenExpiration
    ) {
        this.userRepository = userRepository;
        this.hospitalRepository = hospitalRepository;
        this.donorProfileRepository = donorProfileRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtUtils = jwtUtils;
        this.emailService = emailService;
        this.accessTokenExpiration = accessTokenExpiration;
    }

    public AuthResponse register(RegisterRequest request) {

        String email = normalizeEmail(request.getEmail());

        if (userRepository.existsByEmail(email)) {
            throw new ConflictException(
                    "An account with this email already exists"
            );
        }

        Role role = request.getRole() == null ? Role.DONOR : request.getRole();
        if (role == Role.ADMIN) {
            throw new BadRequestException("ADMIN registration is not available through the public endpoint");
        }
        validateRegistration(request, role);

        User user = new User(
                request.getFirstName().trim(),
                request.getLastName().trim(),
                email,
                passwordEncoder.encode(request.getPassword()),
                normalizePhone(request.getPhone()),
                role,
                UserStatus.ACTIVE
        );

        user.setActive(true);
        user.setVerified(role != Role.HOSPITAL);

        User savedUser = userRepository.save(user);

        if (role == Role.HOSPITAL) {
            String hospName = request.getHospitalName().trim();
            String regNum = request.getRegistrationNumber().trim();
            String address = request.getHospitalAddress().trim();
            String city = request.getHospitalCity().trim();
            String state = request.getHospitalState().trim();

            Hospital hospital = new Hospital(
                    hospName,
                    regNum,
                    normalizePhone(request.getPhone()),
                    email,
                    address,
                    city,
                    state,
                    null,
                    null,
                    savedUser
            );
            hospitalRepository.save(hospital);
        } else if (role == Role.DONOR) {
            DonorProfile profile = new DonorProfile(savedUser);
            try {
                profile.setBloodGroup(BloodGroup.valueOf(request.getBloodGroup().trim().toUpperCase()));
                LocalDate dateOfBirth = LocalDate.parse(request.getDateOfBirth().trim());
                if (Period.between(dateOfBirth, LocalDate.now()).getYears() < 18) {
                    throw new BadRequestException("Donors must be at least 18 years old");
                }
                profile.setDateOfBirth(dateOfBirth);
            } catch (java.time.format.DateTimeParseException | IllegalArgumentException exception) {
                throw new BadRequestException("Blood group or date of birth is invalid");
            }
            if (!java.util.Set.of("MALE", "FEMALE", "OTHER").contains(request.getGender().trim().toUpperCase())) {
                throw new BadRequestException("Gender is invalid");
            }
            if (request.getWeight().compareTo(new java.math.BigDecimal("45")) < 0
                    || request.getWeight().compareTo(new java.math.BigDecimal("250")) > 0) {
                throw new BadRequestException("Weight must be between 45 and 250 kg");
            }
            profile.setGender(request.getGender().trim());
            profile.setWeight(request.getWeight());
            profile.setCity(request.getCity().trim());
            profile.setState(request.getState().trim());
            profile.setAvailabilityStatus(AvailabilityStatus.AVAILABLE);
            donorProfileRepository.save(profile);
        }

        UserPrincipal principal =
                UserPrincipal.fromUser(savedUser);

        return createAuthResponse(principal);
    }

    public AuthResponse login(LoginRequest request) {

        String email = normalizeEmail(request.getEmail());

        try {

            Authentication authentication =
                    authenticationManager.authenticate(
                            new UsernamePasswordAuthenticationToken(
                                    email,
                                    request.getPassword()
                            )
                    );

            UserPrincipal principal =
                    (UserPrincipal) authentication.getPrincipal();

            return createAuthResponse(principal);

        } catch (BadCredentialsException exception) {

            throw new UnauthorizedException(
                    "Invalid email or password"
            );
        }
    }

    @Transactional(readOnly = true)
    public AuthResponse refreshToken(
            RefreshTokenRequest request
    ) {

        String refreshToken = request.getRefreshToken();

        if (!jwtUtils.isTokenValid(refreshToken)) {
            throw new UnauthorizedException(
                    "Invalid or expired refresh token"
            );
        }

        UUID userId;

        try {
            userId = jwtUtils.extractUserId(refreshToken);
        } catch (Exception exception) {
            throw new UnauthorizedException(
                    "Invalid refresh token"
            );
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() ->
                        new UnauthorizedException(
                                "User associated with token was not found"
                        )
                );

        validateUserCanAuthenticate(user);

        UserPrincipal principal =
                UserPrincipal.fromUser(user);

        String newAccessToken =
                jwtUtils.generateAccessToken(principal);

        return new AuthResponse(
                newAccessToken,
                refreshToken,
                "Bearer",
                accessTokenExpiration / 1000
        );
    }

    public void forgotPassword(
            ForgotPasswordRequest request
    ) {

        String email = normalizeEmail(request.getEmail());

        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null || !user.isActive()) {
            return;
        }
        byte[] tokenBytes = new byte[32];
        new SecureRandom().nextBytes(tokenBytes);
        String resetToken = Base64.getUrlEncoder().withoutPadding().encodeToString(tokenBytes);
        String tokenHash = hashToken(resetToken);

        Instant expiresAt =
                Instant.now().plus(Duration.ofMinutes(15));

        passwordResetTokens.put(
                tokenHash,
                new PasswordResetEntry(
                        user.getId(),
                        expiresAt
                )
        );

        emailService.sendPasswordReset(user.getEmail(), resetToken);
    }

    public void resetPassword(
            ResetPasswordRequest request
    ) {

        PasswordResetEntry resetEntry =
                passwordResetTokens.remove(hashToken(request.getToken()));

        if (resetEntry == null) {
            throw new BadRequestException(
                    "Invalid or expired reset token"
            );
        }

        if (resetEntry.expiresAt().isBefore(Instant.now())) {

            throw new BadRequestException(
                    "Invalid or expired reset token"
            );
        }

        User user = userRepository.findById(
                resetEntry.userId()
        ).orElseThrow(() ->
                new ResourceNotFoundException(
                        "User associated with reset token was not found"
                )
        );

        user.setPassword(
                passwordEncoder.encode(
                        request.getNewPassword()
                )
        );

        userRepository.save(user);

    }

    private void validateRegistration(RegisterRequest request, Role role) {
        if (role == Role.HOSPITAL && (blank(request.getHospitalName()) || blank(request.getRegistrationNumber())
                || blank(request.getHospitalAddress()) || blank(request.getHospitalCity()) || blank(request.getHospitalState()))) {
            throw new BadRequestException("Hospital name, registration number and complete address are required");
        }
        if (role == Role.DONOR && (blank(request.getBloodGroup()) || blank(request.getDateOfBirth())
                || blank(request.getGender()) || request.getWeight() == null || request.getWeight().signum() <= 0
                || blank(request.getCity()) || blank(request.getState()))) {
            throw new BadRequestException("Complete donor profile is required");
        }
        if (role == Role.DONOR) {
            try {
                BloodGroup.valueOf(request.getBloodGroup().trim().toUpperCase());
                LocalDate dateOfBirth = LocalDate.parse(request.getDateOfBirth().trim());
                if (Period.between(dateOfBirth, LocalDate.now()).getYears() < 18) {
                    throw new BadRequestException("Donors must be at least 18 years old");
                }
            } catch (java.time.format.DateTimeParseException | IllegalArgumentException exception) {
                throw new BadRequestException("Blood group or date of birth is invalid");
            }
            if (!java.util.Set.of("MALE", "FEMALE", "OTHER").contains(request.getGender().trim().toUpperCase())) {
                throw new BadRequestException("Gender is invalid");
            }
            if (request.getWeight().compareTo(new java.math.BigDecimal("45")) < 0
                    || request.getWeight().compareTo(new java.math.BigDecimal("250")) > 0) {
                throw new BadRequestException("Weight must be between 45 and 250 kg");
            }
        }
        if (request.getPhone() != null && request.getPhone().isBlank()) {
            throw new BadRequestException("Phone must not be blank");
        }
    }

    private boolean blank(String value) { return value == null || value.isBlank(); }

    private String hashToken(String token) {
        try {
            return Base64.getUrlEncoder().withoutPadding().encodeToString(
                    MessageDigest.getInstance("SHA-256").digest(token.getBytes(java.nio.charset.StandardCharsets.UTF_8)));
        } catch (java.security.NoSuchAlgorithmException exception) {
            throw new IllegalStateException("Token hashing is unavailable", exception);
        }
    }

    @Transactional(readOnly = true)
    public UserPrincipal getCurrentUser(
            UserPrincipal currentUser
    ) {

        if (currentUser == null) {
            throw new UnauthorizedException(
                    "Authentication is required"
            );
        }

        User user = userRepository.findById(
                currentUser.getId()
        ).orElseThrow(() ->
                new ResourceNotFoundException(
                        "Current user was not found"
                )
        );

        validateUserCanAuthenticate(user);

        return UserPrincipal.fromUser(user);
    }

    private AuthResponse createAuthResponse(
            UserPrincipal principal
    ) {

        String accessToken =
                jwtUtils.generateAccessToken(principal);

        String refreshToken =
                jwtUtils.generateRefreshToken(principal);

        return new AuthResponse(
                accessToken,
                refreshToken,
                "Bearer",
                accessTokenExpiration / 1000
        );
    }

    private void validateUserCanAuthenticate(User user) {

        if (!user.isActive()) {
            throw new UnauthorizedException(
                    "User account is inactive"
            );
        }

        if (user.getStatus() == UserStatus.BLOCKED) {
            throw new UnauthorizedException(
                    "User account is blocked"
            );
        }
    }

    private String normalizePhone(String phone) {
        if (phone == null || phone.isBlank()) return null;
        return IndianPhoneNumber.normalize(phone);
    }

    private String normalizeEmail(String email) {

        if (email == null || email.isBlank()) {
            throw new BadRequestException(
                    "Email is required"
            );
        }

        return email.trim().toLowerCase();
    }

    private record PasswordResetEntry(
            UUID userId,
            Instant expiresAt
    ) {
    }
}

package com.redpulse.modules.auth.service;

import com.redpulse.common.exception.BadRequestException;
import com.redpulse.common.security.JwtUtils;
import com.redpulse.enums.Role;
import com.redpulse.modules.auth.dto.RegisterRequest;
import com.redpulse.modules.hospital.repository.HospitalRepository;
import com.redpulse.modules.user.repository.DonorProfileRepository;
import com.redpulse.modules.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceValidationTest {

    @Mock UserRepository userRepository;
    @Mock HospitalRepository hospitalRepository;
    @Mock DonorProfileRepository donorProfileRepository;
    @Mock PasswordEncoder passwordEncoder;
    @Mock AuthenticationManager authenticationManager;
    @Mock JwtUtils jwtUtils;

    private AuthService authService;

    @BeforeEach
    void setUp() {
        authService = new AuthService(
                userRepository,
                hospitalRepository,
                donorProfileRepository,
                passwordEncoder,
                authenticationManager,
                jwtUtils,
                86_400_000L
        );
        when(userRepository.existsByEmail("user@example.com")).thenReturn(false);
    }

    @Test
    void rejectsAdminRoleBeforePersistingUser() {
        RegisterRequest request = validDonorRequest();
        request.setRole(Role.ADMIN);

        assertThrows(BadRequestException.class, () -> authService.register(request));

        verify(userRepository, never()).save(org.mockito.ArgumentMatchers.any());
    }

    @Test
    void defaultsMissingRoleToDonorButRequiresClinicalData() {
        RegisterRequest request = validDonorRequest();
        request.setRole(null);
        request.setBloodGroup(null);

        assertThrows(BadRequestException.class, () -> authService.register(request));

        verify(userRepository, never()).save(org.mockito.ArgumentMatchers.any());
    }

    @Test
    void rejectsInvalidDonorGender() {
        RegisterRequest request = validDonorRequest();
        request.setGender("UNKNOWN");

        assertThrows(BadRequestException.class, () -> authService.register(request));

        verify(userRepository, never()).save(org.mockito.ArgumentMatchers.any());
    }

    private RegisterRequest validDonorRequest() {
        RegisterRequest request = new RegisterRequest();
        request.setFirstName("Test");
        request.setLastName("User");
        request.setEmail("user@example.com");
        request.setPassword("StrongPassword1!");
        request.setRole(Role.DONOR);
        request.setBloodGroup("O_POSITIVE");
        request.setDateOfBirth("1990-01-01");
        request.setGender("MALE");
        request.setWeight(new BigDecimal("65"));
        request.setCity("Ahmedabad");
        request.setState("Gujarat");
        return request;
    }
}

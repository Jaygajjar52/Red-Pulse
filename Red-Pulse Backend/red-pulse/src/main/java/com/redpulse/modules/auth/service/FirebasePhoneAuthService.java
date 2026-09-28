package com.redpulse.modules.auth.service;

import com.redpulse.common.exception.ConflictException;
import com.redpulse.common.exception.UnauthorizedException;
import com.redpulse.common.firebase.FirebaseTokenService;
import com.redpulse.common.phone.IndianPhoneNumber;
import com.redpulse.common.security.JwtUtils;
import com.redpulse.common.security.UserPrincipal;
import com.redpulse.enums.Role;
import com.redpulse.enums.UserStatus;
import com.redpulse.modules.auth.dto.AuthResponse;
import com.redpulse.modules.auth.dto.FirebasePhoneAuthRequest;
import com.redpulse.modules.user.entity.User;
import com.redpulse.modules.user.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.Base64;

@Service
@Transactional
public class FirebasePhoneAuthService {

    private final FirebaseTokenService firebaseTokenService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;
    private final long accessTokenExpiration;
    private final SecureRandom secureRandom = new SecureRandom();

    public FirebasePhoneAuthService(
            FirebaseTokenService firebaseTokenService,
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtUtils jwtUtils,
            @Value("${jwt.access-token-expiration}") long accessTokenExpiration
    ) {
        this.firebaseTokenService = firebaseTokenService;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtils = jwtUtils;
        this.accessTokenExpiration = accessTokenExpiration;
    }

    public AuthResponse authenticate(String authorizationHeader, FirebasePhoneAuthRequest request) {
        FirebaseTokenService.VerifiedFirebaseUser verified =
                firebaseTokenService.verify(authorizationHeader);
        String phone = IndianPhoneNumber.normalize(verified.phoneNumber());

        User user = userRepository.findByFirebaseUid(verified.uid()).orElse(null);
        User phoneOwner = userRepository.findByPhone(phone).orElse(null);

        if (user != null && phoneOwner != null && !user.getId().equals(phoneOwner.getId())) {
            throw new ConflictException("This phone number is linked to another Red Pulse account");
        }
        if (user == null) {
            user = phoneOwner;
        }

        if (user == null) {
            user = createUser(verified.uid(), phone, request);
        } else {
            if (user.getFirebaseUid() != null && !user.getFirebaseUid().equals(verified.uid())) {
                throw new ConflictException("This phone number is linked to another Firebase account");
            }
            user.setFirebaseUid(verified.uid());
            user.setPhone(phone);
            user.setVerified(true);
            userRepository.save(user);
        }

        if (!user.isActive() || user.getStatus() == UserStatus.BLOCKED) {
            throw new UnauthorizedException("User account is inactive or blocked");
        }

        UserPrincipal principal = UserPrincipal.fromUser(user);
        return new AuthResponse(
                jwtUtils.generateAccessToken(principal),
                jwtUtils.generateRefreshToken(principal),
                "Bearer",
                accessTokenExpiration / 1000
        );
    }

    private User createUser(String uid, String phone, FirebasePhoneAuthRequest request) {
        String email = uid + "@firebase-phone.invalid";
        User user = new User(
                safeName(request.getFirstName(), "Phone"),
                safeName(request.getLastName(), "User"),
                email,
                passwordEncoder.encode(randomPassword()),
                phone,
                Role.DONOR,
                UserStatus.ACTIVE
        );
        user.setFirebaseUid(uid);
        user.setVerified(true);
        return userRepository.save(user);
    }

    private String randomPassword() {
        byte[] bytes = new byte[32];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String safeName(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value.trim();
    }
}

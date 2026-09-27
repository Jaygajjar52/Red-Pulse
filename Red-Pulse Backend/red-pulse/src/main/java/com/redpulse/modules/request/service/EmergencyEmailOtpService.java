package com.redpulse.modules.request.service;

import com.redpulse.common.exception.BadRequestException;
import com.redpulse.common.phone.IndianPhoneNumber;
import com.redpulse.modules.request.dto.EmergencyEmailOtpRequest;
import com.redpulse.modules.request.dto.EmergencyEmailOtpVerifyRequest;
import com.redpulse.modules.request.entity.EmergencyEmailOtp;
import com.redpulse.modules.request.entity.EmergencyVerification;
import com.redpulse.modules.request.repository.EmergencyEmailOtpRepository;
import com.redpulse.modules.request.repository.EmergencyVerificationRepository;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.nio.charset.StandardCharsets;
import java.security.*;
import java.time.*;
import java.util.*;

@Service
public class EmergencyEmailOtpService {
    private static final Logger log = LoggerFactory.getLogger(EmergencyEmailOtpService.class);
    private final EmergencyEmailOtpRepository otpRepository;
    private final EmergencyVerificationRepository verificationRepository;
    private final PasswordEncoder passwordEncoder;
    private final JavaMailSender mailSender;
    private final String mailUsername;
    private final boolean enabled;
    private final long expirationSeconds;
    private final long cooldownSeconds;
    private final int maxAttempts;
    private final int maxEmailRequests;
    private final int maxIpRequests;
    private final long verificationExpirationSeconds;
    private final SecureRandom random = new SecureRandom();

    public EmergencyEmailOtpService(EmergencyEmailOtpRepository otpRepository,
                                    EmergencyVerificationRepository verificationRepository,
                                    PasswordEncoder passwordEncoder,
                                    JavaMailSender mailSender,
                                    @Value("${spring.mail.username:}") String mailUsername,
                                    @Value("${app.emergency-otp.enabled:false}") boolean enabled,
                                    @Value("${app.emergency-otp.expiration-seconds:300}") long expirationSeconds,
                                    @Value("${app.emergency-otp.resend-throttle-seconds:60}") long cooldownSeconds,
                                    @Value("${app.emergency-otp.max-attempts:5}") int maxAttempts,
                                    @Value("${app.emergency-otp.max-requests-per-email:5}") int maxEmailRequests,
                                    @Value("${app.emergency-otp.max-requests-per-ip:20}") int maxIpRequests,
                                    @Value("${app.emergency-otp.verification-expiration-seconds:600}") long verificationExpirationSeconds) {
        this.otpRepository = otpRepository;
        this.verificationRepository = verificationRepository;
        this.passwordEncoder = passwordEncoder;
        this.mailSender = mailSender;
        this.mailUsername = mailUsername;
        this.enabled = enabled;
        this.expirationSeconds = expirationSeconds;
        this.cooldownSeconds = cooldownSeconds;
        this.maxAttempts = maxAttempts;
        this.maxEmailRequests = maxEmailRequests;
        this.maxIpRequests = maxIpRequests;
        this.verificationExpirationSeconds = verificationExpirationSeconds;
    }

    @Transactional
    public Map<String, Object> request(EmergencyEmailOtpRequest request, String ip, String userAgent) {
        ensureConfigured();
        String email = normalizeEmail(request.getEmail());
        String phone = IndianPhoneNumber.normalize(request.getPhoneNumber());
        LocalDateTime now = LocalDateTime.now();
        if (otpRepository.countByEmailAndCreatedAtAfter(email, now.minusHours(1)) >= maxEmailRequests
                || otpRepository.countByIpAddressAndCreatedAtAfter(ip, now.minusHours(1)) >= maxIpRequests) {
            log.warn("EMERGENCY_OTP_RATE_LIMITED emailHash={} provider=GMAIL", hashForLog(email));
            throw new OtpException("OTP_RATE_LIMITED", "Too many OTP requests. Please try again later.", 429);
        }
        Optional<EmergencyEmailOtp> previous = otpRepository
                .findTopByEmailAndPhoneNumberAndUsedFalseOrderByCreatedAtDesc(email, phone);
        if (previous.isPresent() && previous.get().getCreatedAt().plusSeconds(cooldownSeconds).isAfter(now)) {
            throw new OtpException("OTP_RATE_LIMITED", "Please wait before requesting another OTP.", 429);
        }
        String otp = String.format("%06d", random.nextInt(1_000_000));
        EmergencyEmailOtp record = otpRepository.save(new EmergencyEmailOtp(
                email, phone, passwordEncoder.encode(otp), now,
                now.plusSeconds(expirationSeconds), maxAttempts, ip, userAgent));
        sendEmail(email, otp);
        log.info("EMERGENCY_OTP_SENT id={} emailHash={} provider=GMAIL", record.getId(), hashForLog(email));
        return Map.of("success", true, "message", "Verification OTP sent to your email.",
                "expiresInSeconds", expirationSeconds, "resendAvailableInSeconds", cooldownSeconds);
    }

    @Transactional
    public Map<String, Object> verify(EmergencyEmailOtpVerifyRequest request) {
        String email = normalizeEmail(request.getEmail());
        String phone = IndianPhoneNumber.normalize(request.getPhoneNumber());
        EmergencyEmailOtp record = otpRepository
                .findTopByEmailAndPhoneNumberAndUsedFalseOrderByCreatedAtDesc(email, phone)
                .orElseThrow(() -> new OtpException("OTP_INVALID", "Invalid OTP.", 400));
        LocalDateTime now = LocalDateTime.now();
        if (record.getExpiresAt().isBefore(now)) {
            log.info("EMERGENCY_OTP_EXPIRED id={} emailHash={}", record.getId(), hashForLog(email));
            throw new OtpException("OTP_EXPIRED", "This OTP has expired. Please request a new OTP.", 400);
        }
        if (record.getAttemptCount() >= record.getMaxAttempts()) {
            log.info("EMERGENCY_OTP_MAX_ATTEMPTS id={} emailHash={}", record.getId(), hashForLog(email));
            throw new OtpException("OTP_MAX_ATTEMPTS", "Maximum OTP attempts exceeded. Please request a new OTP.", 400);
        }
        if (!passwordEncoder.matches(request.getOtp(), record.getOtpHash())) {
            record.incrementAttempt();
            otpRepository.save(record);
            log.info("EMERGENCY_OTP_FAILED id={} emailHash={}", record.getId(), hashForLog(email));
            if (record.getAttemptCount() >= record.getMaxAttempts()) {
                throw new OtpException("OTP_MAX_ATTEMPTS", "Maximum OTP attempts exceeded. Please request a new OTP.", 400);
            }
            throw new OtpException("OTP_INVALID", "Invalid OTP.", 400);
        }
        record.markUsed();
        otpRepository.save(record);
        EmergencyVerification verification = verificationRepository.save(new EmergencyVerification(
                email, phone, now, now.plusSeconds(verificationExpirationSeconds)));
        log.info("EMERGENCY_OTP_VERIFIED id={} emailHash={}", record.getId(), hashForLog(email));
        return Map.of("success", true, "message", "Emergency verification successful.",
                "verified", true, "verificationId", verification.getId());
    }

    @Transactional
    public EmergencyVerification consumeVerification(UUID id, String email, String phone) {
        EmergencyVerification verification = verificationRepository.findById(id)
                .orElseThrow(() -> new OtpException("VERIFICATION_INVALID", "Emergency verification is invalid.", 400));
        if (!verification.isVerified() || verification.isUsed()
                || verification.getExpiresAt().isBefore(LocalDateTime.now())
                || !verification.getEmail().equals(normalizeEmail(email))
                || !verification.getPhoneNumber().equals(IndianPhoneNumber.normalize(phone))) {
            throw new OtpException("VERIFICATION_INVALID", "Emergency verification is invalid or expired.", 400);
        }
        verification.markUsed();
        return verificationRepository.save(verification);
    }

    private void sendEmail(String email, String otp) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, StandardCharsets.UTF_8.name());
            helper.setFrom(mailUsername);
            helper.setTo(email);
            helper.setSubject("Red Pulse Emergency Verification OTP");
            helper.setText("Hello,\n\nYou requested emergency verification on Red Pulse.\n\n"
                    + "Your verification OTP is:\n\n" + otp + "\n\n"
                    + "This OTP will expire in 5 minutes.\n\n"
                    + "If you did not request this verification, please ignore this email.\n\nRegards,\nRed Pulse Team");
            mailSender.send(message);
        } catch (Exception ex) {
            log.error("EMERGENCY_OTP_SEND_FAILED emailHash={} provider=GMAIL", hashForLog(email), ex);
            throw new BadRequestException("Unable to send verification email. Please try again later.");
        }
    }

    private void ensureConfigured() {
        if (!enabled || mailUsername == null || mailUsername.isBlank()) {
            throw new BadRequestException("Emergency email verification is not configured.");
        }
    }
    private String normalizeEmail(String value) {
        String email = value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
        if (!email.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) throw new BadRequestException("Valid email address is required.");
        return email;
    }
    private String hashForLog(String value) {
        try {
            byte[] hash = MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash).substring(0, 16);
        } catch (NoSuchAlgorithmException ex) {
            return "unavailable";
        }
    }

    public static class OtpException extends RuntimeException {
        private final String errorCode;
        private final int status;
        public OtpException(String errorCode, String message, int status) { super(message); this.errorCode = errorCode; this.status = status; }
        public String getErrorCode() { return errorCode; }
        public int getStatus() { return status; }
    }
}

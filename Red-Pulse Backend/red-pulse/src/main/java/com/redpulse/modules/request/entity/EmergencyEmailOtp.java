package com.redpulse.modules.request.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "emergency_email_otps")
public class EmergencyEmailOtp {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    @Column(nullable = false, length = 320)
    private String email;
    @Column(name = "phone_number", nullable = false, length = 20)
    private String phoneNumber;
    @Column(name = "otp_hash", nullable = false)
    private String otpHash;
    @Column(nullable = false)
    private LocalDateTime createdAt;
    @Column(nullable = false)
    private LocalDateTime expiresAt;
    @Column(nullable = false)
    private int attemptCount;
    @Column(nullable = false)
    private int maxAttempts;
    @Column(nullable = false)
    private boolean used;
    private String ipAddress;
    @Column(columnDefinition = "TEXT")
    private String userAgent;
    private LocalDateTime verifiedAt;

    protected EmergencyEmailOtp() {}

    public EmergencyEmailOtp(String email, String phoneNumber, String otpHash,
                             LocalDateTime createdAt, LocalDateTime expiresAt,
                             int maxAttempts, String ipAddress, String userAgent) {
        this.email = email;
        this.phoneNumber = phoneNumber;
        this.otpHash = otpHash;
        this.createdAt = createdAt;
        this.expiresAt = expiresAt;
        this.maxAttempts = maxAttempts;
        this.ipAddress = ipAddress;
        this.userAgent = userAgent;
    }

    public UUID getId() { return id; }
    public String getEmail() { return email; }
    public String getPhoneNumber() { return phoneNumber; }
    public String getOtpHash() { return otpHash; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getExpiresAt() { return expiresAt; }
    public int getAttemptCount() { return attemptCount; }
    public int getMaxAttempts() { return maxAttempts; }
    public boolean isUsed() { return used; }
    public String getIpAddress() { return ipAddress; }
    public String getUserAgent() { return userAgent; }
    public LocalDateTime getVerifiedAt() { return verifiedAt; }
    public void incrementAttempt() { attemptCount++; }
    public void markUsed() { used = true; verifiedAt = LocalDateTime.now(); }
}

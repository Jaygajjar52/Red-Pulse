package com.redpulse.modules.request.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "emergency_verifications")
public class EmergencyVerification {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    @Column(nullable = false, length = 320)
    private String email;
    @Column(name = "phone_number", nullable = false, length = 20)
    private String phoneNumber;
    @Column(nullable = false)
    private LocalDateTime createdAt;
    @Column(nullable = false)
    private LocalDateTime expiresAt;
    @Column(nullable = false)
    private boolean used;
    @Column(nullable = false)
    private boolean verified;

    protected EmergencyVerification() {}

    public EmergencyVerification(String email, String phoneNumber, LocalDateTime createdAt, LocalDateTime expiresAt) {
        this.email = email;
        this.phoneNumber = phoneNumber;
        this.createdAt = createdAt;
        this.expiresAt = expiresAt;
        this.verified = true;
    }

    public UUID getId() { return id; }
    public String getEmail() { return email; }
    public String getPhoneNumber() { return phoneNumber; }
    public LocalDateTime getExpiresAt() { return expiresAt; }
    public boolean isUsed() { return used; }
    public boolean isVerified() { return verified; }
    public void markUsed() { used = true; }
}

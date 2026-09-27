package com.redpulse.common.otp;

import java.time.Instant;

public record OtpRecord(String hash, Instant expiresAt, Instant lastSentAt, String requesterName, int attempts) {
    public OtpRecord withAttempts(int value) { return new OtpRecord(hash, expiresAt, lastSentAt, requesterName, value); }
}

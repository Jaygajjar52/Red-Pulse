CREATE TABLE emergency_email_otps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(320) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    otp_hash TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    attempt_count INTEGER NOT NULL DEFAULT 0,
    max_attempts INTEGER NOT NULL DEFAULT 5,
    used BOOLEAN NOT NULL DEFAULT FALSE,
    ip_address VARCHAR(100),
    user_agent TEXT,
    verified_at TIMESTAMP NULL
);

CREATE INDEX idx_emergency_email_otps_email ON emergency_email_otps(email);
CREATE INDEX idx_emergency_email_otps_created_at ON emergency_email_otps(created_at);
CREATE INDEX idx_emergency_email_otps_expires_at ON emergency_email_otps(expires_at);
CREATE INDEX idx_emergency_email_otps_used ON emergency_email_otps(used);

CREATE TABLE emergency_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(320) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN NOT NULL DEFAULT FALSE,
    verified BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX idx_emergency_verifications_expires_at ON emergency_verifications(expires_at);
CREATE INDEX idx_emergency_verifications_used ON emergency_verifications(used);

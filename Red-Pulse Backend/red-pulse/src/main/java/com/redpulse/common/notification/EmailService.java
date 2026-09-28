package com.redpulse.common.notification;

public interface EmailService {
    void sendPasswordReset(String email, String resetToken);
}

package com.redpulse.common.notification;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

@Service
@Profile("!dev & !test")
public class UnconfiguredProductionEmailService implements EmailService {
    @Override public void sendPasswordReset(String email, String resetToken) {
        throw new IllegalStateException("A production email provider must be configured");
    }
}

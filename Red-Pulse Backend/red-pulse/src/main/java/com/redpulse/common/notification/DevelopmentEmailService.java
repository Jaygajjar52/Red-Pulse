package com.redpulse.common.notification;

import org.springframework.context.annotation.Profile;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

@Service
@Profile({"dev", "test"})
@ConditionalOnProperty(name = "app.notifications.dev-enabled", havingValue = "true")
public class DevelopmentEmailService implements EmailService {
    @Override public void sendPasswordReset(String email, String resetToken) {
        // Deliberately do not log or expose reset tokens.
    }
}

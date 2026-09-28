package com.redpulse.common.notification;

import org.springframework.context.annotation.Profile;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

@Service
@Profile({"dev", "test"})
@ConditionalOnProperty(name = "app.notifications.dev-enabled", havingValue = "true")
public class DevelopmentSmsService implements SmsService {
    @Override public void sendOtp(String phoneE164, String otp) {
        // Deliberately do not log or expose OTPs. Tests can replace this bean with a mock.
    }
}

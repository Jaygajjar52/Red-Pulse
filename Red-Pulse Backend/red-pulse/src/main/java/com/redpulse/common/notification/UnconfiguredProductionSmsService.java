package com.redpulse.common.notification;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

@Service
@Profile("!dev & !test")
public class UnconfiguredProductionSmsService implements SmsService {
    @Override public void sendOtp(String phoneE164, String otp) {
        throw new IllegalStateException("A production SMS provider must be configured");
    }
}

package com.redpulse.common.notification;

public interface SmsService {
    void sendOtp(String phoneE164, String otp);
}

package com.redpulse.common.otp;

public interface OtpStore {
    OtpRecord find(String phoneE164);
    void save(String phoneE164, OtpRecord record);
    boolean consume(String phoneE164, OtpRecord expected);
    boolean replace(String phoneE164, OtpRecord expected, OtpRecord replacement);
    void remove(String phoneE164, OtpRecord expected);
}

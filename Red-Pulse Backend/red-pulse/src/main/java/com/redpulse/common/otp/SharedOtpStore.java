package com.redpulse.common.otp;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

/** Production boundary for a shared/transactional store (for example Redis), without coupling to an unverified API. */
@Component
@Profile("!dev & !test")
public class SharedOtpStore implements OtpStore {
    private UnsupportedOperationException unavailable() {
        return new UnsupportedOperationException("A production shared OTP store must be configured");
    }
    public OtpRecord find(String phone) { throw unavailable(); }
    public void save(String phone, OtpRecord record) { throw unavailable(); }
    public boolean consume(String phone, OtpRecord expected) { throw unavailable(); }
    public boolean replace(String phone, OtpRecord expected, OtpRecord replacement) { throw unavailable(); }
    public void remove(String phone, OtpRecord expected) { throw unavailable(); }
}

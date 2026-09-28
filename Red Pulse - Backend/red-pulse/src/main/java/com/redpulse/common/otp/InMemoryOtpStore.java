package com.redpulse.common.otp;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import java.util.concurrent.ConcurrentHashMap;

@Component
@Profile({"dev", "test"})
public class InMemoryOtpStore implements OtpStore {
    private final ConcurrentHashMap<String, OtpRecord> records = new ConcurrentHashMap<>();
    public OtpRecord find(String phone) { return records.get(phone); }
    public void save(String phone, OtpRecord record) { records.put(phone, record); }
    public boolean consume(String phone, OtpRecord expected) { return records.remove(phone, expected); }
    public boolean replace(String phone, OtpRecord expected, OtpRecord replacement) { return records.replace(phone, expected, replacement); }
    public void remove(String phone, OtpRecord expected) { records.remove(phone, expected); }
}

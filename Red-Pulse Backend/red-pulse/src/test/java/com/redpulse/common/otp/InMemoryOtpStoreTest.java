package com.redpulse.common.otp;

import org.junit.jupiter.api.Test;
import java.time.Instant;
import static org.junit.jupiter.api.Assertions.*;

class InMemoryOtpStoreTest {
    @Test void consumeIsSingleUseAndCompareAndRemove() {
        InMemoryOtpStore store = new InMemoryOtpStore();
        OtpRecord record = new OtpRecord("hash", Instant.now().plusSeconds(60), Instant.now(), "name", 0);
        store.save("+919876543210", record);
        assertTrue(store.consume("+919876543210", record));
        assertFalse(store.consume("+919876543210", record));
    }
}

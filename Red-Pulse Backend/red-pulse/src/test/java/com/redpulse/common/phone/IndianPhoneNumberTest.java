package com.redpulse.common.phone;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class IndianPhoneNumberTest {
    @Test void normalizesAcceptedIndianFormats() {
        assertEquals("+919876543210", IndianPhoneNumber.normalize("09876543210"));
        assertEquals("+919876543210", IndianPhoneNumber.normalize("+91 98765-43210"));
    }
    @Test void rejectsInvalidNumbers() {
        assertThrows(RuntimeException.class, () -> IndianPhoneNumber.normalize("12345"));
    }
}

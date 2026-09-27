package com.redpulse.common.phone;

import com.redpulse.common.exception.BadRequestException;

public final class IndianPhoneNumber {
    private IndianPhoneNumber() {}

    public static String normalize(String value) {
        if (value == null || value.isBlank()) throw new BadRequestException("Valid Indian phone number is required");
        String compact = value.trim().replaceAll("[\\s().-]", "");
        if (compact.startsWith("00")) compact = "+" + compact.substring(2);
        if (compact.startsWith("+91")) compact = compact.substring(3);
        else if (compact.startsWith("91") && compact.length() == 12) compact = compact.substring(2);
        else if (compact.startsWith("0") && compact.length() == 11) compact = compact.substring(1);
        if (!compact.matches("[6-9][0-9]{9}")) throw new BadRequestException("Valid Indian phone number is required");
        return "+91" + compact;
    }
}

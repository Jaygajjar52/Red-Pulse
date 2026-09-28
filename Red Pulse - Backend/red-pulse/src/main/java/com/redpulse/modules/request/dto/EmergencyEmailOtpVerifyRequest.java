package com.redpulse.modules.request.dto;

import jakarta.validation.constraints.*;

public class EmergencyEmailOtpVerifyRequest extends EmergencyEmailOtpRequest {
    @NotBlank @Pattern(regexp = "\\d{6}") private String otp;
    public EmergencyEmailOtpVerifyRequest() {}
    public String getOtp() { return otp; }
    public void setOtp(String otp) { this.otp = otp; }
}

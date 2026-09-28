package com.redpulse.modules.request.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class EmergencyEmailOtpRequest {
    @NotBlank @Email @Size(max = 320)
    private String email;
    @NotBlank @Size(max = 20)
    private String phoneNumber;
    public EmergencyEmailOtpRequest() {}
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }
}

package com.redpulse.modules.request.dto;

import com.redpulse.enums.BloodGroup;
import com.redpulse.enums.Urgency;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.UUID;

public class EmergencyOtpDispatchPayload {

    @NotBlank(message = "Phone number is required")
    private String phone;

    @NotBlank(message = "Name is required")
    private String name;

    @NotBlank(message = "Email is required")
    @jakarta.validation.constraints.Email
    private String email;

    @NotNull(message = "Emergency verification is required")
    private UUID verificationId;

    @NotNull(message = "Blood group is required")
    private BloodGroup bloodGroup;

    @NotNull(message = "Units required is required")
    @Min(value = 1, message = "At least 1 unit is required")
    private Integer unitsRequired;

    private UUID hospitalId;

    private String approximateLocation;

    private Double latitude;

    private Double longitude;

    private String description;

    private Urgency emergencyLevel = Urgency.CRITICAL;

    public EmergencyOtpDispatchPayload() {}

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public UUID getVerificationId() { return verificationId; }
    public void setVerificationId(UUID verificationId) { this.verificationId = verificationId; }

    public BloodGroup getBloodGroup() { return bloodGroup; }
    public void setBloodGroup(BloodGroup bloodGroup) { this.bloodGroup = bloodGroup; }

    public Integer getUnitsRequired() { return unitsRequired; }
    public void setUnitsRequired(Integer unitsRequired) { this.unitsRequired = unitsRequired; }

    public UUID getHospitalId() { return hospitalId; }
    public void setHospitalId(UUID hospitalId) { this.hospitalId = hospitalId; }

    public String getApproximateLocation() { return approximateLocation; }
    public void setApproximateLocation(String approximateLocation) { this.approximateLocation = approximateLocation; }

    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }

    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Urgency getEmergencyLevel() { return emergencyLevel; }
    public void setEmergencyLevel(Urgency emergencyLevel) { this.emergencyLevel = emergencyLevel; }
}

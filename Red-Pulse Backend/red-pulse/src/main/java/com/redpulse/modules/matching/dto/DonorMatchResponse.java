package com.redpulse.modules.matching.dto;

import com.redpulse.enums.AvailabilityStatus;
import com.redpulse.enums.BloodGroup;
import java.util.UUID;

public class DonorMatchResponse {

    private UUID donorId;
    private UUID userId;
    private String fullName;
    private BloodGroup bloodGroup;
    private String phone;
    private String city;
    private String state;
    private double distanceKm;
    private int matchScore;
    private boolean verified;
    private AvailabilityStatus availabilityStatus;

    public DonorMatchResponse() {}

    public DonorMatchResponse(UUID donorId, UUID userId, String fullName, BloodGroup bloodGroup,
                              String phone, String city, String state, double distanceKm,
                              int matchScore, boolean verified, AvailabilityStatus availabilityStatus) {
        this.donorId = donorId;
        this.userId = userId;
        this.fullName = fullName;
        this.bloodGroup = bloodGroup;
        this.phone = phone;
        this.city = city;
        this.state = state;
        this.distanceKm = distanceKm;
        this.matchScore = matchScore;
        this.verified = verified;
        this.availabilityStatus = availabilityStatus;
    }

    public UUID getDonorId() { return donorId; }
    public UUID getUserId() { return userId; }
    public String getFullName() { return fullName; }
    public BloodGroup getBloodGroup() { return bloodGroup; }
    public String getPhone() { return phone; }
    public String getCity() { return city; }
    public String getState() { return state; }
    public double getDistanceKm() { return distanceKm; }
    public int getMatchScore() { return matchScore; }
    public boolean isVerified() { return verified; }
    public AvailabilityStatus getAvailabilityStatus() { return availabilityStatus; }
}

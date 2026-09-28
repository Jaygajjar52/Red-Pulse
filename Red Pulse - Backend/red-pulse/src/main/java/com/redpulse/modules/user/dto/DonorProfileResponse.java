package com.redpulse.modules.user.dto;

import com.redpulse.modules.user.entity.DonorProfile;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.Period;
import java.util.UUID;

public class DonorProfileResponse {

    private UUID id;
    private UUID userId;
    private String bloodGroup;
    private LocalDate dateOfBirth;
    private Integer age;
    private String gender;
    private BigDecimal weight;
    private String city;
    private String state;
    private Double latitude;
    private Double longitude;
    private LocalDate lastDonationDate;
    private String availabilityStatus;

    private boolean isEligible;
    private String ineligibilityReason;
    private Long cooldownDaysRemaining;

    public DonorProfileResponse() {
    }

    public static DonorProfileResponse fromEntity(
            DonorProfile profile,
            boolean isEligible,
            String ineligibilityReason,
            Long cooldownDaysRemaining
    ) {
        DonorProfileResponse response = new DonorProfileResponse();

        response.id = profile.getId();

        if (profile.getUser() != null) {
            response.userId = profile.getUser().getId();
        }

        response.bloodGroup = profile.getBloodGroup() != null
                ? profile.getBloodGroup().name()
                : null;

        response.dateOfBirth = profile.getDateOfBirth();

        if (profile.getDateOfBirth() != null) {
            response.age = Period.between(
                    profile.getDateOfBirth(),
                    LocalDate.now()
            ).getYears();
        }

        response.gender = profile.getGender();

        response.weight = profile.getWeight();

        response.city = profile.getCity();
        response.state = profile.getState();
        response.latitude = profile.getLatitude();
        response.longitude = profile.getLongitude();
        response.lastDonationDate = profile.getLastDonationDate();

        response.availabilityStatus =
                profile.getAvailabilityStatus() != null
                        ? profile.getAvailabilityStatus().name()
                        : null;

        response.isEligible = isEligible;
        response.ineligibilityReason = ineligibilityReason;
        response.cooldownDaysRemaining = cooldownDaysRemaining;

        return response;
    }

    public UUID getId() {
        return id;
    }

    public UUID getUserId() {
        return userId;
    }

    public String getBloodGroup() {
        return bloodGroup;
    }

    public LocalDate getDateOfBirth() {
        return dateOfBirth;
    }

    public Integer getAge() {
        return age;
    }

    public String getGender() {
        return gender;
    }

    public BigDecimal getWeight() {
        return weight;
    }

    public String getCity() {
        return city;
    }

    public String getState() {
        return state;
    }

    public Double getLatitude() {
        return latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public LocalDate getLastDonationDate() {
        return lastDonationDate;
    }

    public String getAvailabilityStatus() {
        return availabilityStatus;
    }

    public boolean isEligible() {
        return isEligible;
    }

    public String getIneligibilityReason() {
        return ineligibilityReason;
    }

    public Long getCooldownDaysRemaining() {
        return cooldownDaysRemaining;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public void setBloodGroup(String bloodGroup) {
        this.bloodGroup = bloodGroup;
    }

    public void setDateOfBirth(LocalDate dateOfBirth) {
        this.dateOfBirth = dateOfBirth;
    }

    public void setAge(Integer age) {
        this.age = age;
    }

    public void setGender(String gender) {
        this.gender = gender;
    }

    public void setWeight(BigDecimal weight) {
        this.weight = weight;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public void setState(String state) {
        this.state = state;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }

    public void setLastDonationDate(LocalDate lastDonationDate) {
        this.lastDonationDate = lastDonationDate;
    }

    public void setAvailabilityStatus(String availabilityStatus) {
        this.availabilityStatus = availabilityStatus;
    }

    public void setEligible(boolean eligible) {
        isEligible = eligible;
    }

    public void setIneligibilityReason(String ineligibilityReason) {
        this.ineligibilityReason = ineligibilityReason;
    }

    public void setCooldownDaysRemaining(Long cooldownDaysRemaining) {
        this.cooldownDaysRemaining = cooldownDaysRemaining;
    }
}

package com.redpulse.modules.user.dto;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public class DonorContributionResponse {

    private UUID donorId;
    private String fullName;
    private String bloodGroup;
    private int totalDonations;
    private int totalUnitsDonated;
    private int livesSavedEstimate;
    private LocalDate lastDonationDate;
    private LocalDate nextEligibleDate;
    private String currentRank;
    private List<String> badges;

    public DonorContributionResponse() {}

    public DonorContributionResponse(UUID donorId, String fullName, String bloodGroup, int totalDonations,
                                     int totalUnitsDonated, int livesSavedEstimate, LocalDate lastDonationDate,
                                     LocalDate nextEligibleDate, String currentRank, List<String> badges) {
        this.donorId = donorId;
        this.fullName = fullName;
        this.bloodGroup = bloodGroup;
        this.totalDonations = totalDonations;
        this.totalUnitsDonated = totalUnitsDonated;
        this.livesSavedEstimate = livesSavedEstimate;
        this.lastDonationDate = lastDonationDate;
        this.nextEligibleDate = nextEligibleDate;
        this.currentRank = currentRank;
        this.badges = badges;
    }

    public UUID getDonorId() { return donorId; }
    public String getFullName() { return fullName; }
    public String getBloodGroup() { return bloodGroup; }
    public int getTotalDonations() { return totalDonations; }
    public int getTotalUnitsDonated() { return totalUnitsDonated; }
    public int getLivesSavedEstimate() { return livesSavedEstimate; }
    public LocalDate getLastDonationDate() { return lastDonationDate; }
    public LocalDate getNextEligibleDate() { return nextEligibleDate; }
    public String getCurrentRank() { return currentRank; }
    public List<String> getBadges() { return badges; }
}

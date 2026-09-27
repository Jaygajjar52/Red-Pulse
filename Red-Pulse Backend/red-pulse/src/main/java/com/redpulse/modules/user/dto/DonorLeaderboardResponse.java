package com.redpulse.modules.user.dto;

import java.util.UUID;

public class DonorLeaderboardResponse {

    private int rank;
    private UUID donorId;
    private String donorName;
    private String bloodGroup;
    private String city;
    private int totalDonations;
    private String badgeTitle;

    public DonorLeaderboardResponse() {}

    public DonorLeaderboardResponse(int rank, UUID donorId, String donorName, String bloodGroup,
                                    String city, int totalDonations, String badgeTitle) {
        this.rank = rank;
        this.donorId = donorId;
        this.donorName = donorName;
        this.bloodGroup = bloodGroup;
        this.city = city;
        this.totalDonations = totalDonations;
        this.badgeTitle = badgeTitle;
    }

    public int getRank() { return rank; }
    public UUID getDonorId() { return donorId; }
    public String getDonorName() { return donorName; }
    public String getBloodGroup() { return bloodGroup; }
    public String getCity() { return city; }
    public int getTotalDonations() { return totalDonations; }
    public String getBadgeTitle() { return badgeTitle; }
}

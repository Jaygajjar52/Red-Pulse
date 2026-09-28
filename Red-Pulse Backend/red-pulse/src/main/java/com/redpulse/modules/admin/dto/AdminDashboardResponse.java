package com.redpulse.modules.admin.dto;

import java.util.Map;

public class AdminDashboardResponse {

    private long totalUsers;
    private long totalDonors;
    private long totalHospitals;
    private long totalBloodRequests;
    private long activeEmergencies;
    private long totalDonations;
    private int totalBloodStockUnits;
    private Map<String, Integer> stockByBloodGroup;

    public AdminDashboardResponse() {}

    public AdminDashboardResponse(long totalUsers, long totalDonors, long totalHospitals,
                                  long totalBloodRequests, long activeEmergencies,
                                  long totalDonations, int totalBloodStockUnits,
                                  Map<String, Integer> stockByBloodGroup) {
        this.totalUsers = totalUsers;
        this.totalDonors = totalDonors;
        this.totalHospitals = totalHospitals;
        this.totalBloodRequests = totalBloodRequests;
        this.activeEmergencies = activeEmergencies;
        this.totalDonations = totalDonations;
        this.totalBloodStockUnits = totalBloodStockUnits;
        this.stockByBloodGroup = stockByBloodGroup;
    }

    public long getTotalUsers() { return totalUsers; }
    public long getTotalDonors() { return totalDonors; }
    public long getTotalHospitals() { return totalHospitals; }
    public long getTotalBloodRequests() { return totalBloodRequests; }
    public long getActiveEmergencies() { return activeEmergencies; }
    public long getTotalDonations() { return totalDonations; }
    public int getTotalBloodStockUnits() { return totalBloodStockUnits; }
    public Map<String, Integer> getStockByBloodGroup() { return stockByBloodGroup; }
}

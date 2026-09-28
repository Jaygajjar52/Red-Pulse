package com.redpulse.modules.user.dto;

import java.time.LocalDate;

public class DonorEligibilityResponse {

    private boolean isEligible;
    private String reason;
    private Long daysRemaining;
    private LocalDate nextEligibleDate;

    public DonorEligibilityResponse() {
    }

    public DonorEligibilityResponse(
            boolean isEligible,
            String reason,
            Long daysRemaining,
            LocalDate nextEligibleDate
    ) {
        this.isEligible = isEligible;
        this.reason = reason;
        this.daysRemaining = daysRemaining;
        this.nextEligibleDate = nextEligibleDate;
    }

    public boolean isEligible() {
        return isEligible;
    }

    public String getReason() {
        return reason;
    }

    public Long getDaysRemaining() {
        return daysRemaining;
    }

    public LocalDate getNextEligibleDate() {
        return nextEligibleDate;
    }

    public void setEligible(boolean eligible) {
        isEligible = eligible;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public void setDaysRemaining(Long daysRemaining) {
        this.daysRemaining = daysRemaining;
    }

    public void setNextEligibleDate(LocalDate nextEligibleDate) {
        this.nextEligibleDate = nextEligibleDate;
    }
}

package com.redpulse.modules.user.dto;

import com.redpulse.enums.AvailabilityStatus;
import jakarta.validation.constraints.NotNull;

public class AvailabilityUpdateRequest {

    @NotNull(message = "Availability status is required")
    private AvailabilityStatus availabilityStatus;

    public AvailabilityUpdateRequest() {
    }

    public AvailabilityStatus getAvailabilityStatus() {
        return availabilityStatus;
    }

    public void setAvailabilityStatus(
            AvailabilityStatus availabilityStatus
    ) {
        this.availabilityStatus = availabilityStatus;
    }
}

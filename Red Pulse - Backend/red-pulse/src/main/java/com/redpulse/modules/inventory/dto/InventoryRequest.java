package com.redpulse.modules.inventory.dto;

import com.redpulse.enums.BloodGroup;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public class InventoryRequest {

    @NotNull(message = "Blood group is required")
    private BloodGroup bloodGroup;

    @NotNull(message = "Quantity units is required")
    @Min(value = 0, message = "Quantity units cannot be negative")
    private Integer quantityUnits;

    public InventoryRequest() {}

    public BloodGroup getBloodGroup() { return bloodGroup; }
    public void setBloodGroup(BloodGroup bloodGroup) { this.bloodGroup = bloodGroup; }

    public Integer getQuantityUnits() { return quantityUnits; }
    public void setQuantityUnits(Integer quantityUnits) { this.quantityUnits = quantityUnits; }

    public Integer getAvailableUnits() { return quantityUnits; }
    public void setAvailableUnits(Integer availableUnits) {
        if (this.quantityUnits == null) {
            this.quantityUnits = availableUnits;
        }
    }
}

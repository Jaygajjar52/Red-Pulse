package com.redpulse.modules.inventory.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public class StockUpdateRequest {

    @NotNull(message = "Units value is required")
    @Min(value = 0, message = "Units must be greater than or equal to 0")
    private Integer units;

    private String action = "SET";

    public StockUpdateRequest() {}

    public Integer getUnits() { return units; }
    public void setUnits(Integer units) { this.units = units; }

    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }

    public Integer getAvailableUnits() { return units; }
    public void setAvailableUnits(Integer availableUnits) {
        if (this.units == null) {
            this.units = availableUnits;
        }
    }
}

package com.redpulse.modules.inventory.dto;

import com.redpulse.enums.BloodGroup;
import com.redpulse.modules.inventory.entity.BloodInventory;
import java.time.LocalDateTime;
import java.util.UUID;

public class InventoryResponse {

    private UUID id;
    private UUID hospitalId;
    private String hospitalName;
    private BloodGroup bloodGroup;
    private int quantityUnits;
    private String stockStatus;
    private LocalDateTime lastUpdated;

    public InventoryResponse() {}

    public static InventoryResponse fromEntity(BloodInventory entity) {
        InventoryResponse resp = new InventoryResponse();
        resp.id = entity.getId();
        resp.hospitalId = entity.getHospital().getId();
        resp.hospitalName = entity.getHospital().getHospitalName();
        resp.bloodGroup = entity.getBloodGroup();
        resp.quantityUnits = entity.getQuantityUnits();
        resp.lastUpdated = entity.getLastUpdated();

        if (entity.getQuantityUnits() == 0) {
            resp.stockStatus = "CRITICAL";
        } else if (entity.getQuantityUnits() <= 5) {
            resp.stockStatus = "LOW";
        } else {
            resp.stockStatus = "ADEQUATE";
        }

        return resp;
    }

    public UUID getId() { return id; }
    public UUID getHospitalId() { return hospitalId; }
    public String getHospitalName() { return hospitalName; }
    public BloodGroup getBloodGroup() { return bloodGroup; }
    public int getQuantityUnits() { return quantityUnits; }
    public String getStockStatus() { return stockStatus; }
    public LocalDateTime getLastUpdated() { return lastUpdated; }
}

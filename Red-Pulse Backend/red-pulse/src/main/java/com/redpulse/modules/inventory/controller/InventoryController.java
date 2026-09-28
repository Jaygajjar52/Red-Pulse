package com.redpulse.modules.inventory.controller;

import com.redpulse.enums.BloodGroup;
import com.redpulse.modules.inventory.dto.InventoryRequest;
import com.redpulse.modules.inventory.dto.InventoryResponse;
import com.redpulse.modules.inventory.dto.StockUpdateRequest;
import com.redpulse.modules.inventory.service.InventoryService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/hospitals/{hospitalId}/inventory")
public class InventoryController {

    private final InventoryService inventoryService;

    public InventoryController(InventoryService inventoryService) {
        this.inventoryService = inventoryService;
    }

    @GetMapping
    public ResponseEntity<List<InventoryResponse>> getInventory(@PathVariable UUID hospitalId) {
        List<InventoryResponse> response = inventoryService.getHospitalInventory(hospitalId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{bloodGroup}")
    public ResponseEntity<InventoryResponse> getInventoryByBloodGroup(
            @PathVariable UUID hospitalId,
            @PathVariable BloodGroup bloodGroup
    ) {
        InventoryResponse response = inventoryService.getInventoryByBloodGroup(hospitalId, bloodGroup);
        return ResponseEntity.ok(response);
    }

    @PostMapping
    public ResponseEntity<InventoryResponse> addInventory(
            @PathVariable UUID hospitalId,
            @Valid @RequestBody InventoryRequest request
    ) {
        InventoryResponse response = inventoryService.addOrInitializeInventory(hospitalId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{inventoryId}")
    public ResponseEntity<InventoryResponse> updateInventory(
            @PathVariable UUID hospitalId,
            @PathVariable UUID inventoryId,
            @Valid @RequestBody InventoryRequest request
    ) {
        InventoryResponse response = inventoryService.updateInventory(hospitalId, inventoryId, request);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{inventoryId}/stock")
    public ResponseEntity<InventoryResponse> updateStock(
            @PathVariable UUID hospitalId,
            @PathVariable UUID inventoryId,
            @Valid @RequestBody StockUpdateRequest request
    ) {
        InventoryResponse response = inventoryService.updateStock(hospitalId, inventoryId, request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/low-stock")
    public ResponseEntity<List<InventoryResponse>> getLowStock(
            @PathVariable UUID hospitalId,
            @RequestParam(required = false, defaultValue = "5") Integer threshold
    ) {
        List<InventoryResponse> response = inventoryService.getLowStockItems(hospitalId, threshold);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/expiring")
    public ResponseEntity<List<Object>> getExpiringUnits(@PathVariable UUID hospitalId) {
        List<Object> response = inventoryService.getExpiringUnits(hospitalId);
        return ResponseEntity.ok(response);
    }
}

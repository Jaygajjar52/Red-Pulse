package com.redpulse.modules.inventory.service;

import com.redpulse.common.exception.BadRequestException;
import com.redpulse.common.exception.InsufficientStockException;
import com.redpulse.common.exception.ResourceNotFoundException;
import com.redpulse.enums.BloodGroup;
import com.redpulse.modules.hospital.entity.Hospital;
import com.redpulse.modules.hospital.repository.HospitalRepository;
import com.redpulse.modules.inventory.dto.InventoryRequest;
import com.redpulse.modules.inventory.dto.InventoryResponse;
import com.redpulse.modules.inventory.dto.StockUpdateRequest;
import com.redpulse.modules.inventory.entity.BloodInventory;
import com.redpulse.modules.inventory.repository.BloodInventoryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class InventoryService {

    private final BloodInventoryRepository inventoryRepository;
    private final HospitalRepository hospitalRepository;

    public InventoryService(BloodInventoryRepository inventoryRepository, HospitalRepository hospitalRepository) {
        this.inventoryRepository = inventoryRepository;
        this.hospitalRepository = hospitalRepository;
    }

    @Transactional(readOnly = true)
    public List<InventoryResponse> getHospitalInventory(UUID hospitalId) {
        validateHospital(hospitalId);
        return inventoryRepository.findByHospitalId(hospitalId)
                .stream()
                .map(InventoryResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public InventoryResponse getInventoryByBloodGroup(UUID hospitalId, BloodGroup bloodGroup) {
        validateHospital(hospitalId);
        BloodInventory inventory = inventoryRepository.findByHospitalIdAndBloodGroup(hospitalId, bloodGroup)
                .orElseThrow(() -> new ResourceNotFoundException("No inventory entry found for " + bloodGroup));
        return InventoryResponse.fromEntity(inventory);
    }

    @Transactional
    public InventoryResponse addOrInitializeInventory(UUID hospitalId, InventoryRequest request) {
        Hospital hospital = validateHospital(hospitalId);

        Optional<BloodInventory> existingOpt = inventoryRepository.findByHospitalIdAndBloodGroup(hospitalId, request.getBloodGroup());
        BloodInventory inventory;

        if (existingOpt.isPresent()) {
            inventory = existingOpt.get();
            inventory.setQuantityUnits(inventory.getQuantityUnits() + request.getQuantityUnits());
        } else {
            inventory = new BloodInventory(hospital, request.getBloodGroup(), request.getQuantityUnits());
        }

        return InventoryResponse.fromEntity(inventoryRepository.save(inventory));
    }

    @Transactional
    public InventoryResponse updateInventory(UUID hospitalId, UUID inventoryId, InventoryRequest request) {
        validateHospital(hospitalId);
        BloodInventory inventory = inventoryRepository.findById(inventoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Inventory item not found"));

        if (!inventory.getHospital().getId().equals(hospitalId)) {
            throw new BadRequestException("Inventory does not belong to the specified hospital");
        }

        inventory.setBloodGroup(request.getBloodGroup());
        inventory.setQuantityUnits(request.getQuantityUnits());
        return InventoryResponse.fromEntity(inventoryRepository.save(inventory));
    }

    @Transactional
    public InventoryResponse updateStock(UUID hospitalId, UUID inventoryId, StockUpdateRequest request) {
        validateHospital(hospitalId);
        BloodInventory inventory = inventoryRepository.findById(inventoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Inventory item not found"));

        if (!inventory.getHospital().getId().equals(hospitalId)) {
            throw new BadRequestException("Inventory does not belong to the specified hospital");
        }

        String action = request.getAction() != null ? request.getAction().toUpperCase() : "SET";
        int current = inventory.getQuantityUnits();
        int delta = request.getUnits();

        switch (action) {
            case "ADD" -> inventory.setQuantityUnits(current + delta);
            case "DEDUCT" -> {
                if (current < delta) {
                    throw new InsufficientStockException("Cannot deduct " + delta + " units. Current available stock: " + current);
                }
                inventory.setQuantityUnits(current - delta);
            }
            default -> inventory.setQuantityUnits(delta);
        }

        return InventoryResponse.fromEntity(inventoryRepository.save(inventory));
    }

    @Transactional(readOnly = true)
    public List<InventoryResponse> getLowStockItems(UUID hospitalId, Integer threshold) {
        validateHospital(hospitalId);
        int limit = (threshold != null && threshold >= 0) ? threshold : 5;
        return inventoryRepository.findByHospitalIdAndQuantityUnitsLessThanEqual(hospitalId, limit)
                .stream()
                .map(InventoryResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<Object> getExpiringUnits(UUID hospitalId) {
        validateHospital(hospitalId);
        return Collections.emptyList();
    }

    @Transactional(readOnly = true)
    public boolean checkAvailability(UUID hospitalId, BloodGroup bloodGroup, int requiredUnits) {
        return inventoryRepository.findByHospitalIdAndBloodGroup(hospitalId, bloodGroup)
                .map(inv -> inv.getQuantityUnits() >= requiredUnits)
                .orElse(false);
    }

    private Hospital validateHospital(UUID hospitalId) {
        return hospitalRepository.findById(hospitalId)
                .orElseThrow(() -> new ResourceNotFoundException("Hospital not found with ID: " + hospitalId));
    }
}

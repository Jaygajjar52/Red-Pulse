package com.redpulse.modules.inventory.repository;

import com.redpulse.enums.BloodGroup;
import com.redpulse.modules.inventory.entity.BloodInventory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BloodInventoryRepository extends JpaRepository<BloodInventory, UUID> {

    List<BloodInventory> findByHospitalId(UUID hospitalId);

    Optional<BloodInventory> findByHospitalIdAndBloodGroup(UUID hospitalId, BloodGroup bloodGroup);

    List<BloodInventory> findByHospitalIdAndQuantityUnitsLessThanEqual(UUID hospitalId, int threshold);
}

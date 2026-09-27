package com.redpulse.modules.inventory.entity;

import com.redpulse.enums.BloodGroup;
import com.redpulse.modules.hospital.entity.Hospital;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(
        name = "blood_inventory",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"hospital_id", "blood_group"})
        }
)
public class BloodInventory {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hospital_id", nullable = false)
    private Hospital hospital;

    @Enumerated(EnumType.STRING)
    @Column(name = "blood_group", nullable = false, length = 20)
    private BloodGroup bloodGroup;

    @Column(name = "quantity_units", nullable = false)
    private int quantityUnits = 0;

    @Column(name = "last_updated", nullable = false)
    private LocalDateTime lastUpdated;

    public BloodInventory() {

    }

    public BloodInventory(Hospital hospital, BloodGroup bloodGroup, int quantityUnits) {
        this.hospital = hospital;
        this.bloodGroup = bloodGroup;
        this.quantityUnits = Math.max(0, quantityUnits);
    }

    @PrePersist
    @PreUpdate
    protected void onUpdate() {
        this.lastUpdated = LocalDateTime.now();
    }

    public UUID getId() { return id; }

    public Hospital getHospital() { return hospital; }
    public void setHospital(Hospital hospital) { this.hospital = hospital; }

    public BloodGroup getBloodGroup() { return bloodGroup; }
    public void setBloodGroup(BloodGroup bloodGroup) { this.bloodGroup = bloodGroup; }

    public int getQuantityUnits() { return quantityUnits; }
    public void setQuantityUnits(int quantityUnits) {
        if (quantityUnits < 0) {
            throw new IllegalArgumentException("Quantity units cannot be negative");
        }
        this.quantityUnits = quantityUnits;
    }

    public LocalDateTime getLastUpdated() { return lastUpdated; }
}

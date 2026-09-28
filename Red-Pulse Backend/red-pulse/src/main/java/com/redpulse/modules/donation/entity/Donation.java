package com.redpulse.modules.donation.entity;

import com.redpulse.enums.BloodGroup;
import com.redpulse.enums.DonationStatus;
import com.redpulse.modules.appointment.entity.Appointment;
import com.redpulse.modules.hospital.entity.Hospital;
import com.redpulse.modules.user.entity.User;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "donations")
public class Donation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "donor_id", nullable = false)
    private User donor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hospital_id", nullable = false)
    private Hospital hospital;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "appointment_id")
    private Appointment appointment;

    @Enumerated(EnumType.STRING)
    @Column(name = "blood_group", nullable = false, length = 20)
    private BloodGroup bloodGroup;

    @Column(name = "donation_date", nullable = false)
    private LocalDate donationDate;

    @Column(name = "quantity_units", nullable = false)
    private int quantityUnits = 1;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private DonationStatus status = DonationStatus.SCHEDULED;

    @Column(name = "notes", length = 1000)
    private String notes;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public Donation() {}

    public Donation(User donor, Hospital hospital, Appointment appointment,
                    BloodGroup bloodGroup, LocalDate donationDate, int quantityUnits, String notes) {
        this.donor = donor;
        this.hospital = hospital;
        this.appointment = appointment;
        this.bloodGroup = bloodGroup;
        this.donationDate = donationDate;
        this.quantityUnits = Math.max(1, quantityUnits);
        this.status = DonationStatus.SCHEDULED;
        this.notes = notes;
    }

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public UUID getId() { return id; }
    public User getDonor() { return donor; }
    public void setDonor(User donor) { this.donor = donor; }
    public Hospital getHospital() { return hospital; }
    public void setHospital(Hospital hospital) { this.hospital = hospital; }
    public Appointment getAppointment() { return appointment; }
    public void setAppointment(Appointment appointment) { this.appointment = appointment; }
    public BloodGroup getBloodGroup() { return bloodGroup; }
    public void setBloodGroup(BloodGroup bloodGroup) { this.bloodGroup = bloodGroup; }
    public LocalDate getDonationDate() { return donationDate; }
    public void setDonationDate(LocalDate donationDate) { this.donationDate = donationDate; }
    public int getQuantityUnits() { return quantityUnits; }
    public void setQuantityUnits(int quantityUnits) { this.quantityUnits = quantityUnits; }
    public DonationStatus getStatus() { return status; }
    public void setStatus(DonationStatus status) { this.status = status; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}

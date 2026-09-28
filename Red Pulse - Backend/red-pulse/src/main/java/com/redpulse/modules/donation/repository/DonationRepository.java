package com.redpulse.modules.donation.repository;

import com.redpulse.modules.donation.entity.Donation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DonationRepository extends JpaRepository<Donation, UUID> {

    List<Donation> findByDonorIdOrderByDonationDateDesc(UUID donorId);

    List<Donation> findByHospitalIdOrderByDonationDateDesc(UUID hospitalId);
}

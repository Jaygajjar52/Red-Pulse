package com.redpulse.modules.hospital.repository;

import com.redpulse.modules.hospital.entity.Hospital;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface HospitalRepository extends JpaRepository<Hospital, UUID> {

    Optional<Hospital> findByRegistrationNumber(String registrationNumber);

    Optional<Hospital> findByUserId(UUID userId);

    List<Hospital> findByCityIgnoreCaseAndActiveTrue(String city);

    List<Hospital> findByActiveTrue();
}

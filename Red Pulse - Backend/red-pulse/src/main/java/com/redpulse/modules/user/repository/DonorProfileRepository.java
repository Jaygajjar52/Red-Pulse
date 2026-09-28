package com.redpulse.modules.user.repository;

import com.redpulse.modules.user.entity.DonorProfile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface DonorProfileRepository extends JpaRepository<DonorProfile, UUID> {

    Optional<DonorProfile> findByUserId(UUID userId);

    boolean existsByUserId(UUID userId);
}

package com.redpulse.modules.request.repository;

import com.redpulse.enums.EmergencyStatus;
import com.redpulse.modules.request.entity.EmergencyRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EmergencyRequestRepository extends JpaRepository<EmergencyRequest, UUID> {

    Optional<EmergencyRequest> findByBloodRequestId(UUID bloodRequestId);

    List<EmergencyRequest> findByStatus(EmergencyStatus status);
}

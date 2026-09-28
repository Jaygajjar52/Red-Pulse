package com.redpulse.modules.request.repository;

import com.redpulse.enums.BloodGroup;
import com.redpulse.enums.BloodRequestStatus;
import com.redpulse.enums.Urgency;
import com.redpulse.modules.request.entity.BloodRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface BloodRequestRepository extends JpaRepository<BloodRequest, UUID> {

    List<BloodRequest> findByRequesterIdOrderByCreatedAtDesc(UUID requesterId);

    List<BloodRequest> findByHospitalIdOrderByCreatedAtDesc(UUID hospitalId);

    List<BloodRequest> findByUrgencyOrderByCreatedAtDesc(Urgency urgency);

    List<BloodRequest> findByStatusOrderByCreatedAtDesc(BloodRequestStatus status);

    List<BloodRequest> findByCityIgnoreCaseAndStatus(String city, BloodRequestStatus status);

    List<BloodRequest> findByBloodGroupAndStatus(BloodGroup bloodGroup, BloodRequestStatus status);
}

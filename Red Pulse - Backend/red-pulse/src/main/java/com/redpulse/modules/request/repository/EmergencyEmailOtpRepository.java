package com.redpulse.modules.request.repository;

import com.redpulse.modules.request.entity.EmergencyEmailOtp;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

public interface EmergencyEmailOtpRepository extends JpaRepository<EmergencyEmailOtp, UUID> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<EmergencyEmailOtp> findTopByEmailAndPhoneNumberAndUsedFalseOrderByCreatedAtDesc(String email, String phoneNumber);
    long countByEmailAndCreatedAtAfter(String email, LocalDateTime since);
    long countByIpAddressAndCreatedAtAfter(String ipAddress, LocalDateTime since);
}

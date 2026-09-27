package com.redpulse.modules.request.repository;

import com.redpulse.modules.request.entity.EmergencyVerification;
import org.springframework.data.jpa.repository.*;
import java.util.UUID;

public interface EmergencyVerificationRepository extends JpaRepository<EmergencyVerification, UUID> {
}

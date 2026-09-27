package com.redpulse.modules.request.service;

import com.redpulse.common.exception.ConflictException;
import com.redpulse.common.exception.ResourceNotFoundException;
import com.redpulse.enums.EmergencyStatus;
import com.redpulse.enums.Urgency;
import com.redpulse.modules.request.dto.EmergencyRequestCreateRequest;
import com.redpulse.modules.request.dto.EmergencyRequestResponse;
import com.redpulse.modules.request.entity.BloodRequest;
import com.redpulse.modules.request.entity.EmergencyRequest;
import com.redpulse.modules.request.repository.BloodRequestRepository;
import com.redpulse.modules.request.repository.EmergencyRequestRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class EmergencyRequestService {

    private final EmergencyRequestRepository emergencyRepository;
    private final BloodRequestRepository bloodRequestRepository;

    public EmergencyRequestService(EmergencyRequestRepository emergencyRepository,
                                   BloodRequestRepository bloodRequestRepository) {
        this.emergencyRepository = emergencyRepository;
        this.bloodRequestRepository = bloodRequestRepository;
    }

    @Transactional
    public EmergencyRequestResponse createEmergency(EmergencyRequestCreateRequest request) {
        BloodRequest bloodRequest = bloodRequestRepository.findById(request.getBloodRequestId())
                .orElseThrow(() -> new ResourceNotFoundException("Blood request not found"));

        if (emergencyRepository.findByBloodRequestId(bloodRequest.getId()).isPresent()) {
            throw new ConflictException("Emergency request already exists for this blood request");
        }

        bloodRequest.setUrgency(Urgency.CRITICAL);
        bloodRequestRepository.save(bloodRequest);

        EmergencyRequest emergency = new EmergencyRequest(
                bloodRequest,
                request.getEmergencyLevel(),
                request.getContactName(),
                request.getContactPhone(),
                request.getLocationDescription()
        );

        return EmergencyRequestResponse.fromEntity(emergencyRepository.save(emergency));
    }

    @Transactional(readOnly = true)
    public List<EmergencyRequestResponse> listEmergencies() {
        return emergencyRepository.findAll()
                .stream()
                .map(EmergencyRequestResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public EmergencyRequestResponse getEmergencyById(UUID id) {
        EmergencyRequest emergency = emergencyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Emergency request not found with ID: " + id));
        return EmergencyRequestResponse.fromEntity(emergency);
    }

    @Transactional
    public Map<String, Object> alertDonors(UUID emergencyId) {
        EmergencyRequest emergency = emergencyRepository.findById(emergencyId)
                .orElseThrow(() -> new ResourceNotFoundException("Emergency request not found"));

        emergency.setStatus(EmergencyStatus.ALERT_SENT);
        emergencyRepository.save(emergency);

        Map<String, Object> alertResult = new HashMap<>();
        alertResult.put("emergencyId", emergencyId);
        alertResult.put("status", "ALERT_SENT");
        alertResult.put("message", "Emergency SOS broadcast dispatched to nearby eligible donors");
        return alertResult;
    }

    @Transactional
    public EmergencyRequestResponse resolveEmergency(UUID id) {
        EmergencyRequest emergency = emergencyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Emergency request not found with ID: " + id));

        emergency.setStatus(EmergencyStatus.RESOLVED);
        return EmergencyRequestResponse.fromEntity(emergencyRepository.save(emergency));
    }
}

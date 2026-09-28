package com.redpulse.modules.request.service;

import com.redpulse.common.exception.ResourceNotFoundException;
import com.redpulse.enums.BloodGroup;
import com.redpulse.enums.BloodRequestStatus;
import com.redpulse.enums.Urgency;
import com.redpulse.modules.hospital.entity.Hospital;
import com.redpulse.modules.hospital.repository.HospitalRepository;
import com.redpulse.modules.request.dto.BloodRequestCreateRequest;
import com.redpulse.modules.request.dto.BloodRequestResponse;
import com.redpulse.modules.request.entity.BloodRequest;
import com.redpulse.modules.request.repository.BloodRequestRepository;
import com.redpulse.modules.user.entity.User;
import com.redpulse.modules.user.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class BloodRequestService {

    private final BloodRequestRepository bloodRequestRepository;
    private final UserRepository userRepository;
    private final HospitalRepository hospitalRepository;

    public BloodRequestService(BloodRequestRepository bloodRequestRepository,
                               UserRepository userRepository,
                               HospitalRepository hospitalRepository) {
        this.bloodRequestRepository = bloodRequestRepository;
        this.userRepository = userRepository;
        this.hospitalRepository = hospitalRepository;
    }

    @Transactional
    public BloodRequestResponse createRequest(UUID requesterId, BloodRequestCreateRequest request) {
        User requester = userRepository.findById(requesterId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Hospital hospital = null;
        if (request.getHospitalId() != null) {
            hospital = hospitalRepository.findById(request.getHospitalId()).orElse(null);
        }

        BloodRequest bloodRequest = new BloodRequest(
                requester,
                hospital,
                request.getBloodGroup(),
                request.getUnitsRequired(),
                request.getUrgency(),
                request.getRequiredBy(),
                request.getCity(),
                request.getState(),
                request.getAdditionalNotes()
        );

        return BloodRequestResponse.fromEntity(bloodRequestRepository.save(bloodRequest));
    }

    @Transactional(readOnly = true)
    public List<BloodRequestResponse> getAllRequests(String city, BloodGroup bloodGroup, BloodRequestStatus status) {
        List<BloodRequest> list;
        if (city != null && !city.trim().isEmpty()) {
            list = bloodRequestRepository.findByCityIgnoreCaseAndStatus(city.trim(), status != null ? status : BloodRequestStatus.PENDING);
        } else if (bloodGroup != null) {
            list = bloodRequestRepository.findByBloodGroupAndStatus(bloodGroup, status != null ? status : BloodRequestStatus.PENDING);
        } else if (status != null) {
            list = bloodRequestRepository.findByStatusOrderByCreatedAtDesc(status);
        } else {
            list = bloodRequestRepository.findAll();
        }

        return list.stream().map(BloodRequestResponse::fromEntity).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public BloodRequestResponse getRequestById(UUID id) {
        BloodRequest req = bloodRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Blood request not found with ID: " + id));
        return BloodRequestResponse.fromEntity(req);
    }

    @Transactional
    public BloodRequestResponse updateRequest(UUID id, BloodRequestCreateRequest request) {
        BloodRequest req = bloodRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Blood request not found with ID: " + id));

        req.setBloodGroup(request.getBloodGroup());
        req.setUnitsRequired(request.getUnitsRequired());
        req.setUrgency(request.getUrgency());
        req.setRequiredBy(request.getRequiredBy());
        req.setCity(request.getCity());
        req.setState(request.getState());
        req.setAdditionalNotes(request.getAdditionalNotes());

        return BloodRequestResponse.fromEntity(bloodRequestRepository.save(req));
    }

    @Transactional
    public BloodRequestResponse cancelRequest(UUID id) {
        BloodRequest req = bloodRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Blood request not found with ID: " + id));
        req.setStatus(BloodRequestStatus.CANCELLED);
        return BloodRequestResponse.fromEntity(bloodRequestRepository.save(req));
    }

    @Transactional
    public BloodRequestResponse fulfillRequest(UUID id) {
        BloodRequest req = bloodRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Blood request not found with ID: " + id));
        req.setStatus(BloodRequestStatus.FULFILLED);
        return BloodRequestResponse.fromEntity(bloodRequestRepository.save(req));
    }

    @Transactional(readOnly = true)
    public List<BloodRequestResponse> getMyRequests(UUID requesterId) {
        return bloodRequestRepository.findByRequesterIdOrderByCreatedAtDesc(requesterId)
                .stream()
                .map(BloodRequestResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<BloodRequestResponse> getEmergencyRequests() {
        return bloodRequestRepository.findByUrgencyOrderByCreatedAtDesc(Urgency.CRITICAL)
                .stream()
                .map(BloodRequestResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<BloodRequestResponse> getRequestsByHospital(UUID hospitalId) {
        return bloodRequestRepository.findByHospitalIdOrderByCreatedAtDesc(hospitalId)
                .stream()
                .map(BloodRequestResponse::fromEntity)
                .collect(Collectors.toList());
    }
}

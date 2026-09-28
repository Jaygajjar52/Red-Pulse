package com.redpulse.modules.hospital.service;

import com.redpulse.common.exception.ConflictException;
import com.redpulse.common.exception.ResourceNotFoundException;
import com.redpulse.modules.hospital.dto.HospitalRequest;
import com.redpulse.modules.hospital.dto.HospitalResponse;
import com.redpulse.modules.hospital.entity.Hospital;
import com.redpulse.modules.hospital.repository.HospitalRepository;
import com.redpulse.modules.user.entity.User;
import com.redpulse.modules.user.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class HospitalService {

    private final HospitalRepository hospitalRepository;
    private final UserRepository userRepository;

    public HospitalService(HospitalRepository hospitalRepository, UserRepository userRepository) {
        this.hospitalRepository = hospitalRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public HospitalResponse createHospital(UUID userId, HospitalRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (request.getRegistrationNumber() != null &&
                hospitalRepository.findByRegistrationNumber(request.getRegistrationNumber()).isPresent()) {
            throw new ConflictException("Hospital with registration number already exists");
        }

        Hospital hospital = new Hospital(
                request.getHospitalName(),
                request.getRegistrationNumber(),
                request.getPhone(),
                request.getEmail(),
                request.getAddress(),
                request.getCity(),
                request.getState(),
                request.getLatitude(),
                request.getLongitude(),
                user
        );

        Hospital saved = hospitalRepository.save(hospital);
        return HospitalResponse.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public HospitalResponse getHospitalById(UUID id) {
        Hospital hospital = hospitalRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Hospital not found with ID: " + id));
        return HospitalResponse.fromEntity(hospital);
    }

    @Transactional(readOnly = true)
    public List<HospitalResponse> getAllHospitals(String city) {
        List<Hospital> hospitals;
        if (city != null && !city.trim().isEmpty()) {
            hospitals = hospitalRepository.findByCityIgnoreCaseAndActiveTrue(city.trim());
        } else {
            hospitals = hospitalRepository.findByActiveTrue();
        }
        return hospitals.stream()
                .map(HospitalResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public HospitalResponse updateHospital(UUID id, HospitalRequest request) {
        Hospital hospital = hospitalRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Hospital not found with ID: " + id));

        hospital.setHospitalName(request.getHospitalName());
        hospital.setPhone(request.getPhone());
        hospital.setEmail(request.getEmail());
        hospital.setAddress(request.getAddress());
        hospital.setCity(request.getCity());
        hospital.setState(request.getState());
        hospital.setLatitude(request.getLatitude());
        hospital.setLongitude(request.getLongitude());

        return HospitalResponse.fromEntity(hospitalRepository.save(hospital));
    }

    @Transactional
    public void deleteHospital(UUID id) {
        Hospital hospital = hospitalRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Hospital not found with ID: " + id));
        hospital.setActive(false);
        hospitalRepository.save(hospital);
    }

    @Transactional(readOnly = true)
    public HospitalResponse getHospitalByUserId(UUID userId) {
        Hospital hospital = hospitalRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Hospital profile not found for current user"));
        return HospitalResponse.fromEntity(hospital);
    }
}

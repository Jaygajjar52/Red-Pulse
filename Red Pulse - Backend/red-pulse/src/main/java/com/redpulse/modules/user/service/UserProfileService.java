package com.redpulse.modules.user.service;

import com.redpulse.common.exception.ResourceNotFoundException;
import com.redpulse.common.phone.IndianPhoneNumber;
import com.redpulse.enums.AvailabilityStatus;
import com.redpulse.modules.user.dto.AvailabilityUpdateRequest;
import com.redpulse.modules.user.dto.DonorEligibilityResponse;
import com.redpulse.modules.user.dto.DonorProfileRequest;
import com.redpulse.modules.user.dto.DonorProfileResponse;
import com.redpulse.modules.user.dto.UpdateUserRequest;
import com.redpulse.modules.user.dto.UserResponse;
import com.redpulse.modules.user.entity.DonorProfile;
import com.redpulse.modules.user.entity.User;
import com.redpulse.modules.user.repository.DonorProfileRepository;
import com.redpulse.modules.user.repository.UserRepository;
import com.redpulse.enums.Role;
import com.redpulse.modules.hospital.repository.HospitalRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.Period;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Service
public class UserProfileService {

    private final UserRepository userRepository;
    private final DonorProfileRepository donorProfileRepository;
    private final HospitalRepository hospitalRepository;

    public UserProfileService(
            UserRepository userRepository,
            DonorProfileRepository donorProfileRepository,
            HospitalRepository hospitalRepository
    ) {
        this.userRepository = userRepository;
        this.donorProfileRepository = donorProfileRepository;
        this.hospitalRepository = hospitalRepository;
    }

    @Transactional(readOnly = true)
    public UserResponse getCurrentUserProfile(UUID userId) {

        User user = userRepository.findById(userId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "User not found with id: " + userId
                        )
                );

        UserResponse response = UserResponse.fromEntity(user);
        if (user.getRole() == Role.HOSPITAL) {
            hospitalRepository.findByUserId(userId)
                    .ifPresent(h -> response.setHospitalId(h.getId()));
        } else if (user.getRole() == Role.DONOR) {
            donorProfileRepository.findByUserId(userId)
                    .ifPresent(d -> response.setDonorId(d.getId()));
        }
        return response;
    }

    @Transactional
    public UserResponse updateUserProfile(
            UUID userId,
            UpdateUserRequest request
    ) {

        User user = userRepository.findById(userId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "User not found with id: " + userId
                        )
                );

        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        if (request.getPhoneNumber() != null && !request.getPhoneNumber().isBlank()) {
            user.setPhone(IndianPhoneNumber.normalize(request.getPhoneNumber()));
        }

        User updatedUser = userRepository.save(user);

        return UserResponse.fromEntity(updatedUser);
    }

    @Transactional
    public DonorProfileResponse createOrUpdateDonorProfile(
            UUID userId,
            DonorProfileRequest request
    ) {

        User user = userRepository.findById(userId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "User not found with id: " + userId
                        )
                );

        DonorProfile profile =
                donorProfileRepository.findByUserId(userId)
                        .orElseGet(() -> new DonorProfile(user));

        profile.setBloodGroup(request.getBloodGroup());
        profile.setDateOfBirth(request.getDateOfBirth());
        profile.setGender(request.getGender());
        profile.setWeight(request.getWeight());
        profile.setCity(request.getCity());
        profile.setState(request.getState());
        profile.setLatitude(request.getLatitude());
        profile.setLongitude(request.getLongitude());

        if (profile.getAvailabilityStatus() == null) {
            profile.setAvailabilityStatus(
                    AvailabilityStatus.UNAVAILABLE
            );
        }

        DonorProfile savedProfile =
                donorProfileRepository.save(profile);

        EligibilityResult eligibility =
                calculateEligibility(savedProfile);

        return DonorProfileResponse.fromEntity(
                savedProfile,
                eligibility.isEligible(),
                eligibility.reason(),
                eligibility.daysRemaining()
        );
    }

    @Transactional(readOnly = true)
    public DonorProfileResponse getDonorProfile(UUID userId) {

        DonorProfile profile =
                donorProfileRepository.findByUserId(userId)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Donor profile not created yet"
                                )
                        );

        EligibilityResult eligibility =
                calculateEligibility(profile);

        return DonorProfileResponse.fromEntity(
                profile,
                eligibility.isEligible(),
                eligibility.reason(),
                eligibility.daysRemaining()
        );
    }

    @Transactional
    public DonorProfileResponse updateAvailability(
            UUID userId,
            AvailabilityUpdateRequest request
    ) {

        DonorProfile profile =
                donorProfileRepository.findByUserId(userId)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Donor profile not created yet"
                                )
                        );

        profile.setAvailabilityStatus(
                request.getAvailabilityStatus()
        );

        DonorProfile updatedProfile =
                donorProfileRepository.save(profile);

        EligibilityResult eligibility =
                calculateEligibility(updatedProfile);

        return DonorProfileResponse.fromEntity(
                updatedProfile,
                eligibility.isEligible(),
                eligibility.reason(),
                eligibility.daysRemaining()
        );
    }

    @Transactional(readOnly = true)
    public DonorEligibilityResponse checkEligibility(UUID userId) {

        DonorProfile profile =
                donorProfileRepository.findByUserId(userId)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Donor profile not created yet"
                                )
                        );

        EligibilityResult result =
                calculateEligibility(profile);

        return new DonorEligibilityResponse(
                result.isEligible(),
                result.reason(),
                result.daysRemaining(),
                result.nextEligibleDate()
        );
    }

    @Transactional(readOnly = true)
    public DonorProfileResponse getDonorById(UUID donorId) {
        DonorProfile profile = donorProfileRepository.findById(donorId)
                .orElseThrow(() -> new ResourceNotFoundException("Donor profile not found with ID: " + donorId));

        EligibilityResult eligibility = calculateEligibility(profile);

        return DonorProfileResponse.fromEntity(
                profile,
                eligibility.isEligible(),
                eligibility.reason(),
                eligibility.daysRemaining()
        );
    }

    private EligibilityResult calculateEligibility(
            DonorProfile profile
    ) {

        LocalDate today = LocalDate.now();

        if (profile.getDateOfBirth() == null) {

            return new EligibilityResult(
                    false,
                    "Date of birth is required",
                    0L,
                    null
            );
        }

        int age = Period.between(
                profile.getDateOfBirth(),
                today
        ).getYears();

        if (age < 18 || age > 65) {

            return new EligibilityResult(
                    false,
                    "Age must be between 18 and 65 years",
                    0L,
                    null
            );
        }

        if (profile.getWeight() == null
                || profile.getWeight().compareTo(new BigDecimal("50.0")) < 0) {

            return new EligibilityResult(
                    false,
                    "Weight must be at least 50 kg",
                    0L,
                    null
            );
        }

        if (profile.getLastDonationDate() != null) {

            long daysPassed =
                    ChronoUnit.DAYS.between(
                            profile.getLastDonationDate(),
                            today
                    );

            if (daysPassed < 90) {

                long daysRemaining =
                        90 - daysPassed;

                LocalDate nextEligibleDate =
                        profile.getLastDonationDate()
                                .plusDays(90);

                return new EligibilityResult(
                        false,
                        "Cooldown period active",
                        daysRemaining,
                        nextEligibleDate
                );
            }
        }

        return new EligibilityResult(
                true,
                "Eligible to donate",
                0L,
                null
        );
    }

    private record EligibilityResult(
            boolean isEligible,
            String reason,
            long daysRemaining,
            LocalDate nextEligibleDate
    ) {
    }
}

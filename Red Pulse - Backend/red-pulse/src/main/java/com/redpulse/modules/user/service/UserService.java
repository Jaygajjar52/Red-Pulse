package com.redpulse.modules.user.service;

import com.redpulse.enums.AvailabilityStatus;
import com.redpulse.enums.Role;
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
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import com.redpulse.common.exception.ResourceNotFoundException;
import com.redpulse.common.phone.IndianPhoneNumber;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Service
@Transactional
public class UserService {

    private final UserRepository userRepository;
    private final DonorProfileRepository donorProfileRepository;

    public UserService(
            UserRepository userRepository,
            DonorProfileRepository donorProfileRepository
    ) {
        this.userRepository = userRepository;
        this.donorProfileRepository = donorProfileRepository;
    }

    @Transactional(readOnly = true)
    public UserResponse getCurrentUser(String email) {

        User user = getUserByEmail(email);

        return UserResponse.fromEntity(user);
    }

    public UserResponse updateCurrentUser(
            String email,
            UpdateUserRequest request
    ) {

        User user = getUserByEmail(email);

        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        if (request.getPhoneNumber() != null && !request.getPhoneNumber().isBlank()) {
            user.setPhone(IndianPhoneNumber.normalize(request.getPhoneNumber()));
        }

        User updatedUser = userRepository.save(user);

        return UserResponse.fromEntity(updatedUser);
    }

    public DonorProfileResponse createDonorProfile(
            String email,
            DonorProfileRequest request
    ) {

        User user = getUserByEmail(email);

        if (user.getRole() != Role.DONOR) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Only donor users can create a donor profile"
            );
        }

        if (donorProfileRepository.existsByUserId(user.getId())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Donor profile already exists"
            );
        }

        DonorProfile profile = new DonorProfile(user);

        profile.setBloodGroup(request.getBloodGroup());
        profile.setDateOfBirth(request.getDateOfBirth());
        profile.setGender(request.getGender());
        profile.setWeight(request.getWeight());
        profile.setCity(request.getCity());
        profile.setState(request.getState());
        profile.setLatitude(request.getLatitude());
        profile.setLongitude(request.getLongitude());

        profile.setAvailabilityStatus(
                AvailabilityStatus.UNAVAILABLE
        );

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
    public DonorProfileResponse getDonorProfile(String email) {

        User user = getUserByEmail(email);

        DonorProfile profile =
                donorProfileRepository.findByUserId(user.getId())
                        .orElseThrow(() -> new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Donor profile not found"
                        ));

        EligibilityResult eligibility =
                calculateEligibility(profile);

        return DonorProfileResponse.fromEntity(
                profile,
                eligibility.isEligible(),
                eligibility.reason(),
                eligibility.daysRemaining()
        );
    }

    public DonorProfileResponse updateAvailability(
            String email,
            AvailabilityUpdateRequest request
    ) {

        User user = getUserByEmail(email);

        DonorProfile profile =
                donorProfileRepository.findByUserId(user.getId())
                        .orElseThrow(() -> new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Donor profile not found"
                        ));

        EligibilityResult eligibility =
                calculateEligibility(profile);

        if (request.getAvailabilityStatus() == AvailabilityStatus.AVAILABLE
                && !eligibility.isEligible()) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Donor is not currently eligible: "
                            + eligibility.reason()
            );
        }

        profile.setAvailabilityStatus(
                request.getAvailabilityStatus()
        );

        DonorProfile updatedProfile =
                donorProfileRepository.save(profile);

        return DonorProfileResponse.fromEntity(
                updatedProfile,
                eligibility.isEligible(),
                eligibility.reason(),
                eligibility.daysRemaining()
        );
    }

    @Transactional(readOnly = true)
    public DonorEligibilityResponse getDonorEligibility(
            String email
    ) {

        User user = getUserByEmail(email);

        DonorProfile profile =
                donorProfileRepository.findByUserId(user.getId())
                        .orElseThrow(() -> new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Donor profile not found"
                        ));

        EligibilityResult result =
                calculateEligibility(profile);

        LocalDate nextEligibleDate = null;

        if (!result.isEligible()
                && result.nextEligibleDate() != null) {

            nextEligibleDate = result.nextEligibleDate();
        }

        return new DonorEligibilityResponse(
                result.isEligible(),
                result.reason(),
                result.daysRemaining(),
                nextEligibleDate
        );
    }

    private EligibilityResult calculateEligibility(
            DonorProfile profile
    ) {

        if (profile.getWeight() == null
                || profile.getWeight().compareTo(BigDecimal.valueOf(45)) < 0) {

            return new EligibilityResult(
                    false,
                    "Underweight",
                    0L,
                    null
            );
        }

        if (profile.getLastDonationDate() != null) {

            LocalDate nextEligibleDate =
                    profile.getLastDonationDate().plusDays(90);

            LocalDate today = LocalDate.now();

            if (today.isBefore(nextEligibleDate)) {

                long daysRemaining =
                        ChronoUnit.DAYS.between(
                                today,
                                nextEligibleDate
                        );

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

    private User getUserByEmail(String email) {

        if (email == null || email.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "User is not authenticated"
            );
        }

        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "User not found"
                ));
    }

    private record EligibilityResult(
            boolean isEligible,
            String reason,
            long daysRemaining,
            LocalDate nextEligibleDate
    ) {
    }
}

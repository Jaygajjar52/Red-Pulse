package com.redpulse.modules.matching.service;

import com.redpulse.common.exception.ResourceNotFoundException;
import com.redpulse.common.utils.LocationUtils;
import com.redpulse.enums.AvailabilityStatus;
import com.redpulse.enums.BloodGroup;
import com.redpulse.modules.hospital.dto.HospitalResponse;
import com.redpulse.modules.hospital.entity.Hospital;
import com.redpulse.modules.hospital.repository.HospitalRepository;
import com.redpulse.modules.matching.dto.DonorMatchResponse;
import com.redpulse.modules.matching.dto.LocationUpdateRequest;
import com.redpulse.modules.request.entity.BloodRequest;
import com.redpulse.modules.request.repository.BloodRequestRepository;
import com.redpulse.modules.user.dto.DonorProfileResponse;
import com.redpulse.modules.user.entity.DonorProfile;
import com.redpulse.modules.user.repository.DonorProfileRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class MatchingService {

    private final BloodRequestRepository bloodRequestRepository;
    private final DonorProfileRepository donorProfileRepository;
    private final HospitalRepository hospitalRepository;

    public MatchingService(BloodRequestRepository bloodRequestRepository,
                           DonorProfileRepository donorProfileRepository,
                           HospitalRepository hospitalRepository) {
        this.bloodRequestRepository = bloodRequestRepository;
        this.donorProfileRepository = donorProfileRepository;
        this.hospitalRepository = hospitalRepository;
    }

    @Transactional(readOnly = true)
    public List<DonorMatchResponse> getRankedMatches(UUID requestId, Double maxRadiusKm) {
        BloodRequest req = bloodRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Blood request not found"));

        double targetLat = req.getHospital() != null && req.getHospital().getLatitude() != null
                ? req.getHospital().getLatitude() : 23.0225;
        double targetLon = req.getHospital() != null && req.getHospital().getLongitude() != null
                ? req.getHospital().getLongitude() : 72.5714;

        Set<BloodGroup> compatibleGroups = getCompatibleDonorBloodGroups(req.getBloodGroup());
        List<DonorProfile> allDonors = donorProfileRepository.findAll();

        double limitRadius = (maxRadiusKm != null && maxRadiusKm > 0) ? maxRadiusKm : 50.0;

        List<DonorMatchResponse> matches = new ArrayList<>();

        for (DonorProfile donor : allDonors) {

            if (compatibleGroups.contains(donor.getBloodGroup()) &&
                    donor.getAvailabilityStatus() == AvailabilityStatus.AVAILABLE) {

                double dist = LocationUtils.calculateDistance(targetLat, targetLon, donor.getLatitude(), donor.getLongitude());

                if (dist <= limitRadius) {
                    int score = computeMatchScore(req.getBloodGroup(), donor.getBloodGroup(), dist, donor.getUser().isVerified());
                    matches.add(new DonorMatchResponse(
                            donor.getId(),
                            donor.getUser().getId(),
                            donor.getUser().getFirstName() + " " + donor.getUser().getLastName(),
                            donor.getBloodGroup(),
                            donor.getUser().getPhone(),
                            donor.getCity(),
                            donor.getState(),
                            dist,
                            score,
                            donor.getUser().isVerified(),
                            donor.getAvailabilityStatus()
                    ));
                }
            }
        }

        matches.sort((a, b) -> Integer.compare(b.getMatchScore(), a.getMatchScore()));
        return matches;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getMatchScoreBreakdown(UUID donorId, UUID requestId) {
        BloodRequest req = bloodRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Blood request not found"));

        DonorProfile donor = donorProfileRepository.findById(donorId)
                .orElseThrow(() -> new ResourceNotFoundException("Donor profile not found"));

        double targetLat = req.getHospital() != null && req.getHospital().getLatitude() != null
                ? req.getHospital().getLatitude() : 23.0225;
        double targetLon = req.getHospital() != null && req.getHospital().getLongitude() != null
                ? req.getHospital().getLongitude() : 72.5714;

        double distance = LocationUtils.calculateDistance(targetLat, targetLon, donor.getLatitude(), donor.getLongitude());
        boolean compatible = getCompatibleDonorBloodGroups(req.getBloodGroup()).contains(donor.getBloodGroup());
        int totalScore = compatible ? computeMatchScore(req.getBloodGroup(), donor.getBloodGroup(), distance, donor.getUser().isVerified()) : 0;

        Map<String, Object> result = new HashMap<>();
        result.put("donorId", donorId);
        result.put("requestId", requestId);
        result.put("recipientBloodGroup", req.getBloodGroup());
        result.put("donorBloodGroup", donor.getBloodGroup());
        result.put("isCompatible", compatible);
        result.put("distanceKm", distance);
        result.put("matchScore", totalScore);
        result.put("donorVerified", donor.getUser().isVerified());
        result.put("availabilityStatus", donor.getAvailabilityStatus());
        return result;
    }

    @Transactional
    public Map<String, Object> notifyDonor(UUID requestId, UUID donorId) {
        bloodRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Blood request not found"));
        donorProfileRepository.findById(donorId)
                .orElseThrow(() -> new ResourceNotFoundException("Donor profile not found"));

        Map<String, Object> notification = new HashMap<>();
        notification.put("requestId", requestId);
        notification.put("donorId", donorId);
        notification.put("status", "NOTIFICATION_DISPATCHED");
        notification.put("message", "Donation request notification sent to donor successfully");
        return notification;
    }

    @Transactional(readOnly = true)
    public List<DonorMatchResponse> findNearbyDonors(Double latitude, Double longitude, Double radiusKm) {
        double radius = (radiusKm != null && radiusKm > 0) ? radiusKm : 15.0;
        List<DonorProfile> donors = donorProfileRepository.findAll();

        List<DonorMatchResponse> nearby = new ArrayList<>();
        for (DonorProfile d : donors) {
            double dist = LocationUtils.calculateDistance(latitude, longitude, d.getLatitude(), d.getLongitude());
            if (dist <= radius) {
                nearby.add(new DonorMatchResponse(
                        d.getId(),
                        d.getUser().getId(),
                        d.getUser().getFirstName() + " " + d.getUser().getLastName(),
                        d.getBloodGroup(),
                        d.getUser().getPhone(),
                        d.getCity(),
                        d.getState(),
                        dist,
                        100,
                        d.getUser().isVerified(),
                        d.getAvailabilityStatus()
                ));
            }
        }
        nearby.sort(Comparator.comparingDouble(DonorMatchResponse::getDistanceKm));
        return nearby;
    }

    @Transactional(readOnly = true)
    public List<HospitalResponse> findNearbyHospitals(Double latitude, Double longitude, Double radiusKm) {
        double radius = (radiusKm != null && radiusKm > 0) ? radiusKm : 20.0;
        List<Hospital> hospitals = hospitalRepository.findByActiveTrue();

        List<HospitalResponse> nearby = new ArrayList<>();
        for (Hospital h : hospitals) {
            double dist = LocationUtils.calculateDistance(latitude, longitude, h.getLatitude(), h.getLongitude());
            if (dist <= radius) {
                nearby.add(HospitalResponse.fromEntity(h));
            }
        }
        return nearby;
    }

    @Transactional(readOnly = true)
    public Map<String, Double> getDonorLocation(UUID donorId) {
        DonorProfile donor = donorProfileRepository.findById(donorId)
                .orElseThrow(() -> new ResourceNotFoundException("Donor not found"));

        Map<String, Double> loc = new HashMap<>();
        loc.put("latitude", donor.getLatitude());
        loc.put("longitude", donor.getLongitude());
        return loc;
    }

    @Transactional
    public Map<String, Double> updateDonorLocation(UUID donorId, LocationUpdateRequest request) {
        DonorProfile donor = donorProfileRepository.findById(donorId)
                .orElseThrow(() -> new ResourceNotFoundException("Donor not found"));

        donor.setLatitude(request.getLatitude());
        donor.setLongitude(request.getLongitude());
        donorProfileRepository.save(donor);

        Map<String, Double> loc = new HashMap<>();
        loc.put("latitude", donor.getLatitude());
        loc.put("longitude", donor.getLongitude());
        return loc;
    }

    public static Set<BloodGroup> getCompatibleDonorBloodGroups(BloodGroup recipient) {
        Set<BloodGroup> compatible = new HashSet<>();
        switch (recipient) {
            case A_POSITIVE -> compatible.addAll(Arrays.asList(BloodGroup.A_POSITIVE, BloodGroup.A_NEGATIVE, BloodGroup.O_POSITIVE, BloodGroup.O_NEGATIVE));
            case A_NEGATIVE -> compatible.addAll(Arrays.asList(BloodGroup.A_NEGATIVE, BloodGroup.O_NEGATIVE));
            case B_POSITIVE -> compatible.addAll(Arrays.asList(BloodGroup.B_POSITIVE, BloodGroup.B_NEGATIVE, BloodGroup.O_POSITIVE, BloodGroup.O_NEGATIVE));
            case B_NEGATIVE -> compatible.addAll(Arrays.asList(BloodGroup.B_NEGATIVE, BloodGroup.O_NEGATIVE));
            case AB_POSITIVE -> compatible.addAll(Arrays.asList(BloodGroup.values()));
            case AB_NEGATIVE -> compatible.addAll(Arrays.asList(BloodGroup.AB_NEGATIVE, BloodGroup.A_NEGATIVE, BloodGroup.B_NEGATIVE, BloodGroup.O_NEGATIVE));
            case O_POSITIVE -> compatible.addAll(Arrays.asList(BloodGroup.O_POSITIVE, BloodGroup.O_NEGATIVE));
            case O_NEGATIVE -> compatible.add(BloodGroup.O_NEGATIVE);
        }
        return compatible;
    }

    private int computeMatchScore(BloodGroup reqGroup, BloodGroup donorGroup, double distanceKm, boolean isVerified) {
        int score = 0;

        if (reqGroup == donorGroup) {
            score += 50;
        } else {
            score += 35;
        }

        if (distanceKm <= 5.0) {
            score += 35;
        } else if (distanceKm <= 15.0) {
            score += 25;
        } else if (distanceKm <= 30.0) {
            score += 15;
        } else {
            score += 5;
        }

        if (isVerified) {
            score += 15;
        }

        return Math.min(score, 100);
    }
}

package com.redpulse.modules.user.service;

import com.redpulse.common.exception.ResourceNotFoundException;
import com.redpulse.modules.donation.dto.DonationResponse;
import com.redpulse.modules.donation.entity.Donation;
import com.redpulse.modules.donation.repository.DonationRepository;
import com.redpulse.enums.DonationStatus;
import com.redpulse.modules.user.dto.DonorContributionResponse;
import com.redpulse.modules.user.dto.DonorLeaderboardResponse;
import com.redpulse.modules.user.entity.DonorProfile;
import com.redpulse.modules.user.repository.DonorProfileRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class DonorContributionService {

    private final DonorProfileRepository donorProfileRepository;
    private final DonationRepository donationRepository;

    public DonorContributionService(DonorProfileRepository donorProfileRepository, DonationRepository donationRepository) {
        this.donorProfileRepository = donorProfileRepository;
        this.donationRepository = donationRepository;
    }

    @Transactional(readOnly = true)
    public DonorContributionResponse getContributionSummary(UUID donorId) {
        DonorProfile profile = findDonor(donorId);
        List<Donation> donations = completedOnly(profile.getUser().getId());

        int count = donations.size();
        int units = donations.stream().mapToInt(Donation::getQuantityUnits).sum();
        int lives = units * 3;

        LocalDate nextDate = profile.getLastDonationDate() != null ? profile.getLastDonationDate().plusDays(90) : LocalDate.now();

        String rank = count >= 10 ? "Platinum Life Saver" : (count >= 5 ? "Gold Hero" : (count >= 3 ? "Silver Donor" : "Bronze Contributor"));
        List<String> badges = computeBadges(count, profile);

        return new DonorContributionResponse(
                profile.getId(),
                profile.getUser().getFirstName() + " " + profile.getUser().getLastName(),
                profile.getBloodGroup().name(),
                count,
                units,
                lives,
                profile.getLastDonationDate(),
                nextDate,
                rank,
                badges
        );
    }

    @Transactional(readOnly = true)
    public List<DonationResponse> getDonationHistory(UUID donorId) {
        DonorProfile profile = findDonor(donorId);
        return completedOnly(profile.getUser().getId())
                .stream()
                .map(DonationResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getMilestones(UUID donorId) {
        DonorProfile profile = findDonor(donorId);
        List<Donation> donations = completedOnly(profile.getUser().getId());
        int count = donations.size();

        Map<String, Object> milestones = new LinkedHashMap<>();
        milestones.put("firstDonationUnlocked", count >= 1);
        milestones.put("bronzeDonor3Units", count >= 3);
        milestones.put("silverHero5Units", count >= 5);
        milestones.put("goldLifeSaver10Units", count >= 10);
        milestones.put("nextMilestoneRemaining", count >= 10 ? 0 : (count >= 5 ? 10 - count : (count >= 3 ? 5 - count : 3 - count)));
        return milestones;
    }

    @Transactional(readOnly = true)
    public List<Map<String, String>> getBadges(UUID donorId) {
        DonorProfile profile = findDonor(donorId);
        List<Donation> donations = completedOnly(profile.getUser().getId());

        List<Map<String, String>> badges = new ArrayList<>();
        badges.add(Map.of("badge", "New Pioneer", "description", "Registered as an official voluntary blood donor"));

        if (!donations.isEmpty()) {
            badges.add(Map.of("badge", "Life Giver", "description", "Completed 1st successful blood donation"));
        }
        if (donations.size() >= 3) {
            badges.add(Map.of("badge", "Silver Lifesaver", "description", "Donated blood at least 3 times"));
        }
        if (donations.size() >= 5) {
            badges.add(Map.of("badge", "Golden Guardian", "description", "Completed 5 or more lifesaving donations"));
        }
        return badges;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getStatistics(UUID donorId) {
        DonorProfile profile = findDonor(donorId);
        List<Donation> donations = donationRepository.findByDonorIdOrderByDonationDateDesc(profile.getUser().getId());

        int totalUnits = donations.stream().mapToInt(Donation::getQuantityUnits).sum();

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalDonations", donations.size());
        stats.put("totalUnits", totalUnits);
        stats.put("estimatedLivesSaved", totalUnits * 3);
        stats.put("lastDonationDate", profile.getLastDonationDate());
        stats.put("cooldownActive", profile.getLastDonationDate() != null && profile.getLastDonationDate().plusDays(90).isAfter(LocalDate.now()));
        return stats;
    }

    @Transactional(readOnly = true)
    public List<DonorLeaderboardResponse> getLeaderboard() {
        List<DonorProfile> donors = donorProfileRepository.findAll();

        List<DonorLeaderboardResponse> board = new ArrayList<>();
        int rank = 1;
        for (DonorProfile d : donors) {
            int donationsCount = completedOnly(d.getUser().getId()).size();
            String badge = donationsCount >= 5 ? "🥇 Gold Champion" : (donationsCount >= 2 ? "🥈 Silver Lifesaver" : "🥉 Active Donor");

            board.add(new DonorLeaderboardResponse(
                    rank,
                    d.getId(),
                    d.getUser().getFirstName() + " " + d.getUser().getLastName(),
                    d.getBloodGroup().name(),
                    d.getCity(),
                    donationsCount,
                    badge
            ));
        }

        board.sort((a, b) -> Integer.compare(b.getTotalDonations(), a.getTotalDonations()));

        for (int i = 0; i < board.size(); i++) {
            board.set(i, new DonorLeaderboardResponse(
                    i + 1,
                    board.get(i).getDonorId(),
                    board.get(i).getDonorName(),
                    board.get(i).getBloodGroup(),
                    board.get(i).getCity(),
                    board.get(i).getTotalDonations(),
                    board.get(i).getBadgeTitle()
            ));
        }
        return board;
    }

    private DonorProfile findDonor(UUID donorId) {
        return donorProfileRepository.findById(donorId)
                .orElseThrow(() -> new ResourceNotFoundException("Donor not found with ID: " + donorId));
    }

    private List<String> computeBadges(int count, DonorProfile profile) {
        List<String> list = new ArrayList<>();
        list.add("Registered Hero");
        if (count >= 1) list.add("First Drop");
        if (count >= 3) list.add("Triple Lifesaver");
        if (count >= 5) list.add("Guardian Angel");
        return list;
    }

    private List<Donation> completedOnly(UUID userId) {
        return donationRepository.findByDonorIdOrderByDonationDateDesc(userId)
                .stream()
                .filter(donation -> donation.getStatus() == DonationStatus.COMPLETED)
                .collect(Collectors.toList());
    }
}

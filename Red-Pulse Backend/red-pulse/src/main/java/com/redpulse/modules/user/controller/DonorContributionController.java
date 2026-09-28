package com.redpulse.modules.user.controller;

import com.redpulse.common.security.UserPrincipal;
import com.redpulse.modules.donation.dto.DonationResponse;
import com.redpulse.modules.user.dto.DonorContributionResponse;
import com.redpulse.modules.user.dto.DonorLeaderboardResponse;
import com.redpulse.modules.user.entity.DonorProfile;
import com.redpulse.modules.user.repository.DonorProfileRepository;
import com.redpulse.modules.user.service.DonorContributionService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/donors")
public class DonorContributionController {

    private final DonorContributionService contributionService;
    private final DonorProfileRepository donorProfileRepository;

    public DonorContributionController(DonorContributionService contributionService, DonorProfileRepository donorProfileRepository) {
        this.contributionService = contributionService;
        this.donorProfileRepository = donorProfileRepository;
    }

    private UUID resolveDonorId(UUID userId) {
        return donorProfileRepository.findByUserId(userId)
                .map(DonorProfile::getId)
                .orElse(userId);
    }

    @GetMapping("/{donorId}/contributions")
    public ResponseEntity<DonorContributionResponse> getContributions(@PathVariable UUID donorId) {
        DonorContributionResponse response = contributionService.getContributionSummary(donorId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{donorId}/donations")
    public ResponseEntity<List<DonationResponse>> getDonations(@PathVariable UUID donorId) {
        List<DonationResponse> response = contributionService.getDonationHistory(donorId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{donorId}/milestones")
    public ResponseEntity<Map<String, Object>> getMilestones(@PathVariable UUID donorId) {
        Map<String, Object> response = contributionService.getMilestones(donorId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{donorId}/badges")
    public ResponseEntity<List<Map<String, String>>> getBadges(@PathVariable UUID donorId) {
        List<Map<String, String>> response = contributionService.getBadges(donorId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{donorId}/statistics")
    public ResponseEntity<Map<String, Object>> getStatistics(@PathVariable UUID donorId) {
        Map<String, Object> response = contributionService.getStatistics(donorId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/leaderboard")
    public ResponseEntity<List<DonorLeaderboardResponse>> getLeaderboard() {
        List<DonorLeaderboardResponse> response = contributionService.getLeaderboard();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/me/contributions")
    public ResponseEntity<DonorContributionResponse> getMyContributions(@AuthenticationPrincipal UserPrincipal currentUser) {
        UUID donorId = resolveDonorId(currentUser.getId());
        return ResponseEntity.ok(contributionService.getContributionSummary(donorId));
    }

    @GetMapping("/me/donations")
    public ResponseEntity<List<DonationResponse>> getMyDonations(@AuthenticationPrincipal UserPrincipal currentUser) {
        UUID donorId = resolveDonorId(currentUser.getId());
        return ResponseEntity.ok(contributionService.getDonationHistory(donorId));
    }

    @GetMapping("/me/milestones")
    public ResponseEntity<Map<String, Object>> getMyMilestones(@AuthenticationPrincipal UserPrincipal currentUser) {
        UUID donorId = resolveDonorId(currentUser.getId());
        return ResponseEntity.ok(contributionService.getMilestones(donorId));
    }

    @GetMapping("/me/badges")
    public ResponseEntity<List<Map<String, String>>> getMyBadges(@AuthenticationPrincipal UserPrincipal currentUser) {
        UUID donorId = resolveDonorId(currentUser.getId());
        return ResponseEntity.ok(contributionService.getBadges(donorId));
    }

    @GetMapping("/me/statistics")
    public ResponseEntity<Map<String, Object>> getMyStatistics(@AuthenticationPrincipal UserPrincipal currentUser) {
        UUID donorId = resolveDonorId(currentUser.getId());
        return ResponseEntity.ok(contributionService.getStatistics(donorId));
    }
}

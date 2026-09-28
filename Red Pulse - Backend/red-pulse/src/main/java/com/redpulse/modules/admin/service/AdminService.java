package com.redpulse.modules.admin.service;

import com.redpulse.common.exception.ResourceNotFoundException;
import com.redpulse.enums.EmergencyStatus;
import com.redpulse.enums.UserStatus;
import com.redpulse.modules.admin.dto.AdminDashboardResponse;
import com.redpulse.modules.admin.dto.AuditLogResponse;
import com.redpulse.modules.admin.entity.AuditLog;
import com.redpulse.modules.admin.repository.AuditLogRepository;
import com.redpulse.modules.donation.entity.Donation;
import com.redpulse.modules.donation.repository.DonationRepository;
import com.redpulse.modules.hospital.dto.HospitalResponse;
import com.redpulse.modules.hospital.entity.Hospital;
import com.redpulse.modules.hospital.repository.HospitalRepository;
import com.redpulse.modules.inventory.entity.BloodInventory;
import com.redpulse.modules.inventory.repository.BloodInventoryRepository;
import com.redpulse.modules.request.entity.BloodRequest;
import com.redpulse.modules.request.repository.BloodRequestRepository;
import com.redpulse.modules.request.repository.EmergencyRequestRepository;
import com.redpulse.modules.user.dto.DonorProfileResponse;
import com.redpulse.modules.user.dto.UserResponse;
import com.redpulse.modules.user.entity.DonorProfile;
import com.redpulse.modules.user.entity.User;
import com.redpulse.modules.user.repository.DonorProfileRepository;
import com.redpulse.modules.user.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AdminService {

    private final UserRepository userRepository;
    private final DonorProfileRepository donorProfileRepository;
    private final HospitalRepository hospitalRepository;
    private final BloodInventoryRepository inventoryRepository;
    private final BloodRequestRepository bloodRequestRepository;
    private final EmergencyRequestRepository emergencyRepository;
    private final DonationRepository donationRepository;
    private final AuditLogRepository auditLogRepository;

    public AdminService(UserRepository userRepository,
                        DonorProfileRepository donorProfileRepository,
                        HospitalRepository hospitalRepository,
                        BloodInventoryRepository inventoryRepository,
                        BloodRequestRepository bloodRequestRepository,
                        EmergencyRequestRepository emergencyRepository,
                        DonationRepository donationRepository,
                        AuditLogRepository auditLogRepository) {
        this.userRepository = userRepository;
        this.donorProfileRepository = donorProfileRepository;
        this.hospitalRepository = hospitalRepository;
        this.inventoryRepository = inventoryRepository;
        this.bloodRequestRepository = bloodRequestRepository;
        this.emergencyRepository = emergencyRepository;
        this.donationRepository = donationRepository;
        this.auditLogRepository = auditLogRepository;
    }

    @Transactional(readOnly = true)
    public List<AuditLogResponse> getAllAuditLogs() {
        return auditLogRepository.findByOrderByCreatedAtDesc()
                .stream().map(AuditLogResponse::fromEntity).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public AuditLogResponse getAuditLogById(UUID id) {
        AuditLog log = auditLogRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Audit log not found"));
        return AuditLogResponse.fromEntity(log);
    }

    @Transactional(readOnly = true)
    public List<AuditLogResponse> filterAuditLogs(String action) {
        return auditLogRepository.findByActionIgnoreCaseOrderByCreatedAtDesc(action)
                .stream().map(AuditLogResponse::fromEntity).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public String exportAuditLogsCsv() {
        List<AuditLog> logs = auditLogRepository.findByOrderByCreatedAtDesc();
        StringBuilder csv = new StringBuilder("ID,Action,User,Entity,Description,Timestamp\n");
        for (AuditLog l : logs) {
            String user = l.getUser() != null ? l.getUser().getEmail() : "SYSTEM";
            csv.append(String.format("%s,%s,%s,%s,\"%s\",%s\n",
                    l.getId(), l.getAction(), user, l.getEntityType(), l.getDescription(), l.getCreatedAt()));
        }
        return csv.toString();
    }

    @Transactional
    public void recordAudit(User user, String action, String entityType, UUID entityId, String desc) {
        AuditLog log = new AuditLog(user, action, entityType, entityId, desc, "127.0.0.1");
        auditLogRepository.save(log);
    }

    @Transactional(readOnly = true)
    public AdminDashboardResponse getOverviewAnalytics() {
        long totalUsers = userRepository.count();
        long totalDonors = donorProfileRepository.count();
        long totalHospitals = hospitalRepository.count();
        long totalRequests = bloodRequestRepository.count();
        long activeEmergencies = emergencyRepository.findByStatus(EmergencyStatus.ACTIVE).size();
        long totalDonations = donationRepository.count();

        List<BloodInventory> inventory = inventoryRepository.findAll();
        int totalUnits = inventory.stream().mapToInt(BloodInventory::getQuantityUnits).sum();

        Map<String, Integer> stockMap = new LinkedHashMap<>();
        for (BloodInventory bi : inventory) {
            stockMap.merge(bi.getBloodGroup().name(), bi.getQuantityUnits(), Integer::sum);
        }

        return new AdminDashboardResponse(totalUsers, totalDonors, totalHospitals,
                totalRequests, activeEmergencies, totalDonations, totalUnits, stockMap);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getDonationAnalytics() {
        List<Donation> donations = donationRepository.findAll();
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalDonations", donations.size());
        stats.put("totalUnitsCollected", donations.stream().mapToInt(Donation::getQuantityUnits).sum());
        return stats;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getBloodRequestAnalytics() {
        List<BloodRequest> reqs = bloodRequestRepository.findAll();
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalRequests", reqs.size());
        stats.put("totalUnitsDemanded", reqs.stream().mapToInt(BloodRequest::getUnitsRequired).sum());
        return stats;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getInventoryAnalytics() {
        List<BloodInventory> inv = inventoryRepository.findAll();
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalBatches", inv.size());
        stats.put("totalUnitsInStock", inv.stream().mapToInt(BloodInventory::getQuantityUnits).sum());
        return stats;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getEmergencyAnalytics() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalEmergencies", emergencyRepository.count());
        stats.put("activeEmergencies", emergencyRepository.findByStatus(EmergencyStatus.ACTIVE).size());
        return stats;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getUserAnalytics() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalRegisteredUsers", userRepository.count());
        stats.put("totalActiveDonors", donorProfileRepository.count());
        return stats;
    }

    @Transactional(readOnly = true)
    public Map<String, Integer> getBloodGroupAnalytics() {
        Map<String, Integer> dist = new HashMap<>();
        for (DonorProfile dp : donorProfileRepository.findAll()) {
            dist.merge(dp.getBloodGroup().name(), 1, Integer::sum);
        }
        return dist;
    }

    @Transactional(readOnly = true)
    public String getDonationsReportCsv() {
        List<Donation> list = donationRepository.findAll();
        StringBuilder sb = new StringBuilder("DonationID,Donor,Hospital,BloodGroup,Units,Date\n");
        for (Donation d : list) {
            sb.append(String.format("%s,%s,%s,%s,%d,%s\n",
                    d.getId(), d.getDonor().getEmail(), d.getHospital().getHospitalName(),
                    d.getBloodGroup(), d.getQuantityUnits(), d.getDonationDate()));
        }
        return sb.toString();
    }

    @Transactional(readOnly = true)
    public String getBloodRequestsReportCsv() {
        List<BloodRequest> list = bloodRequestRepository.findAll();
        StringBuilder sb = new StringBuilder("RequestID,Requester,BloodGroup,UnitsRequired,Urgency,Status,City\n");
        for (BloodRequest r : list) {
            sb.append(String.format("%s,%s,%s,%d,%s,%s,%s\n",
                    r.getId(), r.getRequester().getEmail(), r.getBloodGroup(),
                    r.getUnitsRequired(), r.getUrgency(), r.getStatus(), r.getCity()));
        }
        return sb.toString();
    }

    @Transactional(readOnly = true)
    public String getInventoryReportCsv() {
        List<BloodInventory> list = inventoryRepository.findAll();
        StringBuilder sb = new StringBuilder("Hospital,BloodGroup,AvailableUnits,LastUpdated\n");
        for (BloodInventory bi : list) {
            sb.append(String.format("%s,%s,%d,%s\n",
                    bi.getHospital().getHospitalName(), bi.getBloodGroup(), bi.getQuantityUnits(), bi.getLastUpdated()));
        }
        return sb.toString();
    }

    @Transactional(readOnly = true)
    public String getDonorsReportCsv() {
        List<DonorProfile> list = donorProfileRepository.findAll();
        StringBuilder sb = new StringBuilder("DonorName,BloodGroup,City,Status,Verified\n");
        for (DonorProfile dp : list) {
            sb.append(String.format("%s %s,%s,%s,%s,%b\n",
                    dp.getUser().getFirstName(), dp.getUser().getLastName(),
                    dp.getBloodGroup(), dp.getCity(), dp.getAvailabilityStatus(), dp.getUser().isVerified()));
        }
        return sb.toString();
    }

    @Transactional(readOnly = true)
    public String getHospitalsReportCsv() {
        List<Hospital> list = hospitalRepository.findAll();
        StringBuilder sb = new StringBuilder("HospitalName,RegNumber,City,Phone,Verified,Active\n");
        for (Hospital h : list) {
            sb.append(String.format("%s,%s,%s,%s,%b,%b\n",
                    h.getHospitalName(), h.getRegistrationNumber(), h.getCity(), h.getPhone(), h.isVerified(), h.isActive()));
        }
        return sb.toString();
    }

    @Transactional(readOnly = true)
    public String getEmergenciesReportCsv() {
        StringBuilder sb = new StringBuilder("EmergencyID,BloodGroup,Units,EmergencyLevel,Status,ContactPhone\n");
        for (var er : emergencyRepository.findAll()) {
            sb.append(String.format("%s,%s,%d,%s,%s,%s\n",
                    er.getId(), er.getBloodRequest().getBloodGroup(),
                    er.getBloodRequest().getUnitsRequired(), er.getEmergencyLevel(), er.getStatus(), er.getContactPhone()));
        }
        return sb.toString();
    }

    @Transactional(readOnly = true)
    public List<UserResponse> getAllUsers() {
        return getAllUsers(null, null, null);
    }

    @Transactional(readOnly = true)
    public List<UserResponse> getAllUsers(String search, String role, String status) {
        return userRepository.findAll().stream()
                .filter(u -> {
                    if (role != null && !role.isBlank() && !u.getRole().name().equalsIgnoreCase(role)) {
                        return false;
                    }
                    if (status != null && !status.isBlank() && !u.getStatus().name().equalsIgnoreCase(status)) {
                        return false;
                    }
                    if (search != null && !search.isBlank()) {
                        String s = search.toLowerCase();
                        boolean matchName = (u.getFirstName() != null && u.getFirstName().toLowerCase().contains(s))
                                || (u.getLastName() != null && u.getLastName().toLowerCase().contains(s));
                        boolean matchEmail = u.getEmail() != null && u.getEmail().toLowerCase().contains(s);
                        if (!matchName && !matchEmail) return false;
                    }
                    return true;
                })
                .map(UserResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public UserResponse getUserById(UUID id) {
        User u = userRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return UserResponse.fromEntity(u);
    }

    @Transactional
    public UserResponse blockUser(UUID id) {
        User u = userRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("User not found"));
        u.setStatus(UserStatus.BLOCKED);
        u.setActive(false);
        recordAudit(u, "USER_BLOCKED", "User", u.getId(), "User blocked by Admin");
        return UserResponse.fromEntity(userRepository.save(u));
    }

    @Transactional
    public UserResponse unblockUser(UUID id) {
        User u = userRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("User not found"));
        u.setStatus(UserStatus.ACTIVE);
        u.setActive(true);
        recordAudit(u, "USER_UNBLOCKED", "User", u.getId(), "User unblocked by Admin");
        return UserResponse.fromEntity(userRepository.save(u));
    }

    @Transactional(readOnly = true)
    public List<DonorProfileResponse> getAllDonors() {
        return donorProfileRepository.findAll().stream()
                .map(d -> DonorProfileResponse.fromEntity(d, true, "Active Donor", 0L))
                .collect(Collectors.toList());
    }

    @Transactional
    public DonorProfileResponse verifyDonor(UUID donorProfileId) {
        DonorProfile dp = donorProfileRepository.findById(donorProfileId)
                .orElseThrow(() -> new ResourceNotFoundException("Donor profile not found"));
        dp.getUser().setVerified(true);
        userRepository.save(dp.getUser());
        recordAudit(dp.getUser(), "DONOR_VERIFIED", "DonorProfile", dp.getId(), "Donor badge verified by Admin");
        return DonorProfileResponse.fromEntity(dp, true, "Verified Donor", 0L);
    }

    @Transactional(readOnly = true)
    public List<HospitalResponse> getManageHospitals() {
        return hospitalRepository.findAll().stream().map(HospitalResponse::fromEntity).collect(Collectors.toList());
    }
}

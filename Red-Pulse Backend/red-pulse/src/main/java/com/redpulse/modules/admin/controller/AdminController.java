package com.redpulse.modules.admin.controller;

import com.redpulse.modules.admin.dto.AdminDashboardResponse;
import com.redpulse.modules.admin.dto.AuditLogResponse;
import com.redpulse.modules.admin.service.AdminService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/audit-logs")
    public ResponseEntity<List<AuditLogResponse>> getAuditLogs() {
        return ResponseEntity.ok(adminService.getAllAuditLogs());
    }

    @GetMapping("/audit-logs/{id}")
    public ResponseEntity<AuditLogResponse> getAuditLogById(@PathVariable UUID id) {
        return ResponseEntity.ok(adminService.getAuditLogById(id));
    }

    @GetMapping("/audit-logs/filter")
    public ResponseEntity<List<AuditLogResponse>> filterAuditLogs(@RequestParam String action) {
        return ResponseEntity.ok(adminService.filterAuditLogs(action));
    }

    @GetMapping("/audit-logs/export")
    public ResponseEntity<String> exportAuditLogs() {
        String csv = adminService.exportAuditLogsCsv();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=audit_logs.csv")
                .contentType(MediaType.TEXT_PLAIN)
                .body(csv);
    }

    @GetMapping("/analytics/overview")
    public ResponseEntity<AdminDashboardResponse> getOverview() {
        return ResponseEntity.ok(adminService.getOverviewAnalytics());
    }

    @GetMapping("/analytics/donations")
    public ResponseEntity<Map<String, Object>> getDonationAnalytics() {
        return ResponseEntity.ok(adminService.getDonationAnalytics());
    }

    @GetMapping("/analytics/blood-requests")
    public ResponseEntity<Map<String, Object>> getBloodRequestAnalytics() {
        return ResponseEntity.ok(adminService.getBloodRequestAnalytics());
    }

    @GetMapping("/analytics/inventory")
    public ResponseEntity<Map<String, Object>> getInventoryAnalytics() {
        return ResponseEntity.ok(adminService.getInventoryAnalytics());
    }

    @GetMapping("/analytics/emergency-requests")
    public ResponseEntity<Map<String, Object>> getEmergencyAnalytics() {
        return ResponseEntity.ok(adminService.getEmergencyAnalytics());
    }

    @GetMapping("/analytics/users")
    public ResponseEntity<Map<String, Object>> getUserAnalytics() {
        return ResponseEntity.ok(adminService.getUserAnalytics());
    }

    @GetMapping("/analytics/blood-groups")
    public ResponseEntity<Map<String, Integer>> getBloodGroupAnalytics() {
        return ResponseEntity.ok(adminService.getBloodGroupAnalytics());
    }

    @GetMapping("/reports/donations")
    public ResponseEntity<String> getDonationsReport() {
        return ResponseEntity.ok().contentType(MediaType.TEXT_PLAIN).body(adminService.getDonationsReportCsv());
    }

    @GetMapping("/reports/blood-requests")
    public ResponseEntity<String> getBloodRequestsReport() {
        return ResponseEntity.ok().contentType(MediaType.TEXT_PLAIN).body(adminService.getBloodRequestsReportCsv());
    }

    @GetMapping("/reports/inventory")
    public ResponseEntity<String> getInventoryReport() {
        return ResponseEntity.ok().contentType(MediaType.TEXT_PLAIN).body(adminService.getInventoryReportCsv());
    }

    @GetMapping("/reports/donors")
    public ResponseEntity<String> getDonorsReport() {
        return ResponseEntity.ok().contentType(MediaType.TEXT_PLAIN).body(adminService.getDonorsReportCsv());
    }

    @GetMapping("/reports/hospitals")
    public ResponseEntity<String> getHospitalsReport() {
        return ResponseEntity.ok().contentType(MediaType.TEXT_PLAIN).body(adminService.getHospitalsReportCsv());
    }

    @GetMapping("/reports/emergency-requests")
    public ResponseEntity<String> getEmergenciesReport() {
        return ResponseEntity.ok().contentType(MediaType.TEXT_PLAIN).body(adminService.getEmergenciesReportCsv());
    }
}

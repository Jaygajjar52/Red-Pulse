package com.redpulse.modules.donation.service;

import com.redpulse.common.exception.ResourceNotFoundException;
import com.redpulse.enums.AvailabilityStatus;
import com.redpulse.enums.DonationStatus;
import com.redpulse.modules.appointment.entity.Appointment;
import com.redpulse.modules.appointment.repository.AppointmentRepository;
import com.redpulse.modules.donation.dto.DonationCreateRequest;
import com.redpulse.modules.donation.dto.DonationResponse;
import com.redpulse.modules.donation.entity.Donation;
import com.redpulse.modules.donation.repository.DonationRepository;
import com.redpulse.modules.hospital.entity.Hospital;
import com.redpulse.modules.hospital.repository.HospitalRepository;
import com.redpulse.modules.inventory.dto.InventoryRequest;
import com.redpulse.modules.inventory.service.InventoryService;
import com.redpulse.modules.user.entity.User;
import com.redpulse.modules.user.repository.DonorProfileRepository;
import com.redpulse.modules.user.repository.UserRepository;
import com.redpulse.enums.NotificationType;
import com.redpulse.modules.notification.service.NotificationService;
import com.redpulse.common.exception.ForbiddenException;
import com.redpulse.modules.user.entity.DonorProfile;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class DonationService {

    private final DonationRepository donationRepository;
    private final UserRepository userRepository;
    private final HospitalRepository hospitalRepository;
    private final AppointmentRepository appointmentRepository;
    private final DonorProfileRepository donorProfileRepository;
    private final InventoryService inventoryService;
    private final NotificationService notificationService;

    public DonationService(DonationRepository donationRepository,
                           UserRepository userRepository,
                           HospitalRepository hospitalRepository,
                           AppointmentRepository appointmentRepository,
                           DonorProfileRepository donorProfileRepository,
                           InventoryService inventoryService,
                           NotificationService notificationService) {
        this.donationRepository = donationRepository;
        this.userRepository = userRepository;
        this.hospitalRepository = hospitalRepository;
        this.appointmentRepository = appointmentRepository;
        this.donorProfileRepository = donorProfileRepository;
        this.inventoryService = inventoryService;
        this.notificationService = notificationService;
    }

    @Transactional
    public DonationResponse createDonation(DonationCreateRequest request) {
        User donor = userRepository.findById(request.getDonorId())
                .orElseThrow(() -> new ResourceNotFoundException("Donor not found"));

        Hospital hospital = hospitalRepository.findById(request.getHospitalId())
                .orElseThrow(() -> new ResourceNotFoundException("Hospital not found"));

        Appointment appointment = null;
        if (request.getAppointmentId() != null) {
            appointment = appointmentRepository.findById(request.getAppointmentId()).orElse(null);
        }

        LocalDate date = request.getDonationDate() != null ? request.getDonationDate() : LocalDate.now();

        Donation donation = new Donation(
                donor,
                hospital,
                appointment,
                request.getBloodGroup(),
                date,
                request.getQuantityUnits(),
                request.getNotes()
        );

        Donation saved = donationRepository.save(donation);

        return DonationResponse.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public List<DonationResponse> getAllDonations() {
        return donationRepository.findAll()
                .stream()
                .map(DonationResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public DonationResponse getDonationById(UUID id) {
        Donation d = donationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Donation record not found"));
        return DonationResponse.fromEntity(d);
    }

    @Transactional
    public DonationResponse completeDonation(UUID id) {
        return verifyDonation(id, null);
    }

    @Transactional
    public DonationResponse verifyDonation(UUID id, UUID hospitalUserId) {
        Donation d = donationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Donation not found"));
        if (hospitalUserId != null) {
            Hospital owner = hospitalRepository.findByUserId(hospitalUserId)
                    .orElseThrow(() -> new ForbiddenException("Hospital account is required"));
            if (!owner.getId().equals(d.getHospital().getId())) {
                throw new ForbiddenException("You can verify donations only for your hospital");
            }
        }
        if (d.getStatus() == DonationStatus.COMPLETED) {
            return DonationResponse.fromEntity(d);
        }
        if (d.getStatus() == DonationStatus.CANCELLED) {
            throw new com.redpulse.common.exception.BadRequestException("Cancelled donations cannot be verified");
        }
        d.setStatus(DonationStatus.COMPLETED);
        DonationResponse response = DonationResponse.fromEntity(donationRepository.save(d));

        InventoryRequest invReq = new InventoryRequest();
        invReq.setBloodGroup(d.getBloodGroup());
        invReq.setQuantityUnits(d.getQuantityUnits());
        inventoryService.addOrInitializeInventory(d.getHospital().getId(), invReq);

        donorProfileRepository.findByUserId(d.getDonor().getId()).ifPresent(profile -> {
            profile.setLastDonationDate(d.getDonationDate());
            profile.setAvailabilityStatus(AvailabilityStatus.UNAVAILABLE);
            donorProfileRepository.save(profile);
        });

        notificationService.sendNotification(
                d.getDonor().getId(), NotificationType.DONATION_COMPLETED, "Donation completed",
                "Your donation was verified by " + d.getHospital().getHospitalName() + ". Your donor achievements have been updated.",
                "DONATION", d.getId());
        if (d.getAppointment() != null && d.getAppointment().getBloodRequest() != null) {
            d.getAppointment().markCompleted();
            notificationService.sendNotification(
                    d.getDonor().getId(), NotificationType.APPOINTMENT_COMPLETED,
                    "Appointment completed", "Your donation appointment has been completed.",
                    "APPOINTMENT", d.getAppointment().getId());
            User requester = d.getAppointment().getBloodRequest().getRequester();
            notificationService.sendNotification(
                    requester.getId(), NotificationType.DONATION_COMPLETED, "Blood donation completed",
                    "A donor completed the donation for your blood request.",
                    "DONATION", d.getId());
        }

        int completedCount = donationRepository.findByDonorIdOrderByDonationDateDesc(d.getDonor().getId())
                .stream().filter(item -> item.getStatus() == DonationStatus.COMPLETED).mapToInt(item -> 1).sum();
        String badge = completedCount == 1 ? "First Drop" : completedCount == 3 ? "Triple Lifesaver"
                : completedCount == 5 ? "Guardian Angel" : completedCount == 10 ? "Gold Life Saver" : null;
        if (badge != null) {
            notificationService.sendNotification(
                    d.getDonor().getId(), NotificationType.BADGE_EARNED, "New donor badge earned",
                    "Congratulations! You earned the " + badge + " badge.",
                    "DONATION", d.getId());
        }
        return response;
    }

    @Transactional
    public DonationResponse cancelDonation(UUID id) {
        Donation d = donationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Donation not found"));
        d.setStatus(DonationStatus.CANCELLED);
        return DonationResponse.fromEntity(donationRepository.save(d));
    }
}

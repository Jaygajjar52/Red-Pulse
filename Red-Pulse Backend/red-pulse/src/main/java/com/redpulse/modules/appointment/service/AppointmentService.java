package com.redpulse.modules.appointment.service;

import com.redpulse.common.exception.ResourceNotFoundException;
import com.redpulse.common.exception.BadRequestException;
import com.redpulse.common.exception.ConflictException;
import com.redpulse.common.exception.ForbiddenException;
import com.redpulse.enums.BloodRequestStatus;
import com.redpulse.enums.NotificationType;
import com.redpulse.modules.notification.service.NotificationService;
import com.redpulse.enums.AppointmentStatus;
import com.redpulse.modules.appointment.dto.AppointmentCreateRequest;
import com.redpulse.modules.appointment.dto.AppointmentResponse;
import com.redpulse.modules.appointment.entity.Appointment;
import com.redpulse.modules.appointment.repository.AppointmentRepository;
import com.redpulse.modules.hospital.entity.Hospital;
import com.redpulse.modules.hospital.repository.HospitalRepository;
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
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final UserRepository userRepository;
    private final HospitalRepository hospitalRepository;
    private final BloodRequestRepository bloodRequestRepository;
    private final NotificationService notificationService;

    public AppointmentService(AppointmentRepository appointmentRepository,
                              UserRepository userRepository,
                              HospitalRepository hospitalRepository,
                              BloodRequestRepository bloodRequestRepository,
                              NotificationService notificationService) {
        this.appointmentRepository = appointmentRepository;
        this.userRepository = userRepository;
        this.hospitalRepository = hospitalRepository;
        this.bloodRequestRepository = bloodRequestRepository;
        this.notificationService = notificationService;
    }

    @Transactional
    public AppointmentResponse createAppointment(UUID donorId, AppointmentCreateRequest request) {
        User donor = userRepository.findById(donorId)
                .orElseThrow(() -> new ResourceNotFoundException("Donor not found"));
        if (donor.getRole() != com.redpulse.enums.Role.DONOR) {
            throw new BadRequestException("Only donors can create appointments");
        }

        Hospital hospital = hospitalRepository.findById(request.getHospitalId())
                .orElseThrow(() -> new ResourceNotFoundException("Hospital not found"));

        BloodRequest bloodRequest = null;
        if (request.getBloodRequestId() != null) {
            bloodRequest = bloodRequestRepository.findById(request.getBloodRequestId()).orElse(null);
            if (bloodRequest == null) throw new ResourceNotFoundException("Blood request not found");
            if (bloodRequest.getStatus() == BloodRequestStatus.CANCELLED
                    || bloodRequest.getStatus() == BloodRequestStatus.FULFILLED) {
                throw new ConflictException("Blood request is no longer active");
            }
            if (appointmentRepository.existsByDonorIdAndBloodRequestIdAndStatusIn(
                    donorId, bloodRequest.getId(),
                    List.of(AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED))) {
                throw new ConflictException("An active appointment already exists for this donation request.");
            }
        }

        Appointment appt = new Appointment(
                donor,
                hospital,
                bloodRequest,
                request.getAppointmentDate(),
                request.getAppointmentTime(),
                request.getNotes()
        );

        AppointmentResponse response = AppointmentResponse.fromEntity(appointmentRepository.save(appt));
        notificationService.sendNotification(donorId, NotificationType.APPOINTMENT_CREATED,
                "Appointment scheduled", "Your donation appointment has been scheduled.",
                "APPOINTMENT", response.getId());
        return response;
    }

    @Transactional(readOnly = true)
    public List<AppointmentResponse> getAllAppointments() {
        return appointmentRepository.findAll()
                .stream()
                .map(AppointmentResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public AppointmentResponse getAppointmentById(UUID id) {
        Appointment appt = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found"));
        return AppointmentResponse.fromEntity(appt);
    }

    @Transactional(readOnly = true)
    public List<AppointmentResponse> getAppointmentsByDonor(UUID donorId) {
        return appointmentRepository.findByDonorIdOrderByAppointmentDateDesc(donorId)
                .stream()
                .map(AppointmentResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AppointmentResponse> getAppointmentsByHospital(UUID hospitalId) {
        return appointmentRepository.findByHospitalIdOrderByAppointmentDateDesc(hospitalId)
                .stream()
                .map(AppointmentResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public AppointmentResponse confirmAppointment(UUID id, UUID actorId) {
        Appointment appt = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found"));
        ensureHospitalOrAdmin(appt, actorId);
        if (appt.getStatus() != AppointmentStatus.SCHEDULED) {
            throw new ConflictException("Only scheduled appointments can be confirmed");
        }
        appt.markConfirmed();
        AppointmentResponse response = AppointmentResponse.fromEntity(appointmentRepository.save(appt));
        notificationService.sendNotification(appt.getDonor().getId(), NotificationType.APPOINTMENT_CONFIRMED,
                "Appointment confirmed", "Your blood donation appointment has been confirmed.",
                "APPOINTMENT", id);
        return response;
    }

    @Transactional
    public AppointmentResponse completeAppointment(UUID id) {
        Appointment appt = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found"));
        if (appt.getStatus() != AppointmentStatus.CONFIRMED) {
            throw new ConflictException("Only confirmed appointments can be completed");
        }
        appt.markCompleted();
        return AppointmentResponse.fromEntity(appointmentRepository.save(appt));
    }

    @Transactional
    public AppointmentResponse cancelAppointment(UUID id, UUID actorId) {
        Appointment appt = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found"));
        if (appt.getDonor().getId().equals(actorId)) {
            if (appt.getStatus() != AppointmentStatus.SCHEDULED && appt.getStatus() != AppointmentStatus.CONFIRMED) {
                throw new ConflictException("This appointment can no longer be cancelled");
            }
        } else {
            ensureHospitalOrAdmin(appt, actorId);
        }
        appt.markCancelled();
        AppointmentResponse response = AppointmentResponse.fromEntity(appointmentRepository.save(appt));
        notificationService.sendNotification(appt.getDonor().getId(), NotificationType.APPOINTMENT_CANCELLED,
                "Appointment cancelled", "Your blood donation appointment has been cancelled.",
                "APPOINTMENT", id);
        return response;
    }

    private void ensureHospitalOrAdmin(Appointment appt, UUID actorId) {
        if (!appt.getHospital().getUser().getId().equals(actorId)) {
            User actor = userRepository.findById(actorId)
                    .orElseThrow(() -> new ForbiddenException("You are not authorized for this appointment"));
            if (actor.getRole() != com.redpulse.enums.Role.ADMIN) {
                throw new ForbiddenException("You are not authorized for this appointment");
            }
        }
    }
}

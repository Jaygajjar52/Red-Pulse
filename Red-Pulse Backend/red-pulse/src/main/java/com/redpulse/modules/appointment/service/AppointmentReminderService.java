package com.redpulse.modules.appointment.service;

import com.redpulse.enums.AppointmentStatus;
import com.redpulse.enums.NotificationType;
import com.redpulse.modules.appointment.entity.Appointment;
import com.redpulse.modules.appointment.repository.AppointmentRepository;
import com.redpulse.modules.notification.repository.NotificationRepository;
import com.redpulse.modules.notification.service.NotificationService;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
public class AppointmentReminderService {
    private final AppointmentRepository appointmentRepository;
    private final NotificationRepository notificationRepository;
    private final NotificationService notificationService;

    public AppointmentReminderService(AppointmentRepository appointmentRepository,
                                      NotificationRepository notificationRepository,
                                      NotificationService notificationService) {
        this.appointmentRepository = appointmentRepository;
        this.notificationRepository = notificationRepository;
        this.notificationService = notificationService;
    }

    @Scheduled(cron = "${app.appointment-reminders.cron:0 0 * * * *}")
    @Transactional
    public void sendDueReminders() {
        LocalDate tomorrow = LocalDate.now().plusDays(1);
        for (Appointment appointment : appointmentRepository.findByAppointmentDate(tomorrow)) {
            if (appointment.getStatus() != AppointmentStatus.CONFIRMED) continue;
            if (!notificationRepository.existsByUserIdAndTypeAndReferenceTypeAndReferenceId(
                    appointment.getDonor().getId(), NotificationType.APPOINTMENT_REMINDER,
                    "APPOINTMENT", appointment.getId())) {
                notificationService.sendNotification(appointment.getDonor().getId(),
                        NotificationType.APPOINTMENT_REMINDER, "Appointment reminder",
                        "Your blood donation appointment is tomorrow at "
                                + appointment.getHospital().getHospitalName() + ".",
                        "APPOINTMENT", appointment.getId());
            }
        }
    }
}

package com.redpulse.modules.appointment.repository;

import com.redpulse.enums.AppointmentStatus;
import com.redpulse.modules.appointment.entity.Appointment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, UUID> {

    List<Appointment> findByDonorIdOrderByAppointmentDateDesc(UUID donorId);

    List<Appointment> findByHospitalIdOrderByAppointmentDateDesc(UUID hospitalId);

    List<Appointment> findByStatus(AppointmentStatus status);

    List<Appointment> findByAppointmentDate(LocalDate date);

    boolean existsByDonorIdAndBloodRequestIdAndStatusIn(UUID donorId, UUID bloodRequestId,
                                                        List<AppointmentStatus> statuses);
}

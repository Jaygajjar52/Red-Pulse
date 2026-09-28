import { getData, sendData, wrapPageResponse } from './httpHelpers';
import type { AppointmentApi } from './contracts';
import type { Appointment } from '@/types';
import { asEnumValue, asString } from './typed';

type RawAppointment = Record<string, unknown>;

function normalizeAppointment(apt: RawAppointment): Appointment {
  const appointmentDate = asString(apt.appointmentDate);
  const appointmentTime = asString(apt.appointmentTime);
  const scheduledAt = asString(apt.scheduledAt) ?? (appointmentDate ? `${appointmentDate} ${appointmentTime ?? '00:00:00'}` : '');

  return {
    id: String(apt.id ?? ''),
    donorId: String(apt.donorId ?? ''),
    donorName: asString(apt.donorName),
    hospitalId: String(apt.hospitalId ?? ''),
    hospitalName: asString(apt.hospitalName),
    bloodRequestId: asString(apt.bloodRequestId),
    scheduledAt,
    status: asEnumValue<Appointment['status']>(apt.status, ['SCHEDULED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'], 'SCHEDULED') ?? 'SCHEDULED',
    notes: asString(apt.notes),
  };
}

export const appointmentApi: AppointmentApi = {
  create: async (payload) => {
    let appointmentDate = asString(payload.appointmentDate);
    let appointmentTime = asString(payload.appointmentTime);
    const scheduledAt = asString(payload.scheduledAt);

    if (!appointmentDate && scheduledAt) {
      if (scheduledAt.includes('T')) {
        const [datePart, timePart = '00:00:00'] = scheduledAt.split('T');
        appointmentDate = datePart;
        appointmentTime = timePart.length === 5 ? `${timePart}:00` : timePart;
      } else {
        appointmentDate = scheduledAt;
        appointmentTime = '10:00:00';
      }
    }

    const body = {
      ...payload,
      appointmentDate: appointmentDate ?? new Date().toISOString().split('T')[0],
      appointmentTime: appointmentTime ?? '10:00:00',
    };

    const res = await sendData<RawAppointment>('post', '/api/appointments', body);
    return normalizeAppointment(res);
  },
  list: async (params) => {
    const raw = await getData<unknown>('/api/appointments', params);
    const paged = wrapPageResponse<RawAppointment>(raw);
    return { ...paged, content: paged.content.map(normalizeAppointment) };
  },
  get: async (id) => {
    const res = await getData<RawAppointment>(`/api/appointments/${id}`);
    return normalizeAppointment(res);
  },
  byDonor: async (donorId, params) => {
    const raw = await getData<unknown>(`/api/donors/${donorId}/appointments`, params);
    const paged = wrapPageResponse<RawAppointment>(raw);
    return { ...paged, content: paged.content.map(normalizeAppointment) };
  },
  byHospital: async (hospitalId, params) => {
    const raw = await getData<unknown>(`/api/hospitals/${hospitalId}/appointments`, params);
    const paged = wrapPageResponse<RawAppointment>(raw);
    return { ...paged, content: paged.content.map(normalizeAppointment) };
  },
  confirm: async (id) => {
    const res = await sendData<RawAppointment>('patch', `/api/appointments/${id}/confirm`);
    return normalizeAppointment(res);
  },
  complete: async (id) => {
    const res = await sendData<RawAppointment>('patch', `/api/appointments/${id}/complete`);
    return normalizeAppointment(res);
  },
  cancel: async (id) => {
    const res = await sendData<RawAppointment>('patch', `/api/appointments/${id}/cancel`);
    return normalizeAppointment(res);
  },
};

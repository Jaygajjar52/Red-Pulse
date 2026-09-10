import { z } from 'zod';
import { BloodGroup, Urgency } from '@/types';

const bloodGroup = z.nativeEnum(BloodGroup);
const urgency = z.nativeEnum(Urgency);

export const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});
export type LoginValues = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Enter a valid email'),
  phone: z.string().optional(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['DONOR', 'REQUESTER', 'HOSPITAL']),
});
export type RegisterValues = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email('Enter a valid email'),
});
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

export const donorProfileSchema = z.object({
  bloodGroup,
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  phone: z.string().optional(),
  available: z.boolean(),
});
export type DonorProfileValues = z.infer<typeof donorProfileSchema>;

export const bloodRequestSchema = z.object({
  bloodGroup,
  unitsRequired: z.number().int().min(1, 'At least 1 unit is required').max(20, 'Units must be 20 or fewer'),
  hospitalId: z.string().min(1, 'Hospital is required'),
  requiredDate: z.string().min(1, 'Required date is required'),
  urgency,
  description: z.string().max(500, 'Description must be 500 characters or fewer').optional(),
});
export type BloodRequestValues = z.infer<typeof bloodRequestSchema>;

export const emergencyRequestSchema = z.object({
  bloodGroup,
  unitsRequired: z.number().int().min(1).max(20),
  hospitalId: z.string().min(1, 'Hospital is required'),
  emergencyLevel: urgency,
  approximateLocation: z.string().optional(),
  description: z.string().max(500).optional(),
});
export const emergencySchema = emergencyRequestSchema;
export type EmergencyRequestValues = z.infer<typeof emergencyRequestSchema>;
export type EmergencyValues = EmergencyRequestValues;

export const appointmentSchema = z.object({
  donorId: z.string().min(1),
  hospitalId: z.string().min(1),
  bloodRequestId: z.string().optional(),
  scheduledAt: z.string().min(1, 'Date and time are required'),
  notes: z.string().max(300).optional(),
});
export type AppointmentValues = z.infer<typeof appointmentSchema>;

export const hospitalProfileSchema = z.object({
  name: z.string().min(1, 'Hospital name is required'),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1),
  state: z.string().min(1),
});
export type HospitalProfileValues = z.infer<typeof hospitalProfileSchema>;
export const hospitalSchema = hospitalProfileSchema;
export type HospitalValues = HospitalProfileValues;

export const inventorySchema = z.object({
  bloodGroup,
  availableUnits: z.number().int().min(0),
  reservedUnits: z.number().int().min(0),
  expiryDate: z.string().min(1, 'Expiry date is required'),
});
export type InventoryValues = z.infer<typeof inventorySchema>;

export const locationSchema = z.object({
  city: z.string().min(1),
  state: z.string().min(1),
});
export type LocationValues = z.infer<typeof locationSchema>;

export const reportFilterSchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  bloodGroup: z.string().optional(),
  city: z.string().optional(),
  status: z.string().optional(),
  urgency: z.string().optional(),
  format: z.enum(['csv', 'pdf']),
});
export type ReportFilterValues = z.infer<typeof reportFilterSchema>;

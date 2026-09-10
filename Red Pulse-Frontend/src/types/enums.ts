export const UserRole = {
  DONOR: 'DONOR',
  REQUESTER: 'REQUESTER',
  HOSPITAL: 'HOSPITAL',
  ADMIN: 'ADMIN',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const UserStatus = {
  ACTIVE: 'ACTIVE',
  BLOCKED: 'BLOCKED',
  PENDING: 'PENDING',
} as const;
export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];

export const BloodGroup = {
  A_POSITIVE: 'A_POSITIVE',
  A_NEGATIVE: 'A_NEGATIVE',
  B_POSITIVE: 'B_POSITIVE',
  B_NEGATIVE: 'B_NEGATIVE',
  AB_POSITIVE: 'AB_POSITIVE',
  AB_NEGATIVE: 'AB_NEGATIVE',
  O_POSITIVE: 'O_POSITIVE',
  O_NEGATIVE: 'O_NEGATIVE',
} as const;
export type BloodGroup = (typeof BloodGroup)[keyof typeof BloodGroup];

export const RequestStatus = {
  PENDING: 'PENDING',
  MATCHED: 'MATCHED',
  PARTIALLY_FULFILLED: 'PARTIALLY_FULFILLED',
  FULFILLED: 'FULFILLED',
  CANCELLED: 'CANCELLED',
} as const;
export type RequestStatus = (typeof RequestStatus)[keyof typeof RequestStatus];

export const Urgency = {
  NORMAL: 'NORMAL',
  URGENT: 'URGENT',
  EMERGENCY: 'EMERGENCY',
} as const;
export type Urgency = (typeof Urgency)[keyof typeof Urgency];

export const AppointmentStatus = {
  SCHEDULED: 'SCHEDULED',
  CONFIRMED: 'CONFIRMED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  NO_SHOW: 'NO_SHOW',
} as const;
export type AppointmentStatus = (typeof AppointmentStatus)[keyof typeof AppointmentStatus];

export const DonationStatus = {
  SCHEDULED: 'SCHEDULED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;
export type DonationStatus = (typeof DonationStatus)[keyof typeof DonationStatus];

export const VerificationStatus = {
  VERIFIED: 'VERIFIED',
  UNVERIFIED: 'UNVERIFIED',
  PENDING: 'PENDING',
} as const;
export type VerificationStatus = (typeof VerificationStatus)[keyof typeof VerificationStatus];

export const InventoryStockStatus = {
  ADEQUATE: 'ADEQUATE',
  LOW: 'LOW',
  CRITICAL: 'CRITICAL',
  EXPIRED: 'EXPIRED',
} as const;
export type InventoryStockStatus = (typeof InventoryStockStatus)[keyof typeof InventoryStockStatus];

export const EmergencyStatus = {
  OPEN: 'OPEN',
  ALERT_SENT: 'ALERT_SENT',
  RESOLVED: 'RESOLVED',
  CANCELLED: 'CANCELLED',
} as const;
export type EmergencyStatus = (typeof EmergencyStatus)[keyof typeof EmergencyStatus];

export const NotificationType = {
  EMERGENCY: 'EMERGENCY',
  BLOOD_REQUEST: 'BLOOD_REQUEST',
  DONATION_REQUEST: 'DONATION_REQUEST',
  APPOINTMENT: 'APPOINTMENT',
  DONATION_ACCEPTED: 'DONATION_ACCEPTED',
  SYSTEM: 'SYSTEM',
} as const;
export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];

export const HospitalStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  PENDING: 'PENDING',
} as const;
export type HospitalStatus = (typeof HospitalStatus)[keyof typeof HospitalStatus];

export const ReportFormat = {
  CSV: 'csv',
  PDF: 'pdf',
} as const;
export type ReportFormat = (typeof ReportFormat)[keyof typeof ReportFormat];

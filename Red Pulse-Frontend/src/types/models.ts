import type {
  AppointmentStatus,
  BloodGroup,
  DonationStatus,
  EmergencyStatus,
  HospitalStatus,
  InventoryStockStatus,
  NotificationType,
  RequestStatus,
  Urgency,
  UserRole,
  UserStatus,
  VerificationStatus,
} from './enums';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  city?: string;
  state?: string;
  hospitalId?: string;
  donorId?: string;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken?: string;
  tokenType?: string;
  expiresIn?: number;
  user: User;
}

export interface DonorProfile {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  bloodGroup: BloodGroup;
  city: string;
  state: string;
  available: boolean;
  verificationStatus: VerificationStatus;
  lastDonationDate?: string;
}

export interface Hospital {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address: string;
  city: string;
  state: string;
  status: HospitalStatus;
  latitude?: number;
  longitude?: number;
}

export interface BloodRequest {
  id: string;
  requesterId: string;
  requesterName?: string;
  bloodGroup: BloodGroup;
  unitsRequired: number;
  unitsFulfilled?: number;
  hospitalId: string;
  hospitalName?: string;
  city?: string;
  state?: string;
  requiredDate: string;
  urgency: Urgency;
  description?: string;
  status: RequestStatus;
  createdAt: string;
  approximateLocation?: string;
  distanceKm?: number;
}

export interface BloodInventory {
  id: string;
  hospitalId: string;
  bloodGroup: BloodGroup;
  availableUnits: number;
  reservedUnits: number;
  expiryDate: string;
  stockStatus: InventoryStockStatus;
  updatedAt: string;
}

export interface DonationRequest {
  id: string;
  bloodRequestId: string;
  donorId: string;
  status: RequestStatus;
  createdAt: string;
}

export interface DonationRecord {
  id: string;
  donorId: string;
  donorName?: string;
  hospitalId: string;
  hospitalName?: string;
  bloodGroup: BloodGroup;
  units: number;
  status: DonationStatus;
  appointmentId?: string;
  donatedAt: string;
}

export interface Appointment {
  id: string;
  donorId: string;
  donorName?: string;
  hospitalId: string;
  hospitalName?: string;
  bloodRequestId?: string;
  scheduledAt: string;
  status: AppointmentStatus;
  notes?: string;
}

export interface DonorLocation {
  donorId: string;
  city: string;
  state: string;
  approximateLatitude?: number;
  approximateLongitude?: number;
  updatedAt: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface DonorContribution {
  donorId: string;
  totalDonations: number;
  completedDonations: number;
  totalUnits: number;
  history: DonationRecord[];
}

export interface DonorBadge {
  id: string;
  donorId: string;
  name: string;
  description: string;
  earnedAt: string;
}

export interface DonorMilestone {
  id: string;
  name: string;
  description: string;
  target: number;
  progress: number;
  achieved: boolean;
}

export interface DonorStatistics {
  donorId: string;
  totalDonations: number;
  completedDonations: number;
  totalUnits: number;
  lastDonationDate?: string;
}

export interface LeaderboardEntry {
  donorId: string;
  displayName: string;
  totalUnits: number;
  totalDonations: number;
  rank: number;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId?: string;
  userEmail?: string;
  action: string;
  entity: string;
  entityId?: string;
  description: string;
  ipAddress?: string;
}

export interface AnalyticsOverview {
  totalUsers: number;
  totalDonors: number;
  totalHospitals: number;
  totalDonations: number;
  activeBloodRequests: number;
  emergencyRequests: number;
  totalBloodInventory: number;
}

export interface TimeSeriesPoint {
  date: string;
  value: number;
  label?: string;
}

export interface NamedCount {
  name: string;
  value: number;
}

export interface AnalyticsPayload {
  series: TimeSeriesPoint[];
  breakdown: NamedCount[];
}

export interface ReportFilters {
  from?: string;
  to?: string;
  bloodGroup?: BloodGroup;
  city?: string;
  status?: string;
  urgency?: Urgency;
  format?: 'csv' | 'pdf';
  [key: string]: unknown;
}

export interface EmergencyRequest {
  id: string;
  requesterId: string;
  bloodGroup: BloodGroup;
  unitsRequired: number;
  hospitalId: string;
  hospitalName?: string;
  approximateLocation?: string;
  emergencyLevel: Urgency;
  status: EmergencyStatus;
  createdAt: string;
  description?: string;
}

export interface MatchResult {
  donorId: string;
  bloodGroup: BloodGroup;
  approximateDistanceKm?: number;
  available: boolean;
  verificationStatus: VerificationStatus;
  matchScore?: number;
}

export interface PageRequest {
  page?: number;
  size?: number;
  sort?: string;
  search?: string;
  [key: string]: unknown;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface ApiErrorBody {
  timestamp?: string;
  status: number;
  message: string;
  errors?: Record<string, string>;
  code?: string;
}

export interface ApiError extends Error {
  status: number;
  body: ApiErrorBody;
  fieldErrors?: Record<string, string>;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: Exclude<UserRole, 'ADMIN'>;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

export interface CreateBloodRequestPayload {
  bloodGroup: BloodGroup;
  unitsRequired: number;
  hospitalId: string;
  requiredDate: string;
  urgency: Urgency;
  description?: string;
}

export interface CreateEmergencyRequestPayload {
  bloodGroup: BloodGroup;
  unitsRequired: number;
  hospitalId: string;
  emergencyLevel: Urgency;
  description?: string;
  approximateLocation?: string;
}

export interface CreateAppointmentPayload {
  donorId: string;
  hospitalId: string;
  bloodRequestId?: string;
  scheduledAt: string;
  notes?: string;
}

export interface InventoryPayload {
  bloodGroup: BloodGroup;
  availableUnits: number;
  reservedUnits: number;
  expiryDate: string;
}

export interface StockUpdatePayload {
  availableUnits: number;
  reservedUnits?: number;
}

export interface HospitalPayload {
  name: string;
  email?: string;
  phone?: string;
  address: string;
  city: string;
  state: string;
  latitude?: number;
  longitude?: number;
}

export interface UserProfileUpdate {
  firstName: string;
  lastName: string;
  phone?: string;
  city?: string;
  state?: string;
}

export interface DonorProfilePayload {
  bloodGroup: BloodGroup;
  city: string;
  state: string;
  available: boolean;
  phone?: string;
}

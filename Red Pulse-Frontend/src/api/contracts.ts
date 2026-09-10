import type {
  AnalyticsOverview,
  AnalyticsPayload,
  Appointment,
  AppNotification,
  AuditLog,
  AuthResponse,
  BloodInventory,
  BloodRequest,
  CreateAppointmentPayload,
  CreateBloodRequestPayload,
  CreateEmergencyRequestPayload,
  DonationRecord,
  DonorBadge,
  DonorContribution,
  DonorLocation,
  DonorMilestone,
  DonorProfile,
  DonorProfilePayload,
  DonorStatistics,
  EmergencyRequest,
  ForgotPasswordRequest,
  Hospital,
  HospitalPayload,
  InventoryPayload,
  LeaderboardEntry,
  LoginRequest,
  MatchResult,
  PageRequest,
  PageResponse,
  RegisterRequest,
  ReportFilters,
  ResetPasswordRequest,
  StockUpdatePayload,
  User,
  UserProfileUpdate,
} from '@/types';

export interface AuthApi {
  register: (payload: RegisterRequest) => Promise<AuthResponse>;
  login: (payload: LoginRequest) => Promise<AuthResponse>;
  me: () => Promise<User>;
  refresh: (refreshToken: string) => Promise<AuthResponse>;
  forgotPassword: (payload: ForgotPasswordRequest) => Promise<void>;
  resetPassword: (payload: ResetPasswordRequest) => Promise<void>;
}

export interface UserApi {
  getMe: () => Promise<User>;
  updateMe: (payload: UserProfileUpdate) => Promise<User>;
}

export interface DonorApi {
  getProfile: () => Promise<DonorProfile>;
  createProfile: (payload: DonorProfilePayload) => Promise<DonorProfile>;
  updateProfile: (payload: DonorProfilePayload) => Promise<DonorProfile>;
  patchAvailability: (available: boolean) => Promise<DonorProfile>;
  getById: (id: string) => Promise<DonorProfile>;
}

export interface BloodRequestApi {
  create: (payload: CreateBloodRequestPayload) => Promise<BloodRequest>;
  list: (params?: PageRequest & Record<string, unknown>) => Promise<PageResponse<BloodRequest>>;
  get: (id: string) => Promise<BloodRequest>;
  update: (id: string, payload: Partial<CreateBloodRequestPayload>) => Promise<BloodRequest>;
  cancel: (id: string) => Promise<BloodRequest>;
  fulfill: (id: string) => Promise<BloodRequest>;
  my: (params?: PageRequest) => Promise<PageResponse<BloodRequest>>;
  emergency: (params?: PageRequest) => Promise<PageResponse<BloodRequest>>;
}

export interface InventoryApi {
  list: (hospitalId: string, params?: PageRequest) => Promise<PageResponse<BloodInventory>>;
  getByGroup: (hospitalId: string, bloodGroup: string) => Promise<BloodInventory[]>;
  create: (hospitalId: string, payload: InventoryPayload) => Promise<BloodInventory>;
  update: (hospitalId: string, inventoryId: string, payload: InventoryPayload) => Promise<BloodInventory>;
  updateStock: (hospitalId: string, inventoryId: string, payload: StockUpdatePayload) => Promise<BloodInventory>;
  lowStock: (hospitalId: string) => Promise<BloodInventory[]>;
  expiring: (hospitalId: string) => Promise<BloodInventory[]>;
}

export interface MatchingApi {
  list: (requestId: string) => Promise<MatchResult[]>;
  nearby: (requestId: string) => Promise<MatchResult[]>;
  match: (requestId: string) => Promise<MatchResult[]>;
  notify: (requestId: string, donorId: string) => Promise<void>;
  matchScore: (donorId: string, requestId: string) => Promise<{ score: number }>;
}

export interface EmergencyApi {
  create: (payload: CreateEmergencyRequestPayload) => Promise<EmergencyRequest>;
  list: (params?: PageRequest) => Promise<PageResponse<EmergencyRequest>>;
  get: (id: string) => Promise<EmergencyRequest>;
  alertDonors: (id: string) => Promise<EmergencyRequest>;
  resolve: (id: string) => Promise<EmergencyRequest>;
}

export interface AppointmentApi {
  create: (payload: CreateAppointmentPayload) => Promise<Appointment>;
  list: (params?: PageRequest) => Promise<PageResponse<Appointment>>;
  get: (id: string) => Promise<Appointment>;
  byDonor: (donorId: string, params?: PageRequest) => Promise<PageResponse<Appointment>>;
  byHospital: (hospitalId: string, params?: PageRequest) => Promise<PageResponse<Appointment>>;
  confirm: (id: string) => Promise<Appointment>;
  complete: (id: string) => Promise<Appointment>;
  cancel: (id: string) => Promise<Appointment>;
}

export interface LocationApi {
  getDonorLocation: (donorId: string) => Promise<DonorLocation>;
  updateDonorLocation: (donorId: string, payload: Partial<DonorLocation>) => Promise<DonorLocation>;
  nearbyDonors: (params?: PageRequest & { city?: string }) => Promise<MatchResult[]>;
  nearbyHospitals: (params?: PageRequest & { city?: string }) => Promise<Hospital[]>;
}

export interface NotificationApi {
  list: (params?: PageRequest) => Promise<PageResponse<AppNotification>>;
  unread: () => Promise<AppNotification[]>;
  markRead: (id: string) => Promise<AppNotification>;
  markAllRead: () => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export interface ContributionApi {
  get: (donorId: string) => Promise<DonorContribution>;
  donations: (donorId: string, params?: PageRequest) => Promise<PageResponse<DonationRecord>>;
  milestones: (donorId?: string) => Promise<DonorMilestone[]>;
  badges: (donorId?: string) => Promise<DonorBadge[]>;
  statistics: (donorId: string) => Promise<DonorStatistics>;
  leaderboard: () => Promise<LeaderboardEntry[]>;
}

export interface DonationApi {
  create: (payload: Partial<DonationRecord>) => Promise<DonationRecord>;
  list: (params?: PageRequest & Record<string, unknown>) => Promise<PageResponse<DonationRecord>>;
  get: (id: string) => Promise<DonationRecord>;
  complete: (id: string) => Promise<DonationRecord>;
  cancel: (id: string) => Promise<DonationRecord>;
}

export interface HospitalApi {
  list: (params?: PageRequest) => Promise<PageResponse<Hospital>>;
  get: (id: string) => Promise<Hospital>;
  create: (payload: HospitalPayload) => Promise<Hospital>;
  update: (id: string, payload: HospitalPayload) => Promise<Hospital>;
  remove: (id: string) => Promise<void>;
  bloodRequests: (id: string, params?: PageRequest) => Promise<PageResponse<BloodRequest>>;
}

export interface AnalyticsApi {
  overview: () => Promise<AnalyticsOverview>;
  donations: (params?: ReportFilters) => Promise<AnalyticsPayload>;
  bloodRequests: (params?: ReportFilters) => Promise<AnalyticsPayload>;
  inventory: () => Promise<AnalyticsPayload>;
  emergencyRequests: (params?: ReportFilters) => Promise<AnalyticsPayload>;
  users: () => Promise<AnalyticsPayload>;
  bloodGroups: () => Promise<AnalyticsPayload>;
}

export interface ReportApi {
  download: (type: ReportType, filters: ReportFilters) => Promise<{ data: Blob; contentDisposition?: string }>;
}

export type ReportType = 'donations' | 'blood-requests' | 'inventory' | 'donors' | 'hospitals' | 'emergency-requests';

export interface AdminApi {
  users: (params?: PageRequest & { role?: string; status?: string }) => Promise<PageResponse<User>>;
  user: (id: string) => Promise<User>;
  blockUser: (id: string) => Promise<User>;
  unblockUser: (id: string) => Promise<User>;
  donors: (params?: PageRequest) => Promise<PageResponse<DonorProfile>>;
  verifyDonor: (id: string) => Promise<DonorProfile>;
  hospitals: (params?: PageRequest) => Promise<PageResponse<Hospital>>;
  auditLogs: (params?: PageRequest) => Promise<PageResponse<AuditLog>>;
  auditLog: (id: string) => Promise<AuditLog>;
  filterAuditLogs: (params?: PageRequest & Record<string, unknown>) => Promise<PageResponse<AuditLog>>;
  exportAuditLogs: (params?: ReportFilters) => Promise<{ data: Blob; contentDisposition?: string }>;
}

export interface ApiBundle {
  authApi: AuthApi;
  userApi: UserApi;
  donorApi: DonorApi;
  bloodRequestApi: BloodRequestApi;
  inventoryApi: InventoryApi;
  matchingApi: MatchingApi;
  emergencyApi: EmergencyApi;
  appointmentApi: AppointmentApi;
  locationApi: LocationApi;
  notificationApi: NotificationApi;
  contributionApi: ContributionApi;
  donationApi: DonationApi;
  analyticsApi: AnalyticsApi;
  reportApi: ReportApi;
  hospitalApi: HospitalApi;
  adminApi: AdminApi;
}

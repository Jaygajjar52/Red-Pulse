import type {
  Appointment,
  AppNotification,
  AuditLog,
  BloodInventory,
  BloodRequest,
  DonationRecord,
  DonorBadge,
  DonorLocation,
  DonorMilestone,
  DonorProfile,
  EmergencyRequest,
  Hospital,
  MatchResult,
  User,
} from '@/types';

export const DEMO_BANNER = 'Demo data — mock API mode';

export const demoPasswords: Record<string, string> = {
  'donor@redpulse.dev': 'Donor123!',
  'requester@redpulse.dev': 'Requester123!',
  'hospital@redpulse.dev': 'Hospital123!',
  'admin@redpulse.dev': 'Admin123!',
};

export const users: User[] = [
  {
    id: 'user-donor',
    email: 'donor@redpulse.dev',
    firstName: 'Amina',
    lastName: 'Rahman',
    phone: '+1-555-0101',
    role: 'DONOR',
    status: 'ACTIVE',
    donorId: 'donor-1',
    city: 'Austin',
    state: 'TX',
    createdAt: '2026-01-12T10:00:00.000Z',
  },
  {
    id: 'user-requester',
    email: 'requester@redpulse.dev',
    firstName: 'Noah',
    lastName: 'Patel',
    phone: '+1-555-0102',
    role: 'REQUESTER',
    status: 'ACTIVE',
    city: 'Austin',
    state: 'TX',
    createdAt: '2026-02-02T10:00:00.000Z',
  },
  {
    id: 'user-hospital',
    email: 'hospital@redpulse.dev',
    firstName: 'Grace',
    lastName: 'Chen',
    phone: '+1-555-0103',
    role: 'HOSPITAL',
    status: 'ACTIVE',
    hospitalId: 'hospital-1',
    city: 'Austin',
    state: 'TX',
    createdAt: '2026-01-04T10:00:00.000Z',
  },
  {
    id: 'user-admin',
    email: 'admin@redpulse.dev',
    firstName: 'Jordan',
    lastName: 'Ellis',
    phone: '+1-555-0104',
    role: 'ADMIN',
    status: 'ACTIVE',
    city: 'Austin',
    state: 'TX',
    createdAt: '2026-01-01T10:00:00.000Z',
  },
];

export const donorProfiles: DonorProfile[] = [
  {
    id: 'donor-1',
    userId: 'user-donor',
    firstName: 'Amina',
    lastName: 'Rahman',
    email: 'donor@redpulse.dev',
    phone: '+1-555-0101',
    bloodGroup: 'O_NEGATIVE',
    city: 'Austin',
    state: 'TX',
    available: true,
    verificationStatus: 'VERIFIED',
    lastDonationDate: '2026-06-18T09:00:00.000Z',
  },
  {
    id: 'donor-2',
    userId: 'user-donor-2',
    firstName: 'Luis',
    lastName: 'Ortega',
    email: 'luis.ortega@example.com',
    bloodGroup: 'A_POSITIVE',
    city: 'Round Rock',
    state: 'TX',
    available: true,
    verificationStatus: 'VERIFIED',
  },
  {
    id: 'donor-3',
    userId: 'user-donor-3',
    firstName: 'Priya',
    lastName: 'Shah',
    email: 'priya.shah@example.com',
    bloodGroup: 'B_POSITIVE',
    city: 'Austin',
    state: 'TX',
    available: false,
    verificationStatus: 'UNVERIFIED',
  },
];

export const hospitals: Hospital[] = [
  {
    id: 'hospital-1',
    name: 'St. Helena Medical Center',
    email: 'bloodbank@sthelena.example',
    phone: '+1-555-2001',
    address: '1200 Congress Ave',
    city: 'Austin',
    state: 'TX',
    status: 'ACTIVE',
    latitude: 30.2672,
    longitude: -97.7431,
  },
  {
    id: 'hospital-2',
    name: 'Riverbend Community Hospital',
    email: 'lab@riverbend.example',
    phone: '+1-555-2002',
    address: '88 Riverside Dr',
    city: 'Austin',
    state: 'TX',
    status: 'ACTIVE',
  },
];

export const bloodRequests: BloodRequest[] = [
  {
    id: 'req-1',
    requesterId: 'user-requester',
    requesterName: 'Noah Patel',
    bloodGroup: 'O_NEGATIVE',
    unitsRequired: 3,
    unitsFulfilled: 1,
    hospitalId: 'hospital-1',
    hospitalName: 'St. Helena Medical Center',
    city: 'Austin',
    state: 'TX',
    requiredDate: '2026-09-10T15:00:00.000Z',
    urgency: 'EMERGENCY',
    description: 'Trauma support request submitted through Red Pulse.',
    status: 'PARTIALLY_FULFILLED',
    createdAt: '2026-09-07T18:12:00.000Z',
    approximateLocation: 'Downtown Austin',
    distanceKm: 4.2,
  },
  {
    id: 'req-2',
    requesterId: 'user-requester',
    requesterName: 'Noah Patel',
    bloodGroup: 'A_POSITIVE',
    unitsRequired: 2,
    unitsFulfilled: 0,
    hospitalId: 'hospital-2',
    hospitalName: 'Riverbend Community Hospital',
    city: 'Austin',
    state: 'TX',
    requiredDate: '2026-09-14T10:00:00.000Z',
    urgency: 'URGENT',
    description: 'Scheduled surgery support.',
    status: 'PENDING',
    createdAt: '2026-09-06T09:00:00.000Z',
    approximateLocation: 'East Austin',
    distanceKm: 8.1,
  },
  {
    id: 'req-3',
    requesterId: 'user-requester-2',
    requesterName: 'Maya Cole',
    bloodGroup: 'B_POSITIVE',
    unitsRequired: 1,
    hospitalId: 'hospital-1',
    hospitalName: 'St. Helena Medical Center',
    city: 'Austin',
    state: 'TX',
    requiredDate: '2026-08-20T10:00:00.000Z',
    urgency: 'NORMAL',
    status: 'FULFILLED',
    createdAt: '2026-08-12T09:00:00.000Z',
    approximateLocation: 'Central Austin',
    distanceKm: 3.4,
  },
];

export const inventory: BloodInventory[] = [
  {
    id: 'inv-1',
    hospitalId: 'hospital-1',
    bloodGroup: 'O_NEGATIVE',
    availableUnits: 4,
    reservedUnits: 2,
    expiryDate: '2026-09-12T00:00:00.000Z',
    stockStatus: 'LOW',
    updatedAt: '2026-09-07T08:00:00.000Z',
  },
  {
    id: 'inv-2',
    hospitalId: 'hospital-1',
    bloodGroup: 'O_POSITIVE',
    availableUnits: 18,
    reservedUnits: 3,
    expiryDate: '2026-09-22T00:00:00.000Z',
    stockStatus: 'ADEQUATE',
    updatedAt: '2026-09-07T08:00:00.000Z',
  },
  {
    id: 'inv-3',
    hospitalId: 'hospital-1',
    bloodGroup: 'A_POSITIVE',
    availableUnits: 2,
    reservedUnits: 1,
    expiryDate: '2026-09-09T00:00:00.000Z',
    stockStatus: 'CRITICAL',
    updatedAt: '2026-09-08T08:00:00.000Z',
  },
];

export const donations: DonationRecord[] = [
  {
    id: 'don-1',
    donorId: 'donor-1',
    donorName: 'Amina Rahman',
    hospitalId: 'hospital-1',
    hospitalName: 'St. Helena Medical Center',
    bloodGroup: 'O_NEGATIVE',
    units: 1,
    status: 'COMPLETED',
    appointmentId: 'apt-1',
    donatedAt: '2026-06-18T09:00:00.000Z',
  },
  {
    id: 'don-2',
    donorId: 'donor-1',
    donorName: 'Amina Rahman',
    hospitalId: 'hospital-2',
    hospitalName: 'Riverbend Community Hospital',
    bloodGroup: 'O_NEGATIVE',
    units: 1,
    status: 'SCHEDULED',
    appointmentId: 'apt-2',
    donatedAt: '2026-09-11T14:00:00.000Z',
  },
];

export const appointments: Appointment[] = [
  {
    id: 'apt-1',
    donorId: 'donor-1',
    donorName: 'Amina Rahman',
    hospitalId: 'hospital-1',
    hospitalName: 'St. Helena Medical Center',
    bloodRequestId: 'req-3',
    scheduledAt: '2026-06-18T09:00:00.000Z',
    status: 'COMPLETED',
  },
  {
    id: 'apt-2',
    donorId: 'donor-1',
    donorName: 'Amina Rahman',
    hospitalId: 'hospital-2',
    hospitalName: 'Riverbend Community Hospital',
    bloodRequestId: 'req-1',
    scheduledAt: '2026-09-11T14:00:00.000Z',
    status: 'CONFIRMED',
  },
];

export const emergencies: EmergencyRequest[] = [
  {
    id: 'em-1',
    requesterId: 'user-requester',
    bloodGroup: 'O_NEGATIVE',
    unitsRequired: 3,
    hospitalId: 'hospital-1',
    hospitalName: 'St. Helena Medical Center',
    approximateLocation: 'Downtown Austin',
    emergencyLevel: 'EMERGENCY',
    status: 'ALERT_SENT',
    createdAt: '2026-09-07T18:12:00.000Z',
    description: 'Immediate O- support requested.',
  },
];

export const notifications: AppNotification[] = [
  {
    id: 'nt-1',
    userId: 'user-donor',
    type: 'EMERGENCY',
    title: 'Nearby emergency request',
    message: 'An O- emergency request is open near Downtown Austin.',
    read: false,
    createdAt: '2026-09-07T18:15:00.000Z',
  },
  {
    id: 'nt-2',
    userId: 'user-donor',
    type: 'APPOINTMENT',
    title: 'Appointment confirmed',
    message: 'Your appointment at Riverbend Community Hospital is confirmed.',
    read: true,
    createdAt: '2026-09-06T12:00:00.000Z',
  },
  {
    id: 'nt-3',
    userId: 'user-requester',
    type: 'BLOOD_REQUEST',
    title: 'Match update',
    message: 'A donor match is available for request req-1.',
    read: false,
    createdAt: '2026-09-07T19:00:00.000Z',
  },
];

export const matches: Record<string, MatchResult[]> = {
  'req-1': [
    {
      donorId: 'donor-1',
      bloodGroup: 'O_NEGATIVE',
      approximateDistanceKm: 4.2,
      available: true,
      verificationStatus: 'VERIFIED',
      matchScore: 92,
    },
  ],
  'req-2': [
    {
      donorId: 'donor-2',
      bloodGroup: 'A_POSITIVE',
      approximateDistanceKm: 11.4,
      available: true,
      verificationStatus: 'VERIFIED',
      matchScore: 81,
    },
  ],
};

export const locations: DonorLocation[] = [
  {
    donorId: 'donor-1',
    city: 'Austin',
    state: 'TX',
    approximateLatitude: 30.28,
    approximateLongitude: -97.74,
    updatedAt: '2026-09-01T00:00:00.000Z',
  },
];

export const badges: DonorBadge[] = [
  {
    id: 'badge-1',
    donorId: 'donor-1',
    name: 'First Pulse',
    description: 'Completed a first recorded donation on Red Pulse.',
    earnedAt: '2026-06-18T09:00:00.000Z',
  },
];

export const milestones: DonorMilestone[] = [
  { id: 'ms-1', name: 'Lifesaver I', description: 'Complete 1 donation', target: 1, progress: 1, achieved: true },
  { id: 'ms-2', name: 'Lifesaver II', description: 'Complete 5 donations', target: 5, progress: 1, achieved: false },
];

export const auditLogs: AuditLog[] = [
  {
    id: 'audit-1',
    timestamp: '2026-09-07T18:12:00.000Z',
    userId: 'user-requester',
    userEmail: 'requester@redpulse.dev',
    action: 'CREATE',
    entity: 'BloodRequest',
    entityId: 'req-1',
    description: 'Blood request created',
    ipAddress: '203.0.113.10',
  },
  {
    id: 'audit-2',
    timestamp: '2026-09-07T18:16:00.000Z',
    userId: 'user-admin',
    userEmail: 'admin@redpulse.dev',
    action: 'VIEW',
    entity: 'EmergencyRequest',
    entityId: 'em-1',
    description: 'Emergency request reviewed',
  },
];

export const extraUsers: User[] = [
  {
    id: 'user-blocked',
    email: 'blocked@redpulse.dev',
    firstName: 'Sam',
    lastName: 'Lee',
    role: 'REQUESTER',
    status: 'BLOCKED',
    city: 'Dallas',
    state: 'TX',
    createdAt: '2026-03-01T00:00:00.000Z',
  },
];

import type { ApiBundle, ReportType } from '@/api/contracts';
import type {
  Appointment,
  AppNotification,
  AuthResponse,
  BloodInventory,
  BloodRequest,
  DonationRecord,
  DonorProfile,
  EmergencyRequest,
  Hospital,
  PageRequest,
  User,
} from '@/types';
import {
  appointments,
  auditLogs,
  badges,
  bloodRequests,
  demoPasswords,
  donations,
  donorProfiles,
  emergencies,
  extraUsers,
  hospitals,
  inventory,
  locations,
  matches,
  milestones,
  notifications,
  users,
} from './data';
import { id, mockFail, nowIso, paginate } from './helpers';

const db = {
  users: [...users, ...extraUsers],
  donorProfiles: [...donorProfiles],
  hospitals: [...hospitals],
  bloodRequests: [...bloodRequests],
  inventory: [...inventory],
  donations: [...donations],
  appointments: [...appointments],
  emergencies: [...emergencies],
  notifications: [...notifications],
  passwords: { ...demoPasswords },
  refreshTokens: new Map<string, string>(),
};

function requireUser(email: string): User {
  const user = db.users.find((item) => item.email === email);
  if (!user) mockFail(401, 'Invalid credentials.');
  return user;
}

function tokenFor(user: User): AuthResponse {
  const accessToken = `mock-access-${user.id}`;
  const refreshToken = `mock-refresh-${user.id}`;
  db.refreshTokens.set(refreshToken, user.id);
  return { accessToken, refreshToken, tokenType: 'Bearer', user };
}

function currentUserFromToken(): User | undefined {
  const raw = localStorage.getItem('redpulse.accessToken');
  if (!raw?.startsWith('mock-access-')) return undefined;
  const userId = raw.replace('mock-access-', '');
  return db.users.find((u) => u.id === userId);
}

function requireAuth(): User {
  const user = currentUserFromToken();
  if (!user) mockFail(401, 'Your session has expired. Please sign in again.');
  return user;
}

function pageParams(params?: PageRequest) {
  return { page: params?.page ?? 1, size: params?.size ?? 10, search: params?.search?.toLowerCase() };
}

function searchFilter<T>(items: T[], search: string | undefined, pick: (item: T) => string): T[] {
  if (!search) return items;
  return items.filter((item) => pick(item).toLowerCase().includes(search));
}

function blobReport(name: string, format: string | undefined): { data: Blob; contentDisposition: string } {
  const ext = format === 'pdf' ? 'pdf' : 'csv';
  const content = ext === 'csv' ? `demo,report\nRed Pulse,${name}` : `%PDF-DEMO Red Pulse ${name}`;
  const type = ext === 'csv' ? 'text/csv' : 'application/pdf';
  return {
    data: new Blob([content], { type }),
    contentDisposition: `attachment; filename="${name}.${ext}"`,
  };
}

export const mockApis: ApiBundle = {
  authApi: {
    register: async (payload) => {
      if ((payload.role as string) === 'ADMIN') mockFail(403, 'Administrator accounts cannot be created from registration.');
      if (db.users.some((u) => u.email === payload.email)) mockFail(409, 'An account with this email already exists.');
      const user: User = {
        id: id('user'),
        email: payload.email,
        firstName: payload.firstName,
        lastName: payload.lastName,
        phone: payload.phone,
        role: payload.role,
        status: 'ACTIVE',
        createdAt: nowIso(),
      };
      db.users.push(user);
      db.passwords[payload.email] = payload.password;
      return tokenFor(user);
    },
    login: async ({ email, password }) => {
      const expected = db.passwords[email];
      if (!expected || expected !== password) mockFail(401, 'Invalid email or password.');
      const user = requireUser(email);
      if (user.status === 'BLOCKED') mockFail(403, 'This account is blocked.');
      return tokenFor(user);
    },
    me: async () => requireAuth(),
    refresh: async (refreshToken) => {
      const userId = db.refreshTokens.get(refreshToken);
      const user = db.users.find((u) => u.id === userId);
      if (!user) mockFail(401, 'Your session has expired. Please sign in again.');
      return tokenFor(user);
    },
    forgotPassword: async ({ email }) => {
      if (!db.passwords[email]) mockFail(404, 'If this email exists, a reset link will be sent.');
    },
    resetPassword: async ({ token, password }) => {
      if (!token) mockFail(400, 'A reset token is required.');
      const donor = db.users.find((u) => u.email === 'donor@redpulse.dev');
      if (donor) db.passwords[donor.email] = password;
    },
  },
  userApi: {
    getMe: async () => requireAuth(),
    updateMe: async (payload) => {
      const user = requireAuth();
      Object.assign(user, payload);
      return user;
    },
  },
  donorApi: {
    getProfile: async () => {
      const user = requireAuth();
      const profile = db.donorProfiles.find((d) => d.userId === user.id);
      if (!profile) mockFail(404, 'Donor profile not found.');
      return profile;
    },
    createProfile: async (payload) => {
      const user = requireAuth();
      const profile: DonorProfile = {
        id: id('donor'),
        userId: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        ...payload,
        verificationStatus: 'UNVERIFIED',
      };
      db.donorProfiles.push(profile);
      return profile;
    },
    updateProfile: async (payload) => {
      const user = requireAuth();
      const profile = db.donorProfiles.find((d) => d.userId === user.id);
      if (!profile) mockFail(404, 'Donor profile not found.');
      Object.assign(profile, payload);
      return profile;
    },
    patchAvailability: async (available) => {
      const user = requireAuth();
      const profile = db.donorProfiles.find((d) => d.userId === user.id);
      if (!profile) mockFail(404, 'Donor profile not found.');
      profile.available = available;
      return profile;
    },
    getById: async (donorId) => {
      requireAuth();
      const profile = db.donorProfiles.find((d) => d.id === donorId);
      if (!profile) mockFail(404, 'Donor profile not found.');
      return profile;
    },
  },
  bloodRequestApi: {
    create: async (payload) => {
      const user = requireAuth();
      const hospital = db.hospitals.find((h) => h.id === payload.hospitalId);
      const request: BloodRequest = {
        id: id('req'),
        requesterId: user.id,
        requesterName: `${user.firstName} ${user.lastName}`,
        ...payload,
        hospitalName: hospital?.name,
        city: hospital?.city,
        state: hospital?.state,
        status: 'PENDING',
        createdAt: nowIso(),
        unitsFulfilled: 0,
        approximateLocation: hospital?.city,
      };
      db.bloodRequests.unshift(request);
      return request;
    },
    list: async (params) => {
      requireAuth();
      const { page, size, search } = pageParams(params);
      let items = searchFilter(db.bloodRequests, search, (r) => `${r.hospitalName} ${r.bloodGroup} ${r.status}`);
      if (params?.status) items = items.filter((r) => r.status === params.status);
      if (params?.bloodGroup) items = items.filter((r) => r.bloodGroup === params.bloodGroup);
      if (params?.urgency) items = items.filter((r) => r.urgency === params.urgency);
      if (params?.city) items = items.filter((r) => r.city === params.city);
      return paginate(items, page, size);
    },
    get: async (requestId) => {
      requireAuth();
      const request = db.bloodRequests.find((r) => r.id === requestId);
      if (!request) mockFail(404, 'Blood request not found.');
      return request;
    },
    update: async (requestId, payload) => {
      requireAuth();
      const request = db.bloodRequests.find((r) => r.id === requestId);
      if (!request) mockFail(404, 'Blood request not found.');
      Object.assign(request, payload);
      return request;
    },
    cancel: async (requestId) => {
      requireAuth();
      const request = db.bloodRequests.find((r) => r.id === requestId);
      if (!request) mockFail(404, 'Blood request not found.');
      request.status = 'CANCELLED';
      return request;
    },
    fulfill: async (requestId) => {
      requireAuth();
      const request = db.bloodRequests.find((r) => r.id === requestId);
      if (!request) mockFail(404, 'Blood request not found.');
      request.status = 'FULFILLED';
      return request;
    },
    my: async (params) => {
      const user = requireAuth();
      const { page, size } = pageParams(params);
      return paginate(
        db.bloodRequests.filter((r) => r.requesterId === user.id),
        page,
        size,
      );
    },
    emergency: async (params) => {
      requireAuth();
      const { page, size } = pageParams(params);
      return paginate(
        db.bloodRequests.filter((r) => r.urgency === 'EMERGENCY'),
        page,
        size,
      );
    },
  },
  inventoryApi: {
    list: async (hospitalId, params) => {
      requireAuth();
      const { page, size, search } = pageParams(params);
      const items = searchFilter(
        db.inventory.filter((i) => i.hospitalId === hospitalId),
        search,
        (i) => i.bloodGroup,
      );
      return paginate(items, page, size);
    },
    getByGroup: async (hospitalId, bloodGroup) => {
      requireAuth();
      return db.inventory.filter((i) => i.hospitalId === hospitalId && i.bloodGroup === bloodGroup);
    },
    create: async (hospitalId, payload) => {
      requireAuth();
      const item: BloodInventory = {
        id: id('inv'),
        hospitalId,
        ...payload,
        stockStatus: payload.availableUnits <= 3 ? 'LOW' : 'ADEQUATE',
        updatedAt: nowIso(),
      };
      db.inventory.unshift(item);
      return item;
    },
    update: async (hospitalId, inventoryId, payload) => {
      requireAuth();
      const item = db.inventory.find((i) => i.hospitalId === hospitalId && i.id === inventoryId);
      if (!item) mockFail(404, 'Inventory record not found.');
      Object.assign(item, payload, { updatedAt: nowIso() });
      return item;
    },
    updateStock: async (hospitalId, inventoryId, payload) => {
      requireAuth();
      const item = db.inventory.find((i) => i.hospitalId === hospitalId && i.id === inventoryId);
      if (!item) mockFail(404, 'Inventory record not found.');
      Object.assign(item, payload, { updatedAt: nowIso() });
      item.stockStatus = item.availableUnits <= 2 ? 'CRITICAL' : item.availableUnits <= 5 ? 'LOW' : 'ADEQUATE';
      return item;
    },
    lowStock: async (hospitalId) => {
      requireAuth();
      return db.inventory.filter((i) => i.hospitalId === hospitalId && (i.stockStatus === 'LOW' || i.stockStatus === 'CRITICAL'));
    },
    expiring: async (hospitalId) => {
      requireAuth();
      const limit = Date.now() + 5 * 24 * 60 * 60 * 1000;
      return db.inventory.filter((i) => i.hospitalId === hospitalId && new Date(i.expiryDate).getTime() < limit);
    },
  },
  matchingApi: {
    list: async (requestId) => {
      requireAuth();
      return matches[requestId] ?? [];
    },
    nearby: async (requestId) => {
      requireAuth();
      return matches[requestId] ?? [];
    },
    match: async (requestId) => {
      requireAuth();
      return matches[requestId] ?? [];
    },
    notify: async () => {
      requireAuth();
    },
    matchScore: async (donorId, requestId) => {
      requireAuth();
      const score = matches[requestId]?.find((m) => m.donorId === donorId)?.matchScore ?? 0;
      return { score };
    },
  },
  emergencyApi: {
    create: async (payload) => {
      const user = requireAuth();
      const hospital = db.hospitals.find((h) => h.id === payload.hospitalId);
      const item: EmergencyRequest = {
        id: id('em'),
        requesterId: user.id,
        hospitalName: hospital?.name,
        status: 'OPEN',
        createdAt: nowIso(),
        ...payload,
      };
      db.emergencies.unshift(item);
      return item;
    },
    list: async (params) => {
      requireAuth();
      const { page, size } = pageParams(params);
      return paginate(db.emergencies, page, size);
    },
    get: async (emergencyId) => {
      requireAuth();
      const item = db.emergencies.find((e) => e.id === emergencyId);
      if (!item) mockFail(404, 'Emergency request not found.');
      return item;
    },
    alertDonors: async (emergencyId) => {
      requireAuth();
      const item = db.emergencies.find((e) => e.id === emergencyId);
      if (!item) mockFail(404, 'Emergency request not found.');
      item.status = 'ALERT_SENT';
      return item;
    },
    resolve: async (emergencyId) => {
      requireAuth();
      const item = db.emergencies.find((e) => e.id === emergencyId);
      if (!item) mockFail(404, 'Emergency request not found.');
      item.status = 'RESOLVED';
      return item;
    },
  },
  appointmentApi: {
    create: async (payload) => {
      requireAuth();
      const hospital = db.hospitals.find((h) => h.id === payload.hospitalId);
      const donor = db.donorProfiles.find((d) => d.id === payload.donorId);
      const item: Appointment = {
        id: id('apt'),
        status: 'SCHEDULED',
        hospitalName: hospital?.name,
        donorName: donor ? `${donor.firstName} ${donor.lastName}` : undefined,
        ...payload,
      };
      db.appointments.unshift(item);
      return item;
    },
    list: async (params) => {
      requireAuth();
      const { page, size, search } = pageParams(params);
      return paginate(searchFilter(db.appointments, search, (a) => `${a.hospitalName} ${a.status}`), page, size);
    },
    get: async (appointmentId) => {
      requireAuth();
      const item = db.appointments.find((a) => a.id === appointmentId);
      if (!item) mockFail(404, 'Appointment not found.');
      return item;
    },
    byDonor: async (donorId, params) => {
      requireAuth();
      const { page, size } = pageParams(params);
      return paginate(db.appointments.filter((a) => a.donorId === donorId), page, size);
    },
    byHospital: async (hospitalId, params) => {
      requireAuth();
      const { page, size } = pageParams(params);
      return paginate(db.appointments.filter((a) => a.hospitalId === hospitalId), page, size);
    },
    confirm: async (appointmentId) => {
      requireAuth();
      const item = db.appointments.find((a) => a.id === appointmentId);
      if (!item) mockFail(404, 'Appointment not found.');
      item.status = 'CONFIRMED';
      return item;
    },
    complete: async (appointmentId) => {
      requireAuth();
      const item = db.appointments.find((a) => a.id === appointmentId);
      if (!item) mockFail(404, 'Appointment not found.');
      item.status = 'COMPLETED';
      return item;
    },
    cancel: async (appointmentId) => {
      requireAuth();
      const item = db.appointments.find((a) => a.id === appointmentId);
      if (!item) mockFail(404, 'Appointment not found.');
      item.status = 'CANCELLED';
      return item;
    },
  },
  locationApi: {
    getDonorLocation: async (donorId) => {
      requireAuth();
      const item = locations.find((l) => l.donorId === donorId);
      if (!item) mockFail(404, 'Location not found.');
      return item;
    },
    updateDonorLocation: async (donorId, payload) => {
      requireAuth();
      let item = locations.find((l) => l.donorId === donorId);
      if (!item) {
        item = { donorId, city: payload.city ?? '', state: payload.state ?? '', updatedAt: nowIso() };
        locations.push(item);
      }
      Object.assign(item, payload, { updatedAt: nowIso() });
      return item;
    },
    nearbyDonors: async () => {
      requireAuth();
      return matches['req-1'] ?? [];
    },
    nearbyHospitals: async () => {
      requireAuth();
      return db.hospitals;
    },
  },
  notificationApi: {
    list: async (params) => {
      const user = requireAuth();
      const { page, size } = pageParams(params);
      return paginate(db.notifications.filter((n) => n.userId === user.id), page, size);
    },
    unread: async () => {
      const user = requireAuth();
      return db.notifications.filter((n) => n.userId === user.id && !n.read);
    },
    markRead: async (notificationId) => {
      requireAuth();
      const item = db.notifications.find((n) => n.id === notificationId);
      if (!item) mockFail(404, 'Notification not found.');
      item.read = true;
      return item;
    },
    markAllRead: async () => {
      const user = requireAuth();
      db.notifications.forEach((n) => {
        if (n.userId === user.id) n.read = true;
      });
    },
    remove: async (notificationId) => {
      requireAuth();
      const index = db.notifications.findIndex((n) => n.id === notificationId);
      if (index === -1) mockFail(404, 'Notification not found.');
      db.notifications.splice(index, 1);
    },
  },
  contributionApi: {
    get: async (donorId) => {
      requireAuth();
      const history = db.donations.filter((d) => d.donorId === donorId);
      return {
        donorId,
        totalDonations: history.length,
        completedDonations: history.filter((d) => d.status === 'COMPLETED').length,
        totalUnits: history.reduce((sum, d) => sum + d.units, 0),
        history,
      };
    },
    donations: async (donorId, params) => {
      requireAuth();
      const { page, size, search } = pageParams(params);
      return paginate(
        searchFilter(
          db.donations.filter((d) => d.donorId === donorId),
          search,
          (d) => `${d.hospitalName} ${d.status}`,
        ),
        page,
        size,
      );
    },
    milestones: async () => {
      requireAuth();
      return milestones;
    },
    badges: async () => {
      requireAuth();
      return badges;
    },
    statistics: async (donorId) => {
      requireAuth();
      const history = db.donations.filter((d) => d.donorId === donorId);
      return {
        donorId,
        totalDonations: history.length,
        completedDonations: history.filter((d) => d.status === 'COMPLETED').length,
        totalUnits: history.reduce((sum, d) => sum + d.units, 0),
        lastDonationDate: history.find((d) => d.status === 'COMPLETED')?.donatedAt,
      };
    },
    leaderboard: async () => {
      requireAuth();
      return [
        { donorId: 'donor-1', displayName: 'Amina R.', totalUnits: 2, totalDonations: 2, rank: 1 },
        { donorId: 'donor-2', displayName: 'Luis O.', totalUnits: 1, totalDonations: 1, rank: 2 },
      ];
    },
  },
  donationApi: {
    create: async (payload) => {
      requireAuth();
      const item: DonationRecord = {
        id: id('don'),
        donorId: payload.donorId ?? 'donor-1',
        hospitalId: payload.hospitalId ?? 'hospital-1',
        bloodGroup: payload.bloodGroup ?? 'O_POSITIVE',
        units: payload.units ?? 1,
        status: 'SCHEDULED',
        donatedAt: payload.donatedAt ?? nowIso(),
        donorName: payload.donorName,
        hospitalName: payload.hospitalName,
      };
      db.donations.unshift(item);
      return item;
    },
    list: async (params) => {
      requireAuth();
      const { page, size, search } = pageParams(params);
      let items = searchFilter(db.donations, search, (d) => `${d.hospitalName} ${d.donorName} ${d.status}`);
      if (params?.status) items = items.filter((d) => d.status === params.status);
      if (params?.bloodGroup) items = items.filter((d) => d.bloodGroup === params.bloodGroup);
      return paginate(items, page, size);
    },
    get: async (donationId) => {
      requireAuth();
      const item = db.donations.find((d) => d.id === donationId);
      if (!item) mockFail(404, 'Donation not found.');
      return item;
    },
    complete: async (donationId) => {
      requireAuth();
      const item = db.donations.find((d) => d.id === donationId);
      if (!item) mockFail(404, 'Donation not found.');
      item.status = 'COMPLETED';
      return item;
    },
    cancel: async (donationId) => {
      requireAuth();
      const item = db.donations.find((d) => d.id === donationId);
      if (!item) mockFail(404, 'Donation not found.');
      item.status = 'CANCELLED';
      return item;
    },
  },
  hospitalApi: {
    list: async (params) => {
      const { page, size, search } = pageParams(params);
      return paginate(searchFilter(db.hospitals, search, (h) => `${h.name} ${h.city}`), page, size);
    },
    get: async (hospitalId) => {
      const item = db.hospitals.find((h) => h.id === hospitalId);
      if (!item) mockFail(404, 'Hospital not found.');
      return item;
    },
    create: async (payload) => {
      requireAuth();
      const item: Hospital = { id: id('hospital'), status: 'PENDING', ...payload };
      db.hospitals.push(item);
      return item;
    },
    update: async (hospitalId, payload) => {
      requireAuth();
      const item = db.hospitals.find((h) => h.id === hospitalId);
      if (!item) mockFail(404, 'Hospital not found.');
      Object.assign(item, payload);
      return item;
    },
    remove: async (hospitalId) => {
      requireAuth();
      const index = db.hospitals.findIndex((h) => h.id === hospitalId);
      if (index === -1) mockFail(404, 'Hospital not found.');
      db.hospitals.splice(index, 1);
    },
    bloodRequests: async (hospitalId, params) => {
      requireAuth();
      const { page, size } = pageParams(params);
      return paginate(db.bloodRequests.filter((r) => r.hospitalId === hospitalId), page, size);
    },
  },
  analyticsApi: {
    overview: async () => {
      requireAuth();
      return {
        totalUsers: db.users.length,
        totalDonors: db.donorProfiles.length,
        totalHospitals: db.hospitals.length,
        totalDonations: db.donations.length,
        activeBloodRequests: db.bloodRequests.filter((r) => r.status === 'PENDING' || r.status === 'MATCHED').length,
        emergencyRequests: db.emergencies.filter((e) => e.status !== 'RESOLVED').length,
        totalBloodInventory: db.inventory.reduce((sum, i) => sum + i.availableUnits, 0),
      };
    },
    donations: async () => ({
      series: [
        { date: '2026-06-01', value: 4 },
        { date: '2026-07-01', value: 7 },
        { date: '2026-08-01', value: 6 },
        { date: '2026-09-01', value: 9 },
      ],
      breakdown: [{ name: 'COMPLETED', value: 1 }, { name: 'SCHEDULED', value: 1 }],
    }),
    bloodRequests: async () => ({
      series: [
        { date: '2026-06-01', value: 8 },
        { date: '2026-07-01', value: 11 },
        { date: '2026-08-01', value: 9 },
        { date: '2026-09-01', value: 14 },
      ],
      breakdown: [
        { name: 'PENDING', value: 1 },
        { name: 'PARTIALLY_FULFILLED', value: 1 },
        { name: 'FULFILLED', value: 1 },
      ],
    }),
    inventory: async () => ({
      series: [],
      breakdown: db.inventory.map((i) => ({ name: i.bloodGroup, value: i.availableUnits })),
    }),
    emergencyRequests: async () => ({
      series: [{ date: '2026-09-01', value: 3 }],
      breakdown: [{ name: 'ALERT_SENT', value: 1 }],
    }),
    users: async () => ({
      series: [],
      breakdown: [
        { name: 'DONOR', value: 1 },
        { name: 'REQUESTER', value: 2 },
        { name: 'HOSPITAL', value: 1 },
        { name: 'ADMIN', value: 1 },
      ],
    }),
    bloodGroups: async () => ({
      series: [],
      breakdown: [
        { name: 'O_NEGATIVE', value: 4 },
        { name: 'O_POSITIVE', value: 18 },
        { name: 'A_POSITIVE', value: 2 },
      ],
    }),
  },
  reportApi: {
    download: async (type: ReportType, filters) => blobReport(type, filters.format),
  },
  adminApi: {
    users: async (params) => {
      requireAuth();
      const { page, size, search } = pageParams(params);
      let items = searchFilter(db.users, search, (u) => `${u.email} ${u.firstName} ${u.lastName}`);
      if (params?.role) items = items.filter((u) => u.role === params.role);
      if (params?.status) items = items.filter((u) => u.status === params.status);
      return paginate(items, page, size);
    },
    user: async (userId) => {
      requireAuth();
      const user = db.users.find((u) => u.id === userId);
      if (!user) mockFail(404, 'User not found.');
      return user;
    },
    blockUser: async (userId) => {
      requireAuth();
      const user = db.users.find((u) => u.id === userId);
      if (!user) mockFail(404, 'User not found.');
      user.status = 'BLOCKED';
      return user;
    },
    unblockUser: async (userId) => {
      requireAuth();
      const user = db.users.find((u) => u.id === userId);
      if (!user) mockFail(404, 'User not found.');
      user.status = 'ACTIVE';
      return user;
    },
    donors: async (params) => {
      requireAuth();
      const { page, size, search } = pageParams(params);
      return paginate(searchFilter(db.donorProfiles, search, (d) => `${d.firstName} ${d.lastName}`), page, size);
    },
    verifyDonor: async (donorId) => {
      requireAuth();
      const donor = db.donorProfiles.find((d) => d.id === donorId);
      if (!donor) mockFail(404, 'Donor not found.');
      donor.verificationStatus = 'VERIFIED';
      return donor;
    },
    hospitals: async (params) => {
      requireAuth();
      const { page, size, search } = pageParams(params);
      return paginate(searchFilter(db.hospitals, search, (h) => h.name), page, size);
    },
    auditLogs: async (params) => {
      requireAuth();
      const { page, size } = pageParams(params);
      return paginate(auditLogs, page, size);
    },
    auditLog: async (auditId) => {
      requireAuth();
      const item = auditLogs.find((a) => a.id === auditId);
      if (!item) mockFail(404, 'Audit record not found.');
      return item;
    },
    filterAuditLogs: async (params) => {
      requireAuth();
      const { page, size, search } = pageParams(params);
      return paginate(searchFilter(auditLogs, search, (a) => `${a.action} ${a.entity} ${a.description}`), page, size);
    },
    exportAuditLogs: async (params) => blobReport('audit-logs', params?.format),
  },
};

export function seedNotification(item: AppNotification): void {
  db.notifications.unshift(item);
}

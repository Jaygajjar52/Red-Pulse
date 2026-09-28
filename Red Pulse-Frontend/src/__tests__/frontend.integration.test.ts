import { describe, it, expect } from 'vitest';
import { authApi } from '@/api/authApi';
import { donorApi } from '@/api/donorApi';
import { hospitalApi } from '@/api/hospitalApi';
import { bloodRequestApi } from '@/api/bloodRequestApi';
import { appointmentApi } from '@/api/appointmentApi';
import { emergencyApi } from '@/api/emergencyApi';
import { inventoryApi } from '@/api/inventoryApi';
import { adminApi } from '@/api/adminApi';
import { contributionApi } from '@/api/contributionApi';
import { matchingApi } from '@/api/matchingApi';
import { persistTokens } from '@/api/axios';

const runId = Math.random().toString(36).substring(2, 7);

describe('Frontend API to Backend Integration E2E Test', () => {
  let donorToken: string;
  let donorProfileId: string;
  let hospitalId: string;
  let bloodRequestId: string;
  let appointmentId: string;
  let emergencyId: string;

  it('1. Donor Registration and Login Flow', async () => {
    const email = `fe_donor_${runId}@test.com`;
    const regRes = await authApi.register({
      firstName: 'Frontend',
      lastName: 'Donor',
      email,
      password: 'Password123!',
      phone: '9988776655',
      role: 'DONOR',
    });

    expect(regRes.accessToken).toBeDefined();
    donorToken = regRes.accessToken;
    persistTokens(donorToken);

    const me = await authApi.me();
    expect(me.email).toBe(email);
  });

  it('2. Donor Profile and Availability Flow', async () => {
    persistTokens(donorToken);
    const profile = await donorApi.createProfile({
      bloodGroup: 'A_POSITIVE',
      dateOfBirth: '1998-04-12',
      gender: 'Male',
      weight: 68,
      city: 'Ahmedabad',
      state: 'Gujarat',
      latitude: 23.0225,
      longitude: 72.5714,
      available: true,
    });

    expect(profile.id).toBeDefined();
    donorProfileId = profile.id;

    const fetchedProfile = await donorApi.getProfile();
    expect(fetchedProfile.bloodGroup).toBe('A_POSITIVE');

    const patched = await donorApi.patchAvailability(true);
    expect(patched.available).toBe(true);

    const contributions = await contributionApi.get('me');
    expect(contributions).toBeDefined();

    const leaderboard = await contributionApi.leaderboard();
    expect(Array.isArray(leaderboard)).toBe(true);
  });

  it('3. Hospital Registration, Facility Creation & Inventory', async () => {
    const email = `fe_hosp_${runId}@test.com`;
    const hospUser = await authApi.register({
      firstName: 'Metro',
      lastName: 'Care',
      email,
      password: 'Password123!',
      phone: '9988776654',
      role: 'HOSPITAL',
    });
    persistTokens(hospUser.accessToken);

    const hospital = await hospitalApi.create({
      name: `Metro Care Hospital ${runId}`,
      hospitalName: `Metro Care Hospital ${runId}`,
      registrationNumber: `REG-FE-${runId}`,
      phone: '07926001122',
      email,
      address: 'Near SG Highway',
      city: 'Ahmedabad',
      state: 'Gujarat',
      latitude: 23.03,
      longitude: 72.56,
    });

    expect(hospital.id).toBeDefined();
    hospitalId = hospital.id;

    const myHosp = await hospitalApi.getMe();
    expect(myHosp.id).toBe(hospitalId);

    const inv = await inventoryApi.create(hospitalId, {
      bloodGroup: 'A_POSITIVE',
      availableUnits: 12,
      reservedUnits: 0,
      expiryDate: '2026-10-15',
    });
    expect(inv.id).toBeDefined();

    const invList = await inventoryApi.list(hospitalId);
    expect(invList.content.length).toBeGreaterThanOrEqual(1);

    const updatedStock = await inventoryApi.updateStock(hospitalId, inv.id, {
      availableUnits: 15,
      action: 'SET',
    });
    expect(updatedStock.availableUnits).toBe(15);
  });

  it('4. Requester Flow & Blood Request Submission (with FE payload mapping)', async () => {
    const email = `fe_req_${runId}@test.com`;
    const reqUser = await authApi.register({
      firstName: 'Sarah',
      lastName: 'Requester',
      email,
      password: 'Password123!',
      phone: '9988776653',
      role: 'REQUESTER',
    });
    persistTokens(reqUser.accessToken);

    const req = await bloodRequestApi.create({
      bloodGroup: 'A_POSITIVE',
      unitsRequired: 2,
      hospitalId,
      requiredDate: '2026-09-18',
      urgency: 'URGENT',
      description: 'Scheduled surgery requirement',
    });

    expect(req.id).toBeDefined();
    expect(req.status).toBe('PENDING');
    bloodRequestId = req.id;

    const reqDetail = await bloodRequestApi.get(bloodRequestId);
    expect(reqDetail.id).toBe(bloodRequestId);

    const matches = await matchingApi.list(bloodRequestId);
    expect(Array.isArray(matches)).toBe(true);

    const nearby = await matchingApi.nearby(bloodRequestId);
    expect(Array.isArray(nearby)).toBe(true);
  });

  it('5. Appointment Scheduling Flow (with FE scheduledAt ISO mapping)', async () => {
    persistTokens(donorToken);

    const apt = await appointmentApi.create({
      donorId: donorProfileId,
      hospitalId,
      bloodRequestId,
      scheduledAt: '2026-09-19T11:00',
      notes: 'Morning appointment booked from UI modal',
    });

    expect(apt.id).toBeDefined();
    appointmentId = apt.id;

    const aptDetails = await appointmentApi.get(appointmentId);
    expect(aptDetails.hospitalId).toBe(hospitalId);
  });

  it('6. Emergency SOS Flow (with FE Emergency payload mapping)', async () => {
    const email = `fe_em_${runId}@test.com`;
    const reqUser = await authApi.register({
      firstName: 'Emergency',
      lastName: 'Requester',
      email,
      password: 'Password123!',
      phone: '9988776652',
      role: 'REQUESTER',
    });
    persistTokens(reqUser.accessToken);

    const em = await emergencyApi.create({
      bloodGroup: 'A_POSITIVE',
      unitsRequired: 3,
      emergencyLevel: 'URGENT',
      hospitalId,
      approximateLocation: 'Ahmedabad, Trauma ICU',
      description: 'Severe accident emergency',
    });

    expect(em.id).toBeDefined();
    emergencyId = em.id;

    const emDetail = await emergencyApi.get(emergencyId);
    expect(emDetail.id).toBe(emergencyId);

    const resolved = await emergencyApi.resolve(emergencyId);
    expect(resolved.status).toBe('RESOLVED');
  });

  it('7. Admin Flow & Audit / Analytics / Reports', async () => {
    const adminLogin = await authApi.login({
      email: 'admin@redpulse.dev',
      password: 'Admin123!',
    });
    persistTokens(adminLogin.accessToken);

    const users = await adminApi.users();
    expect(users.content.length).toBeGreaterThan(0);

    const donors = await adminApi.donors();
    expect(donors.content.length).toBeGreaterThan(0);

    const hospitals = await adminApi.hospitals();
    expect(hospitals.content.length).toBeGreaterThan(0);

    const logs = await adminApi.auditLogs();
    expect(logs.content.length).toBeGreaterThan(0);
  });
});

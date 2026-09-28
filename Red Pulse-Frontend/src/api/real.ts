import { adminApi } from './adminApi';
import { analyticsApi } from './analyticsApi';
import { appointmentApi } from './appointmentApi';
import { authApi } from './authApi';
import { bloodRequestApi } from './bloodRequestApi';
import { contributionApi } from './contributionApi';
import type { ApiBundle } from './contracts';
import { donationApi } from './donationApi';
import { donorApi } from './donorApi';
import { emergencyApi } from './emergencyApi';
import { hospitalApi } from './hospitalApi';
import { inventoryApi } from './inventoryApi';
import { locationApi } from './locationApi';
import { matchingApi } from './matchingApi';
import { notificationApi } from './notificationApi';
import { reportApi } from './reportApi';
import { userApi } from './userApi';

export const realApis: ApiBundle = {
  authApi,
  userApi,
  donorApi,
  bloodRequestApi,
  inventoryApi,
  matchingApi,
  emergencyApi,
  appointmentApi,
  locationApi,
  notificationApi,
  contributionApi,
  donationApi,
  analyticsApi,
  reportApi,
  hospitalApi,
  adminApi,
};

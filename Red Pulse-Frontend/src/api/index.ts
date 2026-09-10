import { env } from '@/constants/env';
import { mockApis } from '@/mocks';
import { realApis } from './real';

export const api = env.useMockApi ? mockApis : realApis;

export const {
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
} = api;

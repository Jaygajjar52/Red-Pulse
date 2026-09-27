import { getData } from './httpHelpers';
import type { ContributionApi } from './contracts';
import type {
  DonationRecord,
  DonorBadge,
  DonorMilestone,
  DonorStatistics,
  LeaderboardEntry,
  PageResponse,
} from '@/types';
import { asEnumValue, asString, ensureRecord } from './typed';

function donorPath(endpoint: string, donorId?: string): string {
  if (!donorId || donorId === 'me') {
    return `/api/donors/me/${endpoint}`;
  }
  return `/api/donors/${donorId}/${endpoint}`;
}

type RawRecord = Record<string, unknown>;

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function asBoolean(value: unknown): boolean {
  return value === true;
}

function normalizeDonation(raw: RawRecord): DonationRecord {
  return {
    id: asString(raw.id) ?? '',
    donorId: asString(raw.donorId) ?? '',
    donorName: asString(raw.donorName),
    hospitalId: asString(raw.hospitalId) ?? '',
    hospitalName: asString(raw.hospitalName),
    bloodGroup: asEnumValue(raw.bloodGroup, [
      'A_POSITIVE', 'A_NEGATIVE', 'B_POSITIVE', 'B_NEGATIVE',
      'AB_POSITIVE', 'AB_NEGATIVE', 'O_POSITIVE', 'O_NEGATIVE',
    ], 'O_POSITIVE') ?? 'O_POSITIVE',
    units: asNumber(raw.units ?? raw.quantityUnits),
    status: asEnumValue(raw.status, ['SCHEDULED', 'COMPLETED', 'CANCELLED'], 'SCHEDULED') ?? 'SCHEDULED',
    appointmentId: asString(raw.appointmentId),
    donatedAt: asString(raw.donatedAt ?? raw.donationDate) ?? asString(raw.createdAt) ?? '',
  };
}

function normalizePage<T>(value: unknown, map: (item: RawRecord) => T): PageResponse<T> {
  if (Array.isArray(value)) {
    return {
      content: value.filter(ensureRecord).map(map),
      page: 0,
      size: value.length,
      totalElements: value.length,
      totalPages: value.length ? 1 : 0,
    };
  }

  const record = ensureRecord(value);
  const content = Array.isArray(record?.content)
    ? record.content.filter(ensureRecord).map(map)
    : [];
  return {
    content,
    page: asNumber(record?.page),
    size: asNumber(record?.size, content.length),
    totalElements: asNumber(record?.totalElements, content.length),
    totalPages: asNumber(record?.totalPages, content.length ? 1 : 0),
  };
}

function normalizeMilestones(value: unknown): DonorMilestone[] {
  const record = ensureRecord(value);
  if (Array.isArray(value)) {
    return value.filter(ensureRecord).map((item) => ({
      id: asString(item.id) ?? '',
      name: asString(item.name) ?? 'Milestone',
      description: asString(item.description) ?? '',
      target: asNumber(item.target),
      progress: asNumber(item.progress),
      achieved: asBoolean(item.achieved),
    }));
  }

  const remaining = asNumber(record?.nextMilestoneRemaining, 0);
  const count = asBoolean(record?.goldLifeSaver10Units)
    ? 10
    : asBoolean(record?.silverHero5Units)
      ? 5 + Math.max(0, 10 - remaining - 5)
      : asBoolean(record?.bronzeDonor3Units)
        ? 3 + Math.max(0, 5 - remaining - 3)
        : asBoolean(record?.firstDonationUnlocked)
          ? Math.max(1, 3 - remaining)
          : 0;
  return [
    { id: 'first-donation', name: 'First Donation', description: 'Complete your first blood donation.', target: 1, progress: Math.min(count, 1), achieved: count >= 1 },
    { id: 'bronze-donor', name: 'Bronze Donor', description: 'Complete three blood donations.', target: 3, progress: Math.min(count, 3), achieved: count >= 3 },
    { id: 'silver-hero', name: 'Silver Hero', description: 'Complete five blood donations.', target: 5, progress: Math.min(count, 5), achieved: count >= 5 },
    { id: 'gold-life-saver', name: 'Gold Life Saver', description: 'Complete ten blood donations.', target: 10, progress: Math.min(count, 10), achieved: count >= 10 },
  ];
}

function normalizeBadges(value: unknown): DonorBadge[] {
  if (!Array.isArray(value)) return [];
  return value.filter(ensureRecord).map((item, index) => ({
    id: asString(item.id) ?? `badge-${index}`,
    donorId: asString(item.donorId) ?? '',
    name: asString(item.name ?? item.badge) ?? 'Achievement',
    description: asString(item.description) ?? '',
    earnedAt: asString(item.earnedAt),
  }));
}

function normalizeLeaderboard(value: unknown): LeaderboardEntry[] {
  if (!Array.isArray(value)) return [];
  return value.filter(ensureRecord).map((item) => ({
    donorId: asString(item.donorId) ?? '',
    displayName: asString(item.displayName ?? item.donorName) ?? 'Donor',
    totalUnits: asNumber(item.totalUnits),
    totalDonations: asNumber(item.totalDonations),
    rank: asNumber(item.rank),
  }));
}

export const contributionApi: ContributionApi = {
  get: async (donorId) => getData(donorPath('contributions', donorId)),
  donations: async (donorId, params) => normalizePage(await getData(donorPath('donations', donorId), params), normalizeDonation),
  milestones: async (donorId) => normalizeMilestones(await getData(donorPath('milestones', donorId))),
  badges: async (donorId) => normalizeBadges(await getData(donorPath('badges', donorId))),
  statistics: async (donorId) => {
    const raw = ensureRecord(await getData(donorPath('statistics', donorId))) ?? {};
    return {
      donorId: asString(raw.donorId) ?? donorId,
      totalDonations: asNumber(raw.totalDonations),
      completedDonations: asNumber(raw.completedDonations ?? raw.totalDonations),
      totalUnits: asNumber(raw.totalUnits ?? raw.totalUnitsDonated),
      lastDonationDate: asString(raw.lastDonationDate),
    } satisfies DonorStatistics;
  },
  leaderboard: async () => normalizeLeaderboard(await getData('/api/donors/leaderboard')),
};

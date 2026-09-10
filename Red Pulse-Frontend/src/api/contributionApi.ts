import { getData } from './httpHelpers';
import type { ContributionApi } from './contracts';

export const contributionApi: ContributionApi = {
  get: (donorId) => getData(`/api/donors/${donorId}/contributions`),
  donations: (donorId, params) => getData(`/api/donors/${donorId}/donations`, params),
  milestones: (donorId = 'me') => getData(`/api/donors/${donorId}/milestones`),
  badges: (donorId = 'me') => getData(`/api/donors/${donorId}/badges`),
  statistics: (donorId) => getData(`/api/donors/${donorId}/statistics`),
  leaderboard: () => getData('/api/donors/leaderboard'),
};

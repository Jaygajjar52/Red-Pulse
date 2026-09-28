export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080',
  useMockApi: import.meta.env.VITE_USE_MOCK_API === 'true',
} as const;

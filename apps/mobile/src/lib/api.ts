import { CopyTradingApiClient } from '@copytrading/api-client';
import { useAuthStore } from '@/stores/auth.store';
import Constants from 'expo-constants';

const API_BASE_URL =
  process.env['EXPO_PUBLIC_API_URL'] ??
  (Constants.expoConfig?.extra?.['apiUrl'] as string | undefined) ??
  'http://localhost:3000';

export const createApiClient = (): CopyTradingApiClient => {
  return new CopyTradingApiClient({
    baseUrl: API_BASE_URL,
    getAuthToken: async () => {
      return useAuthStore.getState().token;
    },
  });
};

// Singleton instance
let _client: CopyTradingApiClient | null = null;

export const getApiClient = (): CopyTradingApiClient => {
  if (!_client) {
    _client = createApiClient();
  }
  return _client;
};

export { API_BASE_URL };

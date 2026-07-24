import { MMKV } from 'react-native-mmkv';

export const storage = new MMKV({
  id: 'copytrading-app',
  encryptionKey: 'copytrading-secure-key',
});

export const StorageKeys = {
  AUTH_TOKEN: 'auth_token',
  USER_ID: 'user_id',
  USER_EMAIL: 'user_email',
  ONBOARDING_COMPLETED: 'onboarding_completed',
  THEME: 'theme',
} as const;

export type StorageKey = (typeof StorageKeys)[keyof typeof StorageKeys];

export const secureStorage = {
  set: (key: StorageKey, value: string): void => {
    storage.set(key, value);
  },
  get: (key: StorageKey): string | undefined => {
    return storage.getString(key);
  },
  delete: (key: StorageKey): void => {
    storage.delete(key);
  },
  clearAll: (): void => {
    storage.clearAll();
  },
};

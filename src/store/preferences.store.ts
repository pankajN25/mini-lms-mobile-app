import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '@/utils/constants';
import type { UserPreferences } from '@/types/domain.types';

const DEFAULTS: UserPreferences = {
  notificationsEnabled: true,
};

export async function getPreferences(): Promise<UserPreferences> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.PREFERENCES);
  if (!raw) return DEFAULTS;
  try {
    return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<UserPreferences>) };
  } catch {
    return DEFAULTS;
  }
}

export async function savePreferences(prefs: Partial<UserPreferences>): Promise<void> {
  const current = await getPreferences();
  await AsyncStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify({ ...current, ...prefs }));
}

export async function getLastActiveAt(): Promise<number | null> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.LAST_ACTIVE);
  return raw ? parseInt(raw, 10) : null;
}

export async function saveLastActiveAt(): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.LAST_ACTIVE, Date.now().toString());
}

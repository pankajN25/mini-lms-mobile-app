import * as SecureStore from 'expo-secure-store';
import { SECURE_KEYS } from '@/utils/constants';
import type { User } from '@/types/domain.types';

export async function getAccessToken(): Promise<string | null> {
  return SecureStore.getItemAsync(SECURE_KEYS.ACCESS_TOKEN);
}

export async function getRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync(SECURE_KEYS.REFRESH_TOKEN);
}

export async function saveTokens(accessToken: string, refreshToken: string): Promise<void> {
  await Promise.all([
    SecureStore.setItemAsync(SECURE_KEYS.ACCESS_TOKEN, accessToken),
    SecureStore.setItemAsync(SECURE_KEYS.REFRESH_TOKEN, refreshToken),
  ]);
}

export async function saveUser(user: User): Promise<void> {
  await SecureStore.setItemAsync(SECURE_KEYS.USER_DATA, JSON.stringify(user));
}

export async function getSavedUser(): Promise<User | null> {
  const raw = await SecureStore.getItemAsync(SECURE_KEYS.USER_DATA);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export async function clearTokens(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(SECURE_KEYS.ACCESS_TOKEN),
    SecureStore.deleteItemAsync(SECURE_KEYS.REFRESH_TOKEN),
    SecureStore.deleteItemAsync(SECURE_KEYS.USER_DATA),
  ]);
}

export async function hasValidSession(): Promise<boolean> {
  const token = await getAccessToken();
  return token !== null;
}

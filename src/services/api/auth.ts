import client from './client';
import type { ApiResponse, AuthResponseData } from '@/types/api.types';
import type { User } from '@/types/domain.types';
import { mapApiUserToDomain } from './users';

interface LoginResult {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export async function login(email: string, password: string): Promise<LoginResult> {
  const { data } = await client.post<ApiResponse<AuthResponseData>>('/api/v1/users/login', {
    email,
    password,
  });
  return {
    user: mapApiUserToDomain(data.data.user),
    accessToken: data.data.accessToken,
    refreshToken: data.data.refreshToken,
  };
}

export async function register(
  username: string,
  email: string,
  password: string
): Promise<LoginResult> {
  const { data } = await client.post<ApiResponse<AuthResponseData>>('/api/v1/users/register', {
    username,
    email,
    password,
    role: 'USER',
  });
  return {
    user: mapApiUserToDomain(data.data.user),
    accessToken: data.data.accessToken,
    refreshToken: data.data.refreshToken,
  };
}

export async function logout(): Promise<void> {
  try {
    await client.post('/api/v1/users/logout');
  } catch {
    // Always clear local state even if server call fails
  }
}

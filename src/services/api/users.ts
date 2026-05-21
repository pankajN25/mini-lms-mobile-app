import client from './client';
import type { ApiResponse, ApiUser } from '@/types/api.types';
import type { User } from '@/types/domain.types';

export function mapApiUserToDomain(apiUser: ApiUser): User {
  return {
    id: apiUser._id,
    username: apiUser.username,
    email: apiUser.email,
    avatarUrl: apiUser.avatar?.url ?? '',
    role: apiUser.role,
  };
}

export async function getUserProfile(): Promise<User> {
  const { data } = await client.get<ApiResponse<{ user: ApiUser }>>('/api/v1/users/current-user');
  return mapApiUserToDomain(data.data.user);
}

export async function updateAvatar(imageUri: string): Promise<User> {
  const formData = new FormData();
  const filename = imageUri.split('/').pop() ?? 'avatar.jpg';
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : 'image/jpeg';

  formData.append('avatar', { uri: imageUri, name: filename, type } as unknown as Blob);

  const { data } = await client.patch<ApiResponse<{ user: ApiUser }>>(
    '/api/v1/users/avatar',
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
  return mapApiUserToDomain(data.data.user);
}

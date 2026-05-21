import axios, { type AxiosInstance, type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL, API_TIMEOUT, MAX_RETRY_ATTEMPTS, RETRY_DELAYS_MS } from '@/utils/constants';
import { getAccessToken, getRefreshToken, saveTokens, clearTokens } from '@/store/auth.store';

interface RetryableConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
  _retryCount?: number;
}

const client: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: { 'Content-Type': 'application/json' },
});

client.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = [];

function processQueue(error: unknown, token: string | null): void {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token!)));
  failedQueue = [];
}

client.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetryableConfig | undefined;

    if (!original) return Promise.reject(error);

    // Don't attempt token refresh for auth endpoints — pass 401 through directly
    const requestUrl = original.url ?? '';
    const isAuthEndpoint =
      requestUrl.includes('/users/login') ||
      requestUrl.includes('/users/register') ||
      requestUrl.includes('/refresh-token');

    if (error.response?.status === 401 && !original._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token) => {
              original.headers.Authorization = `Bearer ${token}`;
              resolve(client(original));
            },
            reject,
          });
        });
      }

      original._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await getRefreshToken();
        if (!refreshToken) throw new Error('No refresh token available');

        const { data } = await axios.post(`${API_BASE_URL}/api/v1/users/refresh-token`, {
          refreshToken,
        });
        const { accessToken, refreshToken: newRefresh } = data.data;
        await saveTokens(accessToken, newRefresh);
        processQueue(null, accessToken);
        original.headers.Authorization = `Bearer ${accessToken}`;
        return client(original);
      } catch (refreshError) {
        processQueue(refreshError, null);
        await clearTokens();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    const retryCount = original._retryCount ?? 0;
    const isNetworkOrServer = !error.response || error.response.status >= 500;

    if (isNetworkOrServer && retryCount < MAX_RETRY_ATTEMPTS) {
      original._retryCount = retryCount + 1;
      const delay = RETRY_DELAYS_MS[retryCount] ?? 2000;
      await new Promise((r) => setTimeout(r, delay));
      return client(original);
    }

    return Promise.reject(error);
  }
);

export default client;

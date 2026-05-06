import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  withCredentials: true,
});

let accessToken: string | null = null;
let refreshPromise: Promise<string | null> | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

apiClient.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    const isAuthEndpoint = originalRequest?.url?.includes('/auth/');
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;

      // Queue concurrent requests during refresh
      if (!refreshPromise) {
        refreshPromise = (async () => {
          // Lazy import to avoid a circular module load between client.ts and auth.ts.
          const { getStoredRefreshToken, setStoredRefreshToken } = await import('./auth');
          const stored = getStoredRefreshToken();
          try {
            const res = await apiClient.post(
              '/auth/refresh',
              stored ? { refreshToken: stored } : {}
            );
            const newToken: string = res.data.accessToken;
            setAccessToken(newToken);
            if (res.data.refreshToken) setStoredRefreshToken(res.data.refreshToken);
            return newToken;
          } catch {
            setAccessToken(null);
            setStoredRefreshToken(null);
            return null;
          }
        })().finally(() => {
          refreshPromise = null;
        });
      }

      const newToken = await refreshPromise;
      if (newToken) {
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;

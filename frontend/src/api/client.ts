import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '/api/v1';

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('rrr_access_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshing: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refresh = localStorage.getItem('rrr_refresh_token');
  if (!refresh) return null;
  try {
    const { data } = await axios.post(`${API_BASE}/auth/refresh`, {
      refresh_token: refresh,
    });
    localStorage.setItem('rrr_access_token', data.access_token);
    localStorage.setItem('rrr_refresh_token', data.refresh_token);
    return data.access_token as string;
  } catch {
    localStorage.removeItem('rrr_access_token');
    localStorage.removeItem('rrr_refresh_token');
    return null;
  }
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    if (error.response?.status === 401 && original && !original._retry) {
      original._retry = true;
      refreshing = refreshing ?? refreshAccessToken();
      const token = await refreshing;
      refreshing = null;
      if (token) {
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      }
    }
    return Promise.reject(error);
  }
);

export function getErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const detail = err.response?.data?.detail;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail)) {
      return detail.map((d: { msg?: string }) => d.msg || JSON.stringify(d)).join(', ');
    }
    return err.message;
  }
  if (err instanceof Error) return err.message;
  return 'Something went wrong';
}

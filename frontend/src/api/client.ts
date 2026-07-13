import axios, { AxiosError, AxiosHeaders, InternalAxiosRequestConfig } from 'axios';

/**
 * Normalize API base URL for local + production.
 */
function resolveApiBase(): string {
  const raw = (import.meta.env.VITE_API_URL as string | undefined)?.trim();
  if (!raw) return '/api/v1';

  if (raw.startsWith('/')) {
    return raw.replace(/\/+$/, '') || '/api/v1';
  }

  try {
    const url = new URL(raw);
    let path = url.pathname.replace(/\/+$/, '');
    if (!path || path === '/') {
      path = '/api/v1';
    } else if (!path.endsWith('/api/v1') && !path.includes('/api/v1')) {
      path = `${path}/api/v1`.replace(/\/{2,}/g, '/');
    }
    return `${url.origin}${path}`;
  } catch {
    return raw.replace(/\/+$/, '');
  }
}

export const API_BASE = resolveApiBase();

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: false,
  // Do NOT set global Content-Type — breaks FormData multipart boundary.
  // JSON is set per-request when body is a plain object.
  timeout: 45000, // Render cold start
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('rrr_access_token');
  const headers = AxiosHeaders.from(config.headers || {});

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Multipart: strip Content-Type so browser sets boundary
  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    headers.delete('Content-Type');
  } else if (
    config.data &&
    typeof config.data === 'object' &&
    !(config.data instanceof FormData) &&
    !(config.data instanceof Blob) &&
    !(config.data instanceof ArrayBuffer)
  ) {
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
  }

  config.headers = headers;
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
        const headers = AxiosHeaders.from(original.headers || {});
        headers.set('Authorization', `Bearer ${token}`);
        original.headers = headers;
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
    if (err.code === 'ECONNABORTED') {
      return 'Request timed out. The server may be waking up — please retry.';
    }
    if (err.code === 'ERR_NETWORK') {
      return 'Cannot reach API. Check VITE_API_URL and CORS settings.';
    }
    return err.message;
  }
  if (err instanceof Error) return err.message;
  return 'Something went wrong';
}

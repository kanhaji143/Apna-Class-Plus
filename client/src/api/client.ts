/**
 * API client — original Classplus DIY pattern (live-verified):
 *  - header: x-access-token (Bearer NAHI)
 *  - 401 aaye → silent refreshToken → original request retry (single-flight)
 */
import axios from 'axios';

export const runConfig = (window as any).runConfig || { API_BASE_URL: '' };

export const api = axios.create({
  baseURL: runConfig.API_BASE_URL || '',
  timeout: 20000,
});

// access token in-memory (XSS-safe, original bhi memory mein rakhta hai)
let accessToken: string | null = null;
export const setAccessToken = (t: string | null) => {
  accessToken = t;
  if (t) api.defaults.headers.common['x-access-token'] = t;
  else delete api.defaults.headers.common['x-access-token'];
};
export const getAccessToken = () => accessToken;

// ---------- refresh single-flight (original jaisa interceptor) ----------
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) return null;
  try {
    const res = await axios.post('/v1/diy/refreshToken', { refreshToken });
    const token = res.data?.data?.accessToken ?? null;
    if (token) setAccessToken(token);
    return token;
  } catch {
    return null;
  }
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retried) {
      original._retried = true;
      refreshPromise = refreshPromise || refreshAccessToken();
      const token = await refreshPromise;
      refreshPromise = null;
      if (token) {
        original.headers['x-access-token'] = token;
        return api(original);
      }
      // refresh fail → logout
      localStorage.removeItem('refreshToken');
      setAccessToken(null);
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ---------- typed helpers ----------
export interface ApiResponse<T> {
  status: 'success' | 'error';
  data: T;
  message: string;
}

export async function get<T>(url: string): Promise<T> {
  const res = await api.get<ApiResponse<T>>(url);
  return res.data.data;
}

export async function post<T>(url: string, body?: unknown): Promise<T> {
  const res = await api.post<ApiResponse<T>>(url, body);
  return res.data.data;
}

export async function put<T>(url: string, body?: unknown): Promise<T> {
  const res = await api.put<ApiResponse<T>>(url, body);
  return res.data.data;
}

export async function del<T = any>(url: string): Promise<T> {
  const res = await api.delete<ApiResponse<T>>(url);
  return res.data.data;
}

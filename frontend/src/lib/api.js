import axios from 'axios';
import { getToken, clearToken } from './token';

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api`,
});

// Request interceptor — runs before every request leaves the browser.
// Reads the current token from memory and attaches it as a Bearer header.
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — runs when a response (or error) arrives.
// A 401 means the token expired or is invalid — clear it so the app
// falls back to the login screen. We re-throw the error so TanStack Query
// still sees a failed request and can set its error state.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isTokenEndpoint = error.config?.url?.includes('/token/');
    // Only force-reload on 401 from real API calls — not from the login endpoint
    // (which legitimately returns 401 for bad credentials)
    if (error.response?.status === 401 && !isTokenEndpoint) {
      clearToken();
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

export default api;

// src/api.js
// Centralized fetch helper — attaches auth tokens, handles 401 refresh, and timeouts

import { API_BASE_URL } from './config';
export { API_BASE_URL };

/** Helper to fetch with an automatic timeout (default 15s) */
export async function fetchWithTimeout(url, options = {}, timeoutMs = 25000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (err) {
    clearTimeout(id);
    if (err.name === 'AbortError') {
      throw new Error('Connection timed out. The server (Render) may be cold-starting or unavailable. Please try again in a few seconds.');
    }
    throw err;
  }
}

/** Return the stored token for the current role */
export function getToken() {
  return localStorage.getItem('access_token') || localStorage.getItem('admin_token') || null;
}

/** Store admin tokens */
export function setAdminTokens(accessToken, refreshToken, admin) {
  localStorage.setItem('admin_token', accessToken);
  localStorage.setItem('admin_refresh_token', refreshToken);
  localStorage.setItem('admin', JSON.stringify(admin));
  localStorage.setItem('role', 'admin');
}

/** Clear all auth data */
export function clearAuth() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('admin_token');
  localStorage.removeItem('admin_refresh_token');
  localStorage.removeItem('user');
  localStorage.removeItem('provider');
  localStorage.removeItem('admin');
  localStorage.removeItem('role');
}

/** Get current role */
export function getRole() {
  return localStorage.getItem('role') || null;
}

/** Get admin info */
export function getAdmin() {
  try { return JSON.parse(localStorage.getItem('admin')); } catch { return null; }
}

/**
 * apiFetch — drop-in for fetch() with auth headers attached.
 * Automatically prepends API_BASE_URL.
 * On 401, tries to refresh the token (customer/provider), then retries.
 */
export async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${API_BASE_URL}${path}`;
  let res = await fetchWithTimeout(url, { ...options, headers });

  // Token expired — try silent refresh (customer/provider only)
  if (res.status === 401 && !path.includes('/login') && !path.includes('/refresh-token')) {
    const role = getRole();
    if (role === 'customer' || role === 'provider') {
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        const refreshPath = role === 'customer'
          ? '/api/customer/refresh-token'
          : '/api/provider/refresh-token';
        try {
          const refreshRes = await fetchWithTimeout(`${API_BASE_URL}${refreshPath}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: refreshToken }),
          }, 10000);
          const refreshData = await refreshRes.json();
          if (refreshRes.ok && refreshData.status && refreshData.access_token) {
            localStorage.setItem('access_token', refreshData.access_token);
            headers['Authorization'] = `Bearer ${refreshData.access_token}`;
            // Retry original request
            res = await fetchWithTimeout(url, { ...options, headers });
          } else {
            clearAuth();
          }
        } catch {
          clearAuth();
        }
      }
    }
  }

  return res;
}

/**
 * apiFetchAdmin — same as apiFetch but always uses admin_token
 */
export async function apiFetchAdmin(path, options = {}) {
  const token = localStorage.getItem('admin_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const url = `${API_BASE_URL}${path}`;
  const res = await fetchWithTimeout(url, { ...options, headers });
  return res;
}

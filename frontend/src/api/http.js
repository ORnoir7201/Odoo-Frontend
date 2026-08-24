import { getToken, clearToken } from './authToken';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export async function apiFetch(path, options = {}) {
  const token = getToken();

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (response.status === 401) {
    clearToken();
    window.location.reload();
    throw new Error('Session expirée, merci de vous reconnecter');
  }

  const data = await response.json();

  if (!response.ok || data.success === false) {
    throw new Error(data.message || 'Une erreur est survenue');
  }

  return data;
}
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export async function login(email, password) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();

  if (!response.ok || data.success === false) {
    throw new Error(data.message || 'Impossible de se connecter');
  }

  return data; // { success, token, email }
}

export async function logout(token) {
  try {
    await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    // silencieux, la déconnexion locale suffit dans ce cas
  }
}
import { apiFetch } from './http';

export async function getUsers(includeArchived = false) {
  const data = await apiFetch(`/settings/users?includeArchived=${includeArchived}`);
  return data.data;
}

export async function getLanguages() {
  const data = await apiFetch('/settings/languages');
  return data.data;
}

export async function getUserDetail(id) {
  const data = await apiFetch(`/settings/users/${id}`);
  return data.data;
}

export async function createUser(user) {
  return apiFetch('/settings/users', {
    method: 'POST',
    body: JSON.stringify(user),
  });
}

export async function updateUser(id, user) {
  return apiFetch(`/settings/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(user),
  });
}

export async function archiveUser(id) {
  return apiFetch(`/settings/users/${id}/archive`, { method: 'POST' });
}

export async function unarchiveUser(id) {
  return apiFetch(`/settings/users/${id}/unarchive`, { method: 'POST' });
}
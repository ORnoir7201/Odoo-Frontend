import { apiFetch } from './http';

export async function getDashboardStats() {
  const data = await apiFetch('/dashboard/stats');
  return data.data;
}
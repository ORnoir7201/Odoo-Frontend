import { apiFetch } from './http';

export async function getCompanies() {
  const data = await apiFetch('/companies');
  return data.data;
}
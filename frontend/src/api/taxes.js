import { apiFetch } from './http';

export async function getTaxes() {
  const data = await apiFetch('/purchases/taxes');
  return data.data;
}
import { apiFetch } from './http';

export async function getSalespersons() {
  const data = await apiFetch('/sales/salespersons');
  return data.data;
}
import { apiFetch } from './http';

export async function getSales(onlyMine = true) {
  const data = await apiFetch(`/sales?onlyMine=${onlyMine}`);
  return data.data;
}

export async function getSaleDetail(id) {
  const data = await apiFetch(`/sales/${id}`);
  return data.data;
}

export async function createSale(sale) {
  return apiFetch('/sales', { method: 'POST', body: JSON.stringify(sale) });
}

export async function updateSale(id, sale) {
  return apiFetch(`/sales/${id}`, { method: 'PUT', body: JSON.stringify(sale) });
}

export async function deleteSale(id) {
  return apiFetch(`/sales/${id}`, { method: 'DELETE' });
}

export async function sendSale(id) {
  return apiFetch(`/sales/${id}/send`, { method: 'POST' });
}

export async function confirmSale(id) {
  return apiFetch(`/sales/${id}/confirm`, { method: 'POST' });
}

export async function cancelSale(id) {
  return apiFetch(`/sales/${id}/cancel`, { method: 'POST' });
}

export async function duplicateSale(id) {
  return apiFetch(`/sales/${id}/duplicate`, { method: 'POST' });
}

export async function getShareLink(id) {
  const data = await apiFetch(`/sales/${id}/share`);
  return data.url;
}

export async function invoiceSale(id) {
  return apiFetch(`/sales/${id}/invoice`, { method: 'POST' });
}

export async function getSaleTaxes() {
  const data = await apiFetch('/sales/taxes');
  return data.data;
}

export async function getPaymentTerms() {
  const data = await apiFetch('/sales/payment-terms');
  return data.data;
}
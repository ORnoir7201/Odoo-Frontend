import { apiFetch } from './http';

export async function getPurchases() {
  const data = await apiFetch('/purchases');
  return data.data;
}

export async function getPurchaseDetail(id) {
  const data = await apiFetch(`/purchases/${id}`);
  return data.data; // { order, lines }
}

export async function createPurchase(purchase) {
  return apiFetch('/purchases', {
    method: 'POST',
    body: JSON.stringify(purchase),
  });
}

export async function updatePurchase(id, purchase) {
  return apiFetch(`/purchases/${id}`, {
    method: 'PUT',
    body: JSON.stringify(purchase),
  });
}

export async function deletePurchase(id) {
  return apiFetch(`/purchases/${id}`, {
    method: 'DELETE',
  });
}

export async function sendPurchase(id) {
  return apiFetch(`/purchases/${id}/send`, { method: 'POST' });
}

export async function confirmPurchase(id) {
  return apiFetch(`/purchases/${id}/confirm`, { method: 'POST' });
}

export async function cancelPurchase(id) {
  return apiFetch(`/purchases/${id}/cancel`, { method: 'POST' });
}

export async function duplicatePurchase(id) {
  return apiFetch(`/purchases/${id}/duplicate`, { method: 'POST' });
}

export async function getShareLink(id) {
  const data = await apiFetch(`/purchases/${id}/share`);
  return data.url;
}
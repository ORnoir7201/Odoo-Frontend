import { apiFetch } from './http';

export async function getPayments(partnerType) {
  const data = await apiFetch(`/payments?partnerType=${partnerType}`);
  return data.data;
}

export async function getUnpaidInvoices(partnerId, partnerType) {
  const data = await apiFetch(`/payments/unpaid-invoices?partnerId=${partnerId}&partnerType=${partnerType}`);
  return data.data;
}

export async function getPaymentDetail(id) {
  const data = await apiFetch(`/payments/${id}`);
  return data.data;
}

export async function createPayment(payment) {
  return apiFetch('/payments', { method: 'POST', body: JSON.stringify(payment) });
}

export async function confirmPayment(id) {
  return apiFetch(`/payments/${id}/confirm`, { method: 'POST' });
}

export async function cancelPayment(id) {
  return apiFetch(`/payments/${id}/cancel`, { method: 'POST' });
}

export async function deletePayment(id) {
  return apiFetch(`/payments/${id}`, { method: 'DELETE' });
}

export async function updatePayment(id, payment) {
  return apiFetch(`/payments/${id}`, { method: 'PUT', body: JSON.stringify(payment) });
}
export async function sendReceipt(id) {
  return apiFetch(`/payments/${id}/send-receipt`, { method: 'POST' });
}
export async function resetPaymentToDraft(id) {
  return apiFetch(`/payments/${id}/reset-draft`, { method: 'POST' });
}
export async function getPaymentMessages(id) {
  const data = await apiFetch(`/payments/${id}/messages`);
  return data.data;
}
export async function postPaymentMessage(id, body) {
  return apiFetch(`/payments/${id}/messages`, { method: 'POST', body: JSON.stringify({ body }) });
}
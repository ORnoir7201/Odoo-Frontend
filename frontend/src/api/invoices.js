import { apiFetch } from './http';

export async function getOverview() {
  const data = await apiFetch('/invoices/overview');
  return data.data;
}

export async function getInvoices(type) {
  const data = await apiFetch(`/invoices?type=${type}`);
  return data.data;
}

export async function getInvoiceDetail(id) {
  const data = await apiFetch(`/invoices/${id}`);
  return data.data;
}

export async function createInvoice(invoice) {
  return apiFetch('/invoices', { method: 'POST', body: JSON.stringify(invoice) });
}

export async function updateInvoice(id, invoice) {
  return apiFetch(`/invoices/${id}`, { method: 'PUT', body: JSON.stringify(invoice) });
}

export async function deleteInvoice(id) {
  return apiFetch(`/invoices/${id}`, { method: 'DELETE' });
}

export async function confirmInvoice(id) {
  return apiFetch(`/invoices/${id}/confirm`, { method: 'POST' });
}

export async function cancelInvoice(id) {
  return apiFetch(`/invoices/${id}/cancel`, { method: 'POST' });
}

export async function duplicateInvoice(id) {
  return apiFetch(`/invoices/${id}/duplicate`, { method: 'POST' });
}

export async function getShareLink(id) {
  const data = await apiFetch(`/invoices/${id}/share`);
  return data.url;
}

export async function sendInvoice(id) {
  return apiFetch(`/invoices/${id}/send`, { method: 'POST' });
}
export async function resetInvoiceToDraft(id) {
  return apiFetch(`/invoices/${id}/reset-draft`, { method: 'POST' });
}
export async function addRefund(id) {
  return apiFetch(`/invoices/${id}/add-refund`, { method: 'POST' });
}
export async function getInvoiceMessages(id) {
  const data = await apiFetch(`/invoices/${id}/messages`);
  return data.data;
}
export async function postInvoiceMessage(id, body) {
  return apiFetch(`/invoices/${id}/messages`, { method: 'POST', body: JSON.stringify({ body }) });
}
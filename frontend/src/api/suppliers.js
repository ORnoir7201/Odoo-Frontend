import { apiFetch } from './http';

export async function getSuppliers() {
  const data = await apiFetch('/suppliers');
  return data.data;
}

export async function getSupplierDetail(id) {
  const data = await apiFetch(`/suppliers/${id}`);
  return data.data;
}

export async function createSupplier(supplier) {
  return apiFetch('/suppliers', {
    method: 'POST',
    body: JSON.stringify(supplier),
  });
}

export async function updateSupplier(id, supplier) {
  return apiFetch(`/suppliers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(supplier),
  });
}

export async function deleteSupplier(id) {
  return apiFetch(`/suppliers/${id}`, {
    method: 'DELETE',
  });
}
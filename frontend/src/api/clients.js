import { apiFetch } from './http';

export async function getClients() {
  const data = await apiFetch('/clients');
  return data.data;
}

export async function createClient(client) {
  return apiFetch('/clients', {
    method: 'POST',
    body: JSON.stringify(client),
  });
}

export async function updateClient(id, client) {
  return apiFetch(`/clients/${id}`, {
    method: 'PUT',
    body: JSON.stringify(client),
  });
}

export async function deleteClient(id) {
  return apiFetch(`/clients/${id}`, {
    method: 'DELETE',
  });
}

export async function getClientDetail(id) {
   const data = await apiFetch(`/clients/${id}`);
   return data.data;
}
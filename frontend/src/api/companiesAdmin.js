import { apiFetch } from './http';

export async function getCompaniesAdmin() {
  const data = await apiFetch('/settings/companies');
  return data.data;
}

export async function getCompanyAdminDetail(id) {
  const data = await apiFetch(`/settings/companies/${id}`);
  return data.data;
}

export async function createCompanyAdmin(company) {
  return apiFetch('/settings/companies', {
    method: 'POST',
    body: JSON.stringify(company),
  });
}

export async function updateCompanyAdmin(id, company) {
  return apiFetch(`/settings/companies/${id}`, {
    method: 'PUT',
    body: JSON.stringify(company),
  });
}
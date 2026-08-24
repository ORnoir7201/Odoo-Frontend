import { apiFetch } from './http';

export async function getLayouts() {
  const data = await apiFetch('/settings/layouts');
  return data.data;
}

export async function getMyCompanySettings() {
  const data = await apiFetch('/settings/company');
  return data.data;
}

export async function updateMyCompanySettings(settings) {
  return apiFetch('/settings/company', {
    method: 'PUT',
    body: JSON.stringify(settings),
  });
}

export async function getMyCompanies() {
  const data = await apiFetch('/settings/my-companies');
  return data.data;
}

export async function switchCompany(companyId) {
  return apiFetch('/settings/switch-company', {
    method: 'POST',
    body: JSON.stringify({ companyId }),
  });
}
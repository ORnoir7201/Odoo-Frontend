const TOKEN_KEY = 'odoo_front_token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function isLoggedIn() {
  return Boolean(getToken());
}

export function getUserName() {
  return localStorage.getItem('odoo_front_name');
}

export function setUserName(name) {
  localStorage.setItem('odoo_front_name', name);
}
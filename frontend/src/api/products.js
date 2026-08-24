import { apiFetch } from './http';

export async function getProducts() {
  const data = await apiFetch('/products');
  return data.data;
}

export async function getProductDetail(id) {
  const data = await apiFetch(`/products/${id}`);
  return data.data;
}

export async function createProduct(product) {
  return apiFetch('/products', {
    method: 'POST',
    body: JSON.stringify(product),
  });
}

export async function updateProduct(id, product) {
  return apiFetch(`/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(product),
  });
}

export async function deleteProduct(id) {
  return apiFetch(`/products/${id}`, {
    method: 'DELETE',
  });
}
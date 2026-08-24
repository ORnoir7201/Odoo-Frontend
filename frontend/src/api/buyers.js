import { apiFetch } from "./http";

export async function getBuyers() {
  const data = await apiFetch("/purchases/buyers");
  return data.data;
}
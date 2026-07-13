// Müşteri listesini tarayıcının localStorage'ında kalıcı tutar — gerçek bir
// backend olmadığı için, sayfa yenilendiğinde (hard reload) yeni eklenen
// müşterilerin kaybolmaması sağlanır. Kayıt yoksa mock tohum veriye
// (initialCustomers) düşer.
import type { Customer } from "@/lib/mock/crm";

const STORAGE_KEY = "pestshield.crm.customers";

export function loadCustomers(seed: Customer[]): Customer[] {
  if (typeof window === "undefined") return seed;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return seed;
    const parsed = JSON.parse(raw) as Customer[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : seed;
  } catch {
    return seed;
  }
}

export function saveCustomers(customers: Customer[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(customers));
  } catch {
    // localStorage kotası dolmuş olabilir (ör. çok sayıda base64 logo) — sessizce yoksay.
  }
}

// Müşteri Listesi'nden "Hizmet Ekle" ile oluşturulan hizmet kayıtları —
// bu belgeler müşteri detay sayfasına gitmeden, doğrudan listeden
// oluşturulabildiği için (diğer teklif/sözleşme/iş emri kayıtlarının aksine)
// sekme içi geçici state yerine localStorage'da tüm uygulama genelinde saklanır.

import type { ServiceOrder } from "@/lib/mock/crm";
import type { HizmetFormValues } from "@/lib/validations/crm";
import { withholdingFraction } from "@/components/crm/crm-labels";

const STORAGE_KEY = "pestshield.crm.serviceOrders";

export function loadServiceOrders(): ServiceOrder[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ServiceOrder[];
  } catch {
    return [];
  }
}

export function saveServiceOrders(orders: ServiceOrder[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
}

export function getServiceOrdersFor(customerId: string): ServiceOrder[] {
  return loadServiceOrders().filter((o) => o.customerId === customerId);
}

export function addServiceOrder(order: ServiceOrder) {
  const all = loadServiceOrders();
  saveServiceOrders([order, ...all]);
}

export function updateServiceOrder(id: string, patch: Partial<ServiceOrder>) {
  const all = loadServiceOrders();
  saveServiceOrders(all.map((o) => (o.id === id ? { ...o, ...patch } : o)));
}

export function toggleServiceOrderApproval(id: string) {
  const all = loadServiceOrders();
  const now = new Date().toISOString();
  saveServiceOrders(
    all.map((o) => (o.id === id ? { ...o, approved: !o.approved, approvedAt: !o.approved ? now : null } : o)),
  );
}

export function deleteServiceOrders(ids: string[]) {
  const idSet = new Set(ids);
  saveServiceOrders(loadServiceOrders().filter((o) => !idSet.has(o.id)));
}

/** HizmetForm çıktısını localStorage'a yazılacak tam bir ServiceOrder kaydına çevirir. */
export function buildServiceOrder(customerId: string, values: HizmetFormValues, existing?: ServiceOrder): ServiceOrder {
  const subtotal = values.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const vatTotal = values.items.reduce((sum, item) => sum + item.unitPrice * item.quantity * (item.vatRate / 100), 0);
  const withholdingAmount = vatTotal * withholdingFraction(values.withholdingTax);
  const existingCount = getServiceOrdersFor(customerId).length;
  return {
    id: existing?.id ?? `${customerId}-service-${Date.now()}`,
    customerId,
    serviceNo: existing?.serviceNo ?? `HZM-2026-${String(existingCount + 1).padStart(2, "0")}`,
    description: values.description ?? "",
    contractStartDate: values.contractStartDate ?? "",
    contractEndDate: values.contractEndDate ?? "",
    assignedPersonnel: values.assignedPersonnel ?? "",
    periodDays: values.periodDays,
    withholdingTax: values.withholdingTax,
    items: values.items.map((item, i) => ({ id: `item-${i}`, ...item })),
    subtotal,
    vatTotal,
    withholdingAmount,
    total: subtotal + vatTotal - withholdingAmount,
    approved: existing?.approved ?? false,
    approvedAt: existing?.approvedAt ?? null,
    documentCount: existing?.documentCount ?? 0,
    sketchCount: existing?.sketchCount ?? 0,
    contractFileDataUrl: existing?.contractFileDataUrl ?? null,
    contractFileName: existing?.contractFileName ?? null,
    createdAt: existing?.createdAt ?? new Date().toISOString().slice(0, 10),
  };
}

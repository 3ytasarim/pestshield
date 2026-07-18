// PestShield AI Command Center — Faz 3 varlık çözümleme (entity resolution).
//
// tools/executor.ts'deki resolveCustomer ile AYNI desen: LLM asla bir ID
// tahmin etmez, sadece isim/tarih gibi doğal dil ipuçları verir. Gerçek
// eşleştirme HER ZAMAN burada, güvenilir kodda yapılır. Birden fazla eşleşme
// varsa (candidates.length > 1) proposal-builder bunu "requires_clarification"
// durumuna çevirir — asla ilk eşleşen otomatik seçilmez.
//
// Gerçek (Postgres) veri: müşteri/teknisyen/hizmet sözleşmesi/periyot
// zamanlama çekirdeği artık `/api/crm/*` uç noktalarından okunur —
// tarayıcı localStorage'ından değil.

import type { Customer, PeriyotOccurrence, ServiceOrder } from "@/lib/mock/crm";
import type { Technician } from "@/lib/mock/operations";

async function fetchCustomers(): Promise<Customer[]> {
  const res = await fetch("/api/crm/customers");
  if (!res.ok) return [];
  const data = await res.json();
  return data.customers ?? [];
}

async function fetchTechnicians(): Promise<Technician[]> {
  const res = await fetch("/api/operations/technicians");
  if (!res.ok) return [];
  const data = await res.json();
  return data.technicians ?? [];
}

async function fetchServiceOrdersFor(customerId: string): Promise<ServiceOrder[]> {
  const res = await fetch(`/api/crm/service-orders?customerId=${encodeURIComponent(customerId)}`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.serviceOrders ?? [];
}

async function fetchOccurrences(query: Record<string, string>): Promise<PeriyotOccurrence[]> {
  const qs = new URLSearchParams(query).toString();
  const res = await fetch(`/api/crm/periyot/occurrences?${qs}`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.occurrences ?? [];
}

export async function resolveCustomerForAction(name: string): Promise<{ customer: Customer | null; candidates: Customer[] }> {
  const q = name.trim().toLocaleLowerCase("tr");
  if (!q) return { customer: null, candidates: [] };
  const customers = await fetchCustomers();
  const matches = customers.filter((c) => c.companyName.toLocaleLowerCase("tr").includes(q));
  if (matches.length === 1) return { customer: matches[0], candidates: [] };
  if (matches.length > 1) return { customer: null, candidates: matches };
  return { customer: null, candidates: [] };
}

export async function resolveTechnicianForAction(name: string): Promise<{ technician: Technician | null; candidates: Technician[] }> {
  const q = name.trim().toLocaleLowerCase("tr");
  if (!q) return { technician: null, candidates: [] };
  const technicians = await fetchTechnicians();
  const matches = technicians.filter((t) => t.name.toLocaleLowerCase("tr").includes(q));
  if (matches.length === 1) return { technician: matches[0], candidates: [] };
  if (matches.length > 1) return { technician: null, candidates: matches };
  return { technician: null, candidates: [] };
}

export interface ResolvedOccurrence {
  occurrence: PeriyotOccurrence;
  serviceOrder: ServiceOrder;
}

/** Bir müşterinin belirli bir tarihteki (ve varsa saatteki) servis kaydını bulur — reschedule/assign_technician için gereken tek çözümleme adımı. */
export async function resolveOccurrenceForAction(
  customerId: string,
  date: string,
  startTime?: string,
): Promise<{ occurrence: ResolvedOccurrence | null; candidates: ResolvedOccurrence[] }> {
  const [orders, occurrences] = await Promise.all([
    fetchServiceOrdersFor(customerId),
    fetchOccurrences({ customerId, periodDate: date }),
  ]);
  const ordersById = new Map(orders.map((o) => [o.id, o]));
  const all: ResolvedOccurrence[] = [];
  for (const occ of occurrences) {
    if (startTime && occ.startTime !== startTime) continue;
    const serviceOrder = ordersById.get(occ.serviceOrderId);
    if (!serviceOrder) continue;
    all.push({ occurrence: occ, serviceOrder });
  }
  if (all.length === 1) return { occurrence: all[0], candidates: [] };
  if (all.length > 1) return { occurrence: null, candidates: all };
  return { occurrence: null, candidates: [] };
}

/** Bir müşterinin var olan hizmet sözleşmelerini döndürür — create_service için hangi sözleşme altına ekleneceğini bulmakta kullanılır. */
export async function resolveServiceOrderForAction(customerId: string, hint?: string): Promise<{ serviceOrder: ServiceOrder | null; candidates: ServiceOrder[] }> {
  const orders = await fetchServiceOrdersFor(customerId);
  if (orders.length === 0) return { serviceOrder: null, candidates: [] };
  if (orders.length === 1) return { serviceOrder: orders[0], candidates: [] };
  if (hint?.trim()) {
    const q = hint.trim().toLocaleLowerCase("tr");
    const matches = orders.filter((o) => o.description.toLocaleLowerCase("tr").includes(q));
    if (matches.length === 1) return { serviceOrder: matches[0], candidates: [] };
  }
  return { serviceOrder: null, candidates: orders };
}

function timesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return aStart < bEnd && bStart < aEnd;
}

/** Bir teknisyenin aynı gün, çakışan saatte başka bir servise atanmış olup olmadığını tarar. */
export async function findTechnicianConflict(
  technicianName: string,
  date: string,
  startTime: string,
  endTime: string,
  excludeOccurrenceId?: string,
): Promise<PeriyotOccurrence | null> {
  const occurrences = await fetchOccurrences({ periodDate: date });
  return (
    occurrences.find(
      (o) => o.id !== excludeOccurrenceId && o.personnelName === technicianName && timesOverlap(startTime, endTime, o.startTime, o.endTime),
    ) ?? null
  );
}

import type { Customer } from "@/lib/mock/crm";
import { daysUntil } from "@/components/crm/crm-format";

export interface CustomerFilterContext {
  pendingOfferCustomerIds?: Set<string>;
}

export type CustomerFilterKey =
  | "active"
  | "passive"
  | "contract_expiring"
  | "high_risk"
  | "pending_collection"
  | "recent_service"
  | "pending_offer"
  | "potential";

export const FILTER_LABELS: Record<CustomerFilterKey, string> = {
  active: "Aktif Müşteriler",
  passive: "Pasif Müşteriler",
  contract_expiring: "Sözleşmesi Bitmek Üzere",
  high_risk: "Yüksek Riskli Müşteriler",
  pending_collection: "Tahsilat Bekleyenler",
  recent_service: "Son 30 Günde Servis Alanlar",
  pending_offer: "Teklif Bekleyenler",
  potential: "Potansiyel Müşteriler",
};

export function matchesFilter(customer: Customer, key: CustomerFilterKey, context?: CustomerFilterContext): boolean {
  switch (key) {
    case "active":
      return customer.status === "active";
    case "passive":
      return customer.status === "passive";
    case "contract_expiring": {
      const days = daysUntil(customer.contractEndDate);
      return days !== null && days >= 0 && days <= 30;
    }
    case "high_risk":
      return customer.riskLevel === "high" || customer.riskLevel === "critical";
    case "pending_collection":
      return customer.pendingCollection > 0;
    case "recent_service": {
      const days = daysUntil(customer.lastServiceDate);
      return days !== null && days >= -30 && days <= 0;
    }
    case "pending_offer":
      return context?.pendingOfferCustomerIds?.has(customer.id) ?? false;
    case "potential":
      return customer.isPotential;
    default:
      return true;
  }
}

export function matchesSearch(customer: Customer, query: string): boolean {
  if (!query.trim()) return true;
  const q = query.trim().toLowerCase();
  return (
    customer.companyName.toLowerCase().includes(q) ||
    customer.contactName.toLowerCase().includes(q) ||
    customer.contactPhone.toLowerCase().includes(q) ||
    customer.contactEmail.toLowerCase().includes(q) ||
    customer.city.toLowerCase().includes(q)
  );
}

import type { InvoiceStatus, PaymentMethod } from "@/lib/mock/finance";

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  nakit: "Nakit",
  kart: "Kart",
  havale: "Havale",
};

export const PAYMENT_METHOD_OPTIONS: { value: PaymentMethod; label: string }[] = [
  { value: "nakit", label: "Nakit" },
  { value: "kart", label: "Kart" },
  { value: "havale", label: "Havale" },
];

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  paid: "Ödendi",
  pending: "Bekliyor",
  overdue: "Gecikti",
};

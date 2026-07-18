"use client";

// PestShield AI Command Center — gerçek backend'e (Postgres) bağlanan
// tarayıcı-tarafı AiDataProvider implementasyonu. Her metod, oturum
// çerezini kullanan bir `/api/ai/data/*` uç noktasına fetch atar; asıl
// Prisma sorgusu sunucuda (bkz. prisma-data-provider.ts) çalışır ve
// `ownerId` ile kiracıya göre izole edilir. Tool katmanı ve mevcut tool-loop
// (ai-command-center.tsx) hiç değişmeden bu implementasyonu kullanır.

import type {
  AiChecklistRecord,
  AiCorrectiveActionHistoryRecord,
  AiCorrectiveActionRecord,
  AiCustomerRecord,
  AiDataProvider,
  AiInvoiceRecord,
  AiRiskHistoryRecord,
  AiRiskRecord,
  AiServiceOccurrence,
  AiTechnicianRecord,
} from "@/lib/ai/providers/data-provider";

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`/api/ai/data/${path}`);
  if (!res.ok) throw new Error(`AI veri isteği başarısız oldu: ${path}`);
  return res.json() as Promise<T>;
}

export class RemoteAiDataProvider implements AiDataProvider {
  readonly name = "Postgres (per-tenant, /api/ai/data)";

  getServiceOccurrences(): Promise<AiServiceOccurrence[]> {
    return getJson("service-occurrences");
  }

  getInvoices(): Promise<AiInvoiceRecord[]> {
    return getJson("invoices");
  }

  getCustomers(): Promise<AiCustomerRecord[]> {
    return getJson("customers");
  }

  getCustomerBalance(customerId: string): Promise<{ balance: number; isOverdue: boolean; overdueDays: number }> {
    return getJson(`customer-balance?customerId=${encodeURIComponent(customerId)}`);
  }

  getOpenRisks(): Promise<AiRiskRecord[]> {
    return getJson("open-risks");
  }

  getOpenCorrectiveActions(): Promise<AiCorrectiveActionRecord[]> {
    return getJson("open-corrective-actions");
  }

  getTechnicians(): Promise<AiTechnicianRecord[]> {
    return getJson("technicians");
  }

  getAllRisks(): Promise<AiRiskHistoryRecord[]> {
    return getJson("all-risks");
  }

  getAllCorrectiveActions(): Promise<AiCorrectiveActionHistoryRecord[]> {
    return getJson("all-corrective-actions");
  }

  getChecklistItems(): Promise<AiChecklistRecord[]> {
    return getJson("checklist-items");
  }
}

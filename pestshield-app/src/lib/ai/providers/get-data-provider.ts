"use client";

import { RemoteAiDataProvider } from "@/lib/ai/providers/remote-data-provider";
import type { AiDataProvider } from "@/lib/ai/providers/data-provider";

let instance: AiDataProvider | null = null;

/** Uygulamanın AiDataProvider implementasyonunu döndürür — `/api/ai/data/*` üzerinden gerçek, per-tenant Postgres verisine bağlanır. */
export function getAiDataProvider(): AiDataProvider {
  if (!instance) instance = new RemoteAiDataProvider();
  return instance;
}

"use client";

import { AiServiceList } from "@/components/ai-assistant/ai-service-list";
import type { AiServiceRow } from "@/lib/ai/types";

/**
 * PestShield veri modelinde "periyot" ve "servis" aynı temel kaydı
 * (PeriyotOccurrence) paylaşır — ayrı bir periyodik uygulama tablosu
 * yoktur. Bu bileşen, aynı satır verisini "periyot" bağlamında ayrı bir
 * gösterim adı altında sunar (bkz. src/lib/ai/types.ts başındaki not).
 */
export function AiPeriodicServiceList({ services }: { services: AiServiceRow[] }) {
  return <AiServiceList services={services} navigateLabel="Hizmetler'de Aç" />;
}

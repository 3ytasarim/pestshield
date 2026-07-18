// PestShield AI Command Center — Faz 4 dar kapsamlı eskalasyon motoru.
//
// GÜVENLİK/DÜRÜSTLÜK NOTU: Bu uygulamanın rol modeli sadece ADMIN/TECH/CLIENT
// içerir — isimle eşleşen bir "operasyon müdürü" veya "finans müdürü" kullanıcı
// hesabı YOKTUR (Customer.operationsManager/salesRep sadece serbest metin
// alanlarıdır, gerçek kullanıcı hesaplarına bağlı değildir). Bu yüzden
// eskalasyon hedefi İSİMDEN TAHMİN EDİLMEZ (spesifikasyon: "Do not guess
// managers from names") — sadece ADMIN rolüne (bu uygulamadaki en yakın
// "tenant administrator" karşılığı) eskale edilir. Gerçek bir kullanıcı→
// yönetici eşlemesi eklenmeden daha ayrıntılı hedefleme yapılamaz (bkz.
// final rapor, Faz 4.2/5 önerisi).

import { listAlerts, updateAlert } from "@/lib/ai/alerts/alert-store";
import { logAlertEvent } from "@/lib/ai/alerts/alert-audit";
import type { AlertInstance } from "@/lib/ai/alerts/types";

export const ESCALATION_THRESHOLDS = {
  criticalRiskUnacknowledgedHours: 2,
  overduePaymentEscalationDays: 15,
};

export interface EscalationEvent {
  alertId: string;
  ruleCode: string;
  targetRole: "ADMIN";
  message: string;
}

function hoursSince(iso: string): number {
  return (Date.now() - new Date(iso).getTime()) / (60 * 60 * 1000);
}

function alreadyEscalated(alert: AlertInstance): boolean {
  // Aynı uyarı için tekrar tekrar eskale ETMEMEK üzere, uyarının kendi
  // description alanına eklenen sabit bir işaretçi kontrol edilir — ayrı bir
  // eskalasyon tablosu icat etmek yerine mevcut AlertInstance üzerinde asgari
  // bir durum tutulur (occurrenceCount'a benzer, hafif bir yaklaşım).
  return alert.description.includes("[ESKALE EDİLDİ]");
}

export function evaluateEscalations(): EscalationEvent[] {
  const events: EscalationEvent[] = [];
  const alerts = listAlerts();

  for (const alert of alerts) {
    if (alert.status === "dismissed" || alert.status === "resolved") continue;
    if (alreadyEscalated(alert)) continue;

    let shouldEscalate = false;
    let message = "";

    if (alert.category === "critical_risk" && alert.status === "active" && hoursSince(alert.firstDetectedAt) >= ESCALATION_THRESHOLDS.criticalRiskUnacknowledgedHours) {
      shouldEscalate = true;
      message = `Kritik risk ${ESCALATION_THRESHOLDS.criticalRiskUnacknowledgedHours} saattir onaylanmadı: ${alert.title}`;
    } else if (alert.category === "overdue_payment" && hoursSince(alert.firstDetectedAt) >= ESCALATION_THRESHOLDS.overduePaymentEscalationDays * 24) {
      shouldEscalate = true;
      message = `Gecikmiş tahsilat ${ESCALATION_THRESHOLDS.overduePaymentEscalationDays} günden uzun süredir açık: ${alert.title}`;
    }

    if (shouldEscalate) {
      events.push({ alertId: alert.id, ruleCode: alert.ruleCode, targetRole: "ADMIN", message });
      updateAlert(alert.id, { description: `${alert.description} [ESKALE EDİLDİ]` });
    }
  }

  return events;
}

export function runEscalationsAndAudit(userId: string, userRole: string): EscalationEvent[] {
  const events = evaluateEscalations();
  for (const event of events) {
    logAlertEvent({ userId, userRole, alertId: event.alertId, ruleCode: event.ruleCode, event: "escalated", detail: event.message });
  }
  return events;
}

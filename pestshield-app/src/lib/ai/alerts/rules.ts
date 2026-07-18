// PestShield AI Command Center — Faz 4 uyarı kuralları merkezi konfigürasyonu.
//
// Tüm eşik değerleri BURADA, tek yerde tanımlanır (spesifikasyon: "Do not
// hardcode tenant-specific thresholds throughout the code"). engine.ts bu
// dosyadaki sabitleri okur, kendi eşiğini icat etmez.
//
// Faz 1'in "periyot ve servis aynı temel kaydı ifade eder" notuyla AYNI
// nedenle, spesifikasyonun ayrı listelediği bazı kategoriler burada
// BİLİNÇLİ OLARAK uygulanmadı (bkz. final rapor):
//   - periodic_service_due / overdue_periodic_service → overdue_service ve
//     service_due_today/tomorrow ile AYNI PeriyotOccurrence kaydını
//     kullanır; ayrı bir kural eklemek aynı kayıt için ikinci bir uyarı
//     (duplicate) üretirdi.
//   - missing_document / expiring_document → mevcut veri modelinde
//     occurrence.isCompleted dışında ayrı bir belge takibi yok; bu zaten
//     overdue_service tarafından kapsanıyor.
//   - audit_readiness_drop → "düşüş" tespiti için geçmiş bir skor
//     anlık görüntüsü (snapshot) gerekir; böyle bir depolama yok.
//   - report_generation_failed → bu uygulamada rapor üretimi yerel/
//     deterministik bir hesaplamadır, gerçek bir başarısızlık modu yok.
//   - message_delivery_failed → Faz 4.2 WhatsApp mesaj deposu üzerinden
//     ayrıca değerlendirilir (bkz. whatsapp/message-store.ts), bu genel
//     kural motorunun parçası değildir.

import type { AlertCategory, AlertDeliveryChannel, AlertRule } from "@/lib/ai/alerts/types";

export const RULE_VERSION = 1;

/** Tüm sayısal eşikler — tek merkezi kaynak. */
export const ALERT_THRESHOLDS = {
  expiringContractDays: 30,
  technicianDailyServiceLimit: 6,
  risingPestActivityMinIncreasePercent: 30,
  risingPestActivityWindowDays: 30,
};

const ALL_ROLES: Array<"ADMIN" | "TECH" | "CLIENT"> = ["ADMIN", "TECH", "CLIENT"];
const MANAGEMENT_ROLES: Array<"ADMIN" | "TECH" | "CLIENT"> = ["ADMIN", "CLIENT"];
const DEFAULT_CHANNELS: AlertDeliveryChannel[] = ["in_app"];

function rule(partial: Omit<AlertRule, "id" | "ruleVersion" | "evaluationFrequencyMinutes" | "deliveryChannels" | "targetRoles"> & { targetRoles?: Array<"ADMIN" | "TECH" | "CLIENT">; deliveryChannels?: AlertDeliveryChannel[] }): AlertRule {
  return {
    id: `rule-${partial.code}`,
    ruleVersion: RULE_VERSION,
    evaluationFrequencyMinutes: 15,
    targetRoles: partial.targetRoles ?? ALL_ROLES,
    deliveryChannels: partial.deliveryChannels ?? DEFAULT_CHANNELS,
    ...partial,
  };
}

export const ALERT_RULES: Record<AlertCategory, AlertRule> = {
  overdue_service: rule({
    code: "overdue_service",
    name: "Gecikmiş Servis",
    description: "Planlanan tarihi geçmiş ama tamamlanmamış servis kayıtları.",
    category: "overdue_service",
    severity: "high",
    isEnabled: true,
    threshold: 1,
  }),
  service_due_today: rule({
    code: "service_due_today",
    name: "Bugün Planlanan Servis",
    description: "Bugün gerçekleştirilmesi planlanan servisler.",
    category: "service_due_today",
    severity: "info",
    isEnabled: true,
    threshold: 1,
  }),
  service_due_tomorrow: rule({
    code: "service_due_tomorrow",
    name: "Yarın Planlanan Servis",
    description: "Yarın gerçekleştirilmesi planlanan servisler.",
    category: "service_due_tomorrow",
    severity: "info",
    isEnabled: true,
    threshold: 1,
  }),
  unassigned_service: rule({
    code: "unassigned_service",
    name: "Atanmamış Servis",
    description: "Yaklaşan ama henüz bir teknisyene atanmamış servisler.",
    category: "unassigned_service",
    severity: "warning",
    isEnabled: true,
    threshold: 1,
    targetRoles: MANAGEMENT_ROLES,
  }),
  technician_schedule_conflict: rule({
    code: "technician_schedule_conflict",
    name: "Teknisyen Program Çakışması",
    description: "Aynı teknisyenin aynı gün çakışan saatlerde birden fazla servise atanması.",
    category: "technician_schedule_conflict",
    severity: "high",
    isEnabled: true,
    threshold: 1,
    targetRoles: MANAGEMENT_ROLES,
  }),
  technician_overload: rule({
    code: "technician_overload",
    name: "Teknisyen Aşırı Yüklenmesi",
    description: `Bir teknisyene aynı günde günlük limitten (${ALERT_THRESHOLDS.technicianDailyServiceLimit}) fazla servis atanması.`,
    category: "technician_overload",
    severity: "warning",
    isEnabled: true,
    threshold: ALERT_THRESHOLDS.technicianDailyServiceLimit,
    targetRoles: MANAGEMENT_ROLES,
  }),
  overdue_payment: rule({
    code: "overdue_payment",
    name: "Gecikmiş Tahsilat",
    description: "Vadesi geçmiş, ödenmemiş faturalar.",
    category: "overdue_payment",
    severity: "warning",
    isEnabled: true,
    threshold: 1,
    targetRoles: MANAGEMENT_ROLES,
  }),
  payment_due_today: rule({
    code: "payment_due_today",
    name: "Bugün Vadesi Gelen Tahsilat",
    description: "Bugün vadesi gelen, henüz ödenmemiş faturalar.",
    category: "payment_due_today",
    severity: "info",
    isEnabled: true,
    threshold: 1,
    targetRoles: MANAGEMENT_ROLES,
  }),
  payment_due_tomorrow: rule({
    code: "payment_due_tomorrow",
    name: "Yarın Vadesi Gelen Tahsilat",
    description: "Yarın vadesi gelen, henüz ödenmemiş faturalar.",
    category: "payment_due_tomorrow",
    severity: "info",
    isEnabled: true,
    threshold: 1,
    targetRoles: MANAGEMENT_ROLES,
  }),
  expiring_contract: rule({
    code: "expiring_contract",
    name: "Süresi Dolan Sözleşme",
    description: `Önümüzdeki ${ALERT_THRESHOLDS.expiringContractDays} gün içinde sona erecek sözleşmeler.`,
    category: "expiring_contract",
    severity: "warning",
    isEnabled: true,
    threshold: ALERT_THRESHOLDS.expiringContractDays,
    targetRoles: MANAGEMENT_ROLES,
  }),
  critical_risk: rule({
    code: "critical_risk",
    name: "Kritik Risk",
    description: "Açık, kritik seviyeli risk kayıtları.",
    category: "critical_risk",
    severity: "critical",
    isEnabled: true,
    threshold: 1,
  }),
  unresolved_corrective_action: rule({
    code: "unresolved_corrective_action",
    name: "Gecikmiş Düzeltici Faaliyet",
    description: "Son tarihi geçmiş, kapanmamış düzeltici/önleyici faaliyetler.",
    category: "unresolved_corrective_action",
    severity: "high",
    isEnabled: true,
    threshold: 1,
  }),
  rising_pest_activity: rule({
    code: "rising_pest_activity",
    name: "Artan Haşere Aktivitesi",
    description: `Son ${ALERT_THRESHOLDS.risingPestActivityWindowDays} günde risk kaydı sayısının önceki döneme göre %${ALERT_THRESHOLDS.risingPestActivityMinIncreasePercent}'den fazla artması.`,
    category: "rising_pest_activity",
    severity: "warning",
    isEnabled: true,
    threshold: ALERT_THRESHOLDS.risingPestActivityMinIncreasePercent,
  }),
};

export function rulesForRole(role: "ADMIN" | "TECH" | "CLIENT"): AlertRule[] {
  return Object.values(ALERT_RULES).filter((r) => r.isEnabled && r.targetRoles.includes(role));
}

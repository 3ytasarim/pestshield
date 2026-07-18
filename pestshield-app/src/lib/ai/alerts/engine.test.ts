import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProactiveAlertEngine } from "@/lib/ai/alerts/engine";
import { listAlerts, upsertAlert } from "@/lib/ai/alerts/alert-store";
import { acknowledgeAlert, dismissAlert, snoozeAlert } from "@/lib/ai/alerts/alert-actions";
import { rulesForRole, ALERT_RULES } from "@/lib/ai/alerts/rules";
import { isWithinQuietHours, meetsMinimumSeverity, type NotificationPreferences } from "@/lib/ai/notifications/preferences-store";
import { recordBriefingDelivery, wasBriefingDeliveredToday, listBriefingHistory } from "@/lib/ai/notifications/briefing-store";
import type { AiDataProvider, AiServiceOccurrence } from "@/lib/ai/providers/data-provider";

const TODAY = "2026-07-13";

function fakeLocalStorage() {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value),
    removeItem: (key: string) => void store.delete(key),
    clear: () => store.clear(),
  };
}

class FakeProvider implements AiDataProvider {
  readonly name = "fake";
  constructor(private readonly occurrences: AiServiceOccurrence[] = []) {}
  async getServiceOccurrences() {
    return this.occurrences;
  }
  async getInvoices() {
    return [];
  }
  async getCustomers() {
    return [];
  }
  async getCustomerBalance() {
    return { balance: 0, isOverdue: false, overdueDays: 0 };
  }
  async getOpenRisks() {
    return [];
  }
  async getOpenCorrectiveActions() {
    return [];
  }
  async getTechnicians() {
    return [];
  }
  async getAllRisks() {
    return [];
  }
  async getAllCorrectiveActions() {
    return [];
  }
  async getChecklistItems() {
    return [];
  }
}

function occ(overrides: Partial<AiServiceOccurrence> = {}): AiServiceOccurrence {
  return {
    occurrenceId: "occ-1",
    customerId: "cust-1",
    customerName: "ABC Gıda",
    serviceOrderId: "order-1",
    serviceName: "Kemirgen Kontrol",
    personnelName: "Ahmet Yılmaz",
    periodDate: "2026-07-10",
    startTime: "09:00",
    endTime: "10:00",
    isCompleted: false,
    ...overrides,
  };
}

describe("Faz 4 — ProactiveAlertEngine", () => {
  beforeEach(() => {
    vi.stubGlobal("window", { localStorage: fakeLocalStorage() });
  });

  it("gecikmiş bir servisten deterministik olarak bir uyarı üretir", async () => {
    const provider = new FakeProvider([occ({ periodDate: "2026-07-10", isCompleted: false })]);
    await ProactiveAlertEngine.evaluate(provider, TODAY);
    const alerts = listAlerts();
    expect(alerts).toHaveLength(1);
    expect(alerts[0].category).toBe("overdue_service");
    expect(alerts[0].severity).toBe("high"); // rules.ts'te merkezi olarak tanımlı, deterministik
  });

  it("aynı koşul tekrar tekrar çalıştırıldığında ikinci bir uyarı OLUŞTURMAZ, mevcut olanı günceller", async () => {
    const provider = new FakeProvider([occ({ periodDate: "2026-07-10", isCompleted: false })]);
    await ProactiveAlertEngine.evaluate(provider, TODAY);
    await ProactiveAlertEngine.evaluate(provider, TODAY);
    const alerts = listAlerts();
    expect(alerts).toHaveLength(1);
    expect(alerts[0].occurrenceCount).toBe(2);
  });

  it("koşul artık geçerli değilse (servis tamamlandı) uyarı 'resolved' olarak kapanır", async () => {
    const provider1 = new FakeProvider([occ({ periodDate: "2026-07-10", isCompleted: false })]);
    await ProactiveAlertEngine.evaluate(provider1, TODAY);
    expect(listAlerts()[0].status).toBe("active");

    const provider2 = new FakeProvider([occ({ periodDate: "2026-07-10", isCompleted: true })]);
    await ProactiveAlertEngine.evaluate(provider2, TODAY);
    expect(listAlerts()[0].status).toBe("resolved");
    expect(listAlerts()[0].resolvedAt).not.toBeNull();
  });

  it("dismiss edilmiş bir uyarı, koşul hâlâ geçerliyken bile sessizce yeniden AÇILMAZ", async () => {
    const provider = new FakeProvider([occ({ periodDate: "2026-07-10", isCompleted: false })]);
    await ProactiveAlertEngine.evaluate(provider, TODAY);
    dismissAlert("user-1", "ADMIN", listAlerts()[0].id);
    await ProactiveAlertEngine.evaluate(provider, TODAY);
    expect(listAlerts()[0].status).toBe("dismissed");
  });

  it("acknowledge işlemi altta yatan servis kaydını DEĞİŞTİRMEZ", async () => {
    const occurrence = occ({ periodDate: "2026-07-10", isCompleted: false, personnelName: "Ahmet Yılmaz" });
    const provider = new FakeProvider([occurrence]);
    await ProactiveAlertEngine.evaluate(provider, TODAY);
    acknowledgeAlert("user-1", "ADMIN", listAlerts()[0].id);
    // occurrence nesnesi provider'dan bağımsız, hiç mutasyona uğramadı — referans aynı kaldı.
    expect(occurrence.personnelName).toBe("Ahmet Yılmaz");
    expect(occurrence.isCompleted).toBe(false);
  });

  it("snooze edilen bir uyarı 'snoozed' durumuna geçer ve normal listede süresi dolana kadar görünmez mantığı doğru kurulur", () => {
    const alertId = "manual-1";
    // Doğrudan store'a basit bir aktif kayıt ekleyip snooze davranışını izole test eder.
    vi.stubGlobal("window", { localStorage: fakeLocalStorage() });
    upsertAlert({
      id: alertId,
      ruleId: "rule-critical_risk",
      ruleCode: "critical_risk",
      ruleVersion: 1,
      category: "critical_risk",
      severity: "critical",
      title: "t",
      description: "d",
      evidence: "e",
      sourceEntityType: null,
      sourceEntityId: null,
      relatedCustomerId: null,
      relatedCustomerName: null,
      relatedTechnicianName: null,
      navigationHref: null,
      firstDetectedAt: new Date().toISOString(),
      lastDetectedAt: new Date().toISOString(),
      occurrenceCount: 1,
      status: "active",
      acknowledgedBy: null,
      acknowledgedAt: null,
      dismissedBy: null,
      dismissedAt: null,
      snoozedUntil: null,
      resolvedAt: null,
      deduplicationKey: "k1",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    const updated = snoozeAlert("user-1", "ADMIN", alertId, "4h");
    expect(updated?.status).toBe("snoozed");
    expect(updated?.snoozedUntil).not.toBeNull();
  });

  it("rol filtrelemesi: 'unassigned_service' TECH rolüne gösterilmez, ADMIN'e gösterilir", () => {
    const techRules = rulesForRole("TECH").map((r) => r.category);
    const adminRules = rulesForRole("ADMIN").map((r) => r.category);
    expect(techRules).not.toContain("unassigned_service");
    expect(adminRules).toContain("unassigned_service");
  });

  it("her kategori için önem derecesi merkezi kurallardan gelir, LLM tarafından değiştirilemez", () => {
    expect(ALERT_RULES.critical_risk.severity).toBe("critical");
    expect(ALERT_RULES.service_due_today.severity).toBe("info");
  });
});

describe("Faz 4 — sessiz saatler ve minimum önem derecesi", () => {
  const basePrefs: NotificationPreferences = {
    inAppEnabled: true,
    emailEnabled: true,
    whatsappEnabled: true,
    pushEnabled: false,
    voicePlaybackEnabled: true,
    dailyBriefingEnabled: true,
    dailyBriefingTime: "08:00",
    dailyBriefingWeekdaysOnly: false,
    timezone: "Europe/Istanbul",
    quietHoursStart: "22:00",
    quietHoursEnd: "07:00",
    minimumSeverity: "warning",
  };

  it("gece yarısını geçen sessiz saat aralığını doğru değerlendirir", () => {
    expect(isWithinQuietHours(basePrefs, "23:00")).toBe(true);
    expect(isWithinQuietHours(basePrefs, "03:00")).toBe(true);
    expect(isWithinQuietHours(basePrefs, "12:00")).toBe(false);
  });

  it("minimum önem derecesi altındaki uyarılar filtrelenir", () => {
    expect(meetsMinimumSeverity(basePrefs, "info")).toBe(false);
    expect(meetsMinimumSeverity(basePrefs, "warning")).toBe(true);
    expect(meetsMinimumSeverity(basePrefs, "critical")).toBe(true);
  });
});

describe("Faz 4 — günlük brifing tekrarını önleme", () => {
  beforeEach(() => {
    vi.stubGlobal("window", { localStorage: fakeLocalStorage() });
  });

  it("aynı kullanıcı+tarih için brifing sadece bir kez kaydedilir", () => {
    expect(wasBriefingDeliveredToday("user-1", TODAY)).toBe(false);
    recordBriefingDelivery("user-1", TODAY, ["in_app"]);
    expect(wasBriefingDeliveredToday("user-1", TODAY)).toBe(true);
    recordBriefingDelivery("user-1", TODAY, ["in_app"]); // ikinci çağrı hiçbir şey eklemez
    expect(listBriefingHistory("user-1")).toHaveLength(1);
  });
});

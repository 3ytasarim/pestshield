"use client";

import { useCallback, useEffect, useState } from "react";
import { getAiDataProvider } from "@/lib/ai/providers/get-data-provider";
import { todayInTimeZone } from "@/lib/ai/date-parser";
import { ProactiveAlertEngine } from "@/lib/ai/alerts/engine";
import { rulesForRole } from "@/lib/ai/alerts/rules";
import { listAlerts } from "@/lib/ai/alerts/alert-store";
import { acknowledgeAlert, dismissAlert, reactivateExpiredSnoozes, snoozeAlert, type SnoozeOption } from "@/lib/ai/alerts/alert-actions";
import { runEscalationsAndAudit } from "@/lib/ai/alerts/escalation";
import { ClientIntervalJobProvider } from "@/lib/ai/background/job-provider";
import type { AlertInstance } from "@/lib/ai/alerts/types";

const EVALUATION_INTERVAL_MS = 15 * 60 * 1000; // rules.ts'teki evaluationFrequencyMinutes ile uyumlu

let sharedJobProvider: ClientIntervalJobProvider | null = null;

function todayIsoIstanbul(): string {
  const d = todayInTimeZone(new Date(), "Europe/Istanbul");
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Uygulama genelinde TEK bir zamanlayıcı çalışır — her bileşen kendi interval'ını kurmaz. */
export function useProactiveAlerts(userId: string | undefined, role: "ADMIN" | "TECH" | "CLIENT" | undefined) {
  const [alerts, setAlerts] = useState<AlertInstance[]>([]);

  const refresh = useCallback(() => {
    if (!role) return;
    const allowedCategories = new Set(rulesForRole(role).map((r) => r.category));
    reactivateExpiredSnoozes(listAlerts());
    // "snoozed" durumundaki uyarılar süresi dolana kadar normal listede
    // GÖRÜNMEZ (spesifikasyon: "should not trigger normal repeated
    // notifications until the snooze expires") — süresi dolanlar
    // reactivateExpiredSnoozes ile zaten "active"e döndü.
    setAlerts(listAlerts().filter((a) => allowedCategories.has(a.category) && a.status !== "dismissed" && a.status !== "resolved" && a.status !== "expired" && a.status !== "snoozed"));
  }, [role]);

  useEffect(() => {
    if (!userId || !role) return;
    const provider = getAiDataProvider();

    if (!sharedJobProvider) {
      sharedJobProvider = new ClientIntervalJobProvider();
      sharedJobProvider.register("evaluate_alert_rules", EVALUATION_INTERVAL_MS, async () => {
        await ProactiveAlertEngine.evaluate(provider, todayIsoIstanbul());
        runEscalationsAndAudit(userId, role);
        refresh();
      });
    } else {
      refresh();
    }
    // Sekme her odaklandığında da tazele (uzun süre açık kalan sekmelerde güncel kalması için).
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, role]);

  return {
    alerts,
    acknowledge: (alertId: string) => {
      if (!userId || !role) return;
      acknowledgeAlert(userId, role, alertId);
      refresh();
    },
    dismiss: (alertId: string) => {
      if (!userId || !role) return;
      dismissAlert(userId, role, alertId);
      refresh();
    },
    snooze: (alertId: string, option: SnoozeOption, customIso?: string) => {
      if (!userId || !role) return;
      snoozeAlert(userId, role, alertId, option, customIso);
      refresh();
    },
  };
}

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Save, Package } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { GLASS_CARD } from "@/components/dashboard/shared";
import { getClientNavHrefs } from "@/components/layout/nav-config";
import { cn } from "@/lib/utils";

const NAV_HREFS = getClientNavHrefs();

const FEATURE_ITEMS = [
  { href: "feature:kroki", group: "Ek Özellik", label: "Etkileşimli Kat Planları (Kroki)" },
  { href: "feature:trend-analiz", group: "Ek Özellik", label: "Trend Analizi" },
  { href: "feature:customer-portal", group: "Ek Özellik", label: "Müşteri Portalı" },
];

const CATALOG = [...NAV_HREFS, ...FEATURE_ITEMS];

interface PlanRow {
  key: "starter" | "pro" | "enterprise";
  name: string;
  maxUsers: number | null;
  maxCustomers: number | null;
  allowedModules: string[];
}

const PLAN_ORDER: PlanRow["key"][] = ["starter", "pro", "enterprise"];

export function AdminPlansPage({ initialPlans }: { initialPlans: PlanRow[] }) {
  const [plans, setPlans] = useState<PlanRow[]>(initialPlans);
  const [activeKey, setActiveKey] = useState<PlanRow["key"]>("starter");
  const [saving, setSaving] = useState(false);

  const active = plans.find((p) => p.key === activeKey);

  function updateActive(patch: Partial<PlanRow>) {
    setPlans((prev) => prev.map((p) => (p.key === activeKey ? { ...p, ...patch } : p)));
  }

  function toggleModule(href: string, checked: boolean) {
    if (!active) return;
    const next = checked ? [...active.allowedModules, href] : active.allowedModules.filter((h) => h !== href);
    updateActive({ allowedModules: next });
  }

  async function handleSave() {
    if (!active) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/plans", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: active.key,
          maxUsers: active.maxUsers,
          maxCustomers: active.maxCustomers,
          allowedModules: active.allowedModules,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.message ?? "Paket kaydedilemedi");
        return;
      }
      toast.success(`${active.name} güncellendi`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col gap-1.5"
      >
        <h1 className="flex items-center gap-2 text-[2rem] leading-tight font-semibold tracking-tight text-foreground">
          <Package className="size-7 text-primary" />
          Paket Modülleri
        </h1>
        <p className="max-w-xl text-sm text-muted-foreground">
          Her paketin kullanıcı/müşteri limitini ve hangi modülleri göreceğini belirleyin. Bu ayarlar SADECE multi-tenant
          firmalarda (kendi paketi atanmış olanlarda) uygulanır — standalone kurulumlarda hiçbir kısıtlama yapılmaz.
        </p>
      </motion.div>

      <Tabs value={activeKey} onValueChange={(v) => setActiveKey((v as PlanRow["key"]) ?? "starter")}>
        <TabsList variant="line" className="w-max">
          {PLAN_ORDER.map((key) => (
            <TabsTrigger key={key} value={key}>
              {plans.find((p) => p.key === key)?.name ?? key}
            </TabsTrigger>
          ))}
        </TabsList>

        {PLAN_ORDER.map((key) => (
          <TabsContent key={key} value={key} className="mt-4">
            {active && active.key === key && (
              <div className="flex flex-col gap-4">
                <Card className={cn(GLASS_CARD, "rounded-2xl")}>
                  <CardContent className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                    <div>
                      <Label className="mb-1.5">Maksimum Kullanıcı</Label>
                      <Input
                        type="number"
                        min={0}
                        placeholder="Sınırsız"
                        value={active.maxUsers ?? ""}
                        onChange={(e) => updateActive({ maxUsers: e.target.value === "" ? null : Number(e.target.value) })}
                        className="h-11 rounded-xl px-3.5"
                      />
                    </div>
                    <div>
                      <Label className="mb-1.5">Maksimum Müşteri</Label>
                      <Input
                        type="number"
                        min={0}
                        placeholder="Sınırsız"
                        value={active.maxCustomers ?? ""}
                        onChange={(e) => updateActive({ maxCustomers: e.target.value === "" ? null : Number(e.target.value) })}
                        className="h-11 rounded-xl px-3.5"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className={cn(GLASS_CARD, "rounded-2xl")}>
                  <CardContent className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-foreground">Görünür Modüller</p>
                      <Button size="sm" onClick={() => void handleSave()} loading={saving}>
                        <Save className="size-3.5" />
                        Kaydet
                      </Button>
                    </div>
                    <div className="flex max-h-[60vh] flex-col divide-y divide-border/60 overflow-y-auto rounded-xl border border-border/60">
                      {CATALOG.map((item) => (
                        <label key={item.href} className="flex items-center justify-between gap-2 px-3.5 py-2.5 text-sm hover:bg-muted/40">
                          <span className="text-foreground">
                            <span className="text-xs text-muted-foreground">{item.group} · </span>
                            {item.label}
                          </span>
                          <Checkbox
                            checked={active.allowedModules.includes(item.href)}
                            onCheckedChange={(checked) => toggleModule(item.href, !!checked)}
                          />
                        </label>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

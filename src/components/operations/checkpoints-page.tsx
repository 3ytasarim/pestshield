"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ClipboardList, ListChecks, Repeat, Tag } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { CrmKpiCard } from "@/components/crm/crm-kpi-card";
import { GLASS_CARD } from "@/components/dashboard/shared";
import { checklistTemplates } from "@/lib/mock/operations";
import { cn } from "@/lib/utils";

export function CheckpointsPage() {
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const categories = useMemo(() => Array.from(new Set(checklistTemplates.map((c) => c.category))), []);

  const filtered = useMemo(
    () => (categoryFilter === "all" ? checklistTemplates : checklistTemplates.filter((c) => c.category === categoryFilter)),
    [categoryFilter],
  );

  const everyVisitCount = useMemo(() => checklistTemplates.filter((c) => c.frequency === "Her ziyarette").length, []);

  return (
    <div className="flex flex-col gap-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col gap-1.5"
      >
        <h1 className="text-[2rem] leading-tight font-semibold tracking-tight text-foreground">Kontrol Noktaları</h1>
        <p className="max-w-xl text-sm text-muted-foreground">
          Rutin servis ziyaretlerinde teknisyenlerin gözden geçirdiği operasyonel kontrol maddeleri kütüphanesi. Sertifikasyon
          denetim checklist'leri için Denetim modülündeki HACCP/BRCGS/ISO/FSSC sayfalarına bakın.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <CrmKpiCard label="Toplam Kontrol Maddesi" value={checklistTemplates.length} description="Tanımlı checklist maddesi" changePercent={4} icon={ListChecks} accent="blue" delay={0.05} />
        <CrmKpiCard label="Her Ziyarette" value={everyVisitCount} description="Her serviste kontrol edilir" changePercent={6} icon={Repeat} accent="emerald" delay={0.1} />
        <CrmKpiCard label="Kategori" value={categories.length} description="Yapısal, hijyen, ekipman, eğitim" changePercent={0} icon={Tag} accent="purple" delay={0.15} />
      </div>

      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => setCategoryFilter("all")}
          className={cn(
            "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
            categoryFilter === "all" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70",
          )}
        >
          Tümü
        </button>
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => setCategoryFilter(category)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
              categoryFilter === category
                ? "border-primary/20 bg-primary text-primary-foreground"
                : "border-border bg-background text-muted-foreground hover:bg-muted",
            )}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {filtered.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: Math.min(index, 8) * 0.03, ease: [0.16, 1, 0.3, 1] }}
          >
            <Card className={cn(GLASS_CARD, "h-full rounded-2xl")}>
              <CardContent className="flex flex-col gap-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <ClipboardList className="size-4.5" />
                  </div>
                  <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">{item.frequency}</span>
                </div>
                <div>
                  <p className="font-semibold text-foreground">{item.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                </div>
                <span className="w-fit rounded-full border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground">{item.category}</span>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

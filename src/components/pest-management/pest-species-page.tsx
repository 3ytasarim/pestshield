"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Bug, ShieldAlert, Sun } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { CrmKpiCard } from "@/components/crm/crm-kpi-card";
import { GLASS_CARD } from "@/components/dashboard/shared";
import { RiskBadge } from "@/components/crm/crm-badges";
import { PestIcon } from "@/components/pest-management/pest-icon";
import { PEST_CATEGORY_LABELS, pestSpecies, type PestCategory } from "@/lib/mock/pest-management";
import { cn } from "@/lib/utils";

type CategoryFilter = "all" | PestCategory;

export function PestSpeciesPage() {
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");

  const filtered = useMemo(
    () => pestSpecies.filter((s) => categoryFilter === "all" || s.category === categoryFilter),
    [categoryFilter],
  );

  const criticalCount = useMemo(() => pestSpecies.filter((s) => s.riskLevel === "critical").length, []);
  const categoryCount = useMemo(() => new Set(pestSpecies.map((s) => s.category)).size, []);

  function categoryCountFor(category: PestCategory) {
    return pestSpecies.filter((s) => s.category === category).length;
  }

  return (
    <div className="flex flex-col gap-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col gap-1.5"
      >
        <h1 className="text-[2rem] leading-tight font-semibold tracking-tight text-foreground">Zararlı Türleri</h1>
        <p className="max-w-xl text-sm text-muted-foreground">
          Sahada karşılaşılan zararlı türleri, risk seviyeleri ve önerilen kontrol yöntemleri.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <CrmKpiCard label="Kayıtlı Tür" value={pestSpecies.length} description="Referans katalogdaki tür sayısı" changePercent={4} icon={Bug} accent="blue" delay={0.05} />
        <CrmKpiCard label="Kritik Risk" value={criticalCount} description="Acil kontrol gerektiren türler" changePercent={criticalCount > 0 ? 10 : -10} icon={ShieldAlert} accent="amber" delay={0.1} />
        <CrmKpiCard label="Kategori" value={categoryCount} description="Kemirgen, haşere, uçan ve depo zararlısı" changePercent={0} icon={Sun} accent="emerald" delay={0.15} />
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
          Tümü ({pestSpecies.length})
        </button>
        {(Object.keys(PEST_CATEGORY_LABELS) as PestCategory[]).map((category) => (
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
            {PEST_CATEGORY_LABELS[category]} ({categoryCountFor(category)})
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((species, index) => (
          <motion.div
            key={species.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: Math.min(index, 9) * 0.03, ease: [0.16, 1, 0.3, 1] }}
          >
            <Card className={cn(GLASS_CARD, "h-full rounded-2xl")}>
              <CardContent className="flex flex-col gap-3">
                <div className="flex items-start gap-3">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <PestIcon icon={species.icon} className="size-7" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold leading-tight">{species.name}</p>
                    <p className="truncate text-xs text-muted-foreground italic">{species.scientificName}</p>
                  </div>
                  <RiskBadge level={species.riskLevel} className="shrink-0" />
                </div>

                <div className="flex flex-wrap gap-1.5">
                  <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                    {PEST_CATEGORY_LABELS[species.category]}
                  </span>
                  <span className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                    <Sun className="size-3" />
                    {species.activeSeason}
                  </span>
                </div>

                <p className="text-sm text-foreground/80">{species.description}</p>

                <div className="mt-auto rounded-xl bg-muted/30 p-3 text-xs">
                  <p className="font-semibold text-muted-foreground uppercase">Kontrol Yöntemi</p>
                  <p className="mt-0.5 text-foreground/80">{species.controlMethod}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

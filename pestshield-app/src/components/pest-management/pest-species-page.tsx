"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Bug, Pencil, Plus, ShieldAlert, Sun, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CrmKpiCard } from "@/components/crm/crm-kpi-card";
import { EmptyState } from "@/components/crm/detail/empty-state";
import { GLASS_CARD } from "@/components/dashboard/shared";
import { RiskBadge } from "@/components/crm/crm-badges";
import { PestIcon } from "@/components/pest-management/pest-icon";
import { PestSpeciesForm } from "@/components/pest-management/pest-species-form";
import { PEST_CATEGORY_LABELS, type PestCategory, type PestIconKey } from "@/lib/mock/pest-management";
import type { PestSpeciesFormValues } from "@/lib/validations/pest-management";
import type { PestSpeciesEntryDTO } from "@/lib/pest-management/serialize";
import { cn } from "@/lib/utils";

type CategoryFilter = "all" | PestCategory;

export function PestSpeciesPage() {
  const [species, setSpecies] = useState<PestSpeciesEntryDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<PestSpeciesEntryDTO | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PestSpeciesEntryDTO | null>(null);

  function loadSpecies() {
    fetch("/api/pest-management/species")
      .then((res) => res.json())
      .then((data) => setSpecies(data.species ?? []))
      .catch(() => toast.error("Zararlı türleri yüklenemedi"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadSpecies();
  }, []);

  const filtered = useMemo(
    () => species.filter((s) => categoryFilter === "all" || s.category === categoryFilter),
    [species, categoryFilter],
  );

  const criticalCount = useMemo(() => species.filter((s) => s.riskLevel === "critical").length, [species]);
  const categoryCount = useMemo(() => new Set(species.map((s) => s.category)).size, [species]);

  function categoryCountFor(category: PestCategory) {
    return species.filter((s) => s.category === category).length;
  }

  async function handleSubmit(values: PestSpeciesFormValues) {
    const isEditing = !!editing;
    const res = await fetch(isEditing ? `/api/pest-management/species/${editing!.id}` : "/api/pest-management/species", {
      method: isEditing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (!res.ok) {
      toast.error(isEditing ? "Tür güncellenemedi" : "Tür eklenemedi");
      return;
    }
    toast.success(isEditing ? "Tür güncellendi" : "Tür eklendi");
    setFormOpen(false);
    setEditing(null);
    loadSpecies();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const res = await fetch(`/api/pest-management/species/${deleteTarget.id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Tür silinemedi");
      return;
    }
    toast.success("Tür silindi");
    setDeleteTarget(null);
    loadSpecies();
  }

  return (
    <div className="flex flex-col gap-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="flex items-start justify-between gap-4"
      >
        <div className="flex flex-col gap-1.5">
          <h1 className="text-[2rem] leading-tight font-semibold tracking-tight text-foreground">Zararlı Türleri</h1>
          <p className="max-w-xl text-sm text-muted-foreground">
            Sahada karşılaşılan zararlı türleri, risk seviyeleri ve önerilen kontrol yöntemleri — kendi kataloğunuzu düzenleyin.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
          startContent={<Plus className="size-4" aria-hidden="true" />}
        >
          Yeni Tür Ekle
        </Button>
      </motion.div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <CrmKpiCard label="Kayıtlı Tür" value={species.length} description="Kataloğunuzdaki tür sayısı" changePercent={4} icon={Bug} accent="blue" delay={0.05} />
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
          Tümü ({species.length})
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

      {!loading && filtered.length === 0 ? (
        <EmptyState icon={Bug} title="Tür yok" description="Bu kategoride henüz kayıtlı bir zararlı türü yok. Yeni Tür Ekle ile başlayın." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((s, index) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: Math.min(index, 9) * 0.03, ease: [0.16, 1, 0.3, 1] }}
            >
              <Card className={cn(GLASS_CARD, "h-full rounded-2xl")}>
                <CardContent className="flex flex-col gap-3">
                  <div className="flex items-start gap-3">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <PestIcon icon={s.icon as PestIconKey} className="size-7" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold leading-tight">{s.name}</p>
                      <p className="truncate text-xs text-muted-foreground italic">{s.scientificName}</p>
                    </div>
                    <RiskBadge level={s.riskLevel as "low" | "medium" | "high" | "critical"} className="shrink-0" />
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                      {PEST_CATEGORY_LABELS[s.category as PestCategory]}
                    </span>
                    {s.activeSeason && (
                      <span className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                        <Sun className="size-3" />
                        {s.activeSeason}
                      </span>
                    )}
                  </div>

                  <div className="rich-content-preview text-sm text-foreground/80 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5" dangerouslySetInnerHTML={{ __html: s.contentHtml }} />

                  <div className="mt-auto flex items-center justify-end gap-1 border-t border-border/60 pt-2.5">
                    <Button
                      variant="ghost"
                      size="xs"
                      startContent={<Pencil className="size-3.5" aria-hidden="true" />}
                      onClick={() => {
                        setEditing(s);
                        setFormOpen(true);
                      }}
                    >
                      Düzenle
                    </Button>
                    <Button
                      variant="ghost"
                      size="xs"
                      startContent={<Trash2 className="size-3.5" aria-hidden="true" />}
                      onClick={() => setDeleteTarget(s)}
                      className="text-destructive hover:bg-destructive/10"
                    >
                      Sil
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <PestSpeciesForm open={formOpen} onOpenChange={setFormOpen} onSubmit={handleSubmit} editing={editing} />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Türü Sil</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{deleteTarget?.name}&quot; kaydını silmek istediğinize emin misiniz? Bu tür, kullanıldığı ekipman rehberlerinden de kaldırılır.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Vazgeç</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-white hover:bg-destructive/90">
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

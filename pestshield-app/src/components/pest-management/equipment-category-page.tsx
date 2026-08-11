"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { AlertTriangle, Layers, Package, Pencil, Plus, Target, Trash2 } from "lucide-react";
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
import { UNIT_LABELS } from "@/components/inventory/inventory-labels";
import { PestIcon } from "@/components/pest-management/pest-icon";
import { EquipmentGuideForm } from "@/components/pest-management/equipment-guide-form";
import { EQUIPMENT_CATEGORY_LABELS, type EquipmentCategory, type PestIconKey } from "@/lib/mock/pest-management";
import type { Product } from "@/lib/mock/inventory";
import type { EquipmentGuideFormValues } from "@/lib/validations/pest-management";
import type { EquipmentGuideEntryDTO, PestSpeciesEntryDTO } from "@/lib/pest-management/serialize";
import { cn } from "@/lib/utils";

const CATEGORY_DESCRIPTIONS: Record<EquipmentCategory, string> = {
  trap: "Sahada kullanılan tuzak tiplerinin uygulama rehberi ve envanter bağlantısı.",
  bait: "Yem uygulama yöntemleri, hedef türler ve stok durumu.",
  uv: "UV böcek tuzağı sistemlerinin kurulum ve bakım rehberi.",
  pheromone: "Feromon bazlı izleme tuzaklarının kullanım rehberi.",
};

interface EquipmentCategoryPageProps {
  category: EquipmentCategory;
  products: Product[];
}

function getRelatedProducts(guide: EquipmentGuideEntryDTO, products: Product[]): Product[] {
  if (guide.relatedProductKeywords.length === 0) return [];
  return products.filter((p) => guide.relatedProductKeywords.some((needle) => p.name.includes(needle)));
}

export function EquipmentCategoryPage({ category, products }: EquipmentCategoryPageProps) {
  const [guides, setGuides] = useState<EquipmentGuideEntryDTO[]>([]);
  const [species, setSpecies] = useState<PestSpeciesEntryDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<EquipmentGuideEntryDTO | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EquipmentGuideEntryDTO | null>(null);

  function loadGuides() {
    fetch(`/api/pest-management/guides?category=${category}`)
      .then((res) => res.json())
      .then((data) => setGuides(data.guides ?? []))
      .catch(() => toast.error("Rehberler yüklenemedi"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    setLoading(true);
    loadGuides();
    fetch("/api/pest-management/species")
      .then((res) => res.json())
      .then((data) => setSpecies(data.species ?? []))
      .catch(() => toast.error("Zararlı türleri yüklenemedi"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  const speciesById = useMemo(() => new Map(species.map((s) => [s.id, s])), [species]);

  const summary = useMemo(() => {
    const relatedProducts = guides.flatMap((g) => getRelatedProducts(g, products));
    const uniqueProducts = Array.from(new Map(relatedProducts.map((p) => [p.id, p])).values());
    const totalStock = uniqueProducts.reduce((sum, p) => sum + p.currentStock, 0);
    const criticalCount = uniqueProducts.filter((p) => p.currentStock <= p.criticalLevel).length;
    return { totalStock, criticalCount };
  }, [guides, products]);

  async function handleSubmit(values: EquipmentGuideFormValues) {
    const isEditing = !!editing;
    const res = await fetch(isEditing ? `/api/pest-management/guides/${editing!.id}` : "/api/pest-management/guides", {
      method: isEditing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (!res.ok) {
      toast.error(isEditing ? "Rehber güncellenemedi" : "Rehber eklenemedi");
      return;
    }
    toast.success(isEditing ? "Rehber güncellendi" : "Rehber eklendi");
    setFormOpen(false);
    setEditing(null);
    loadGuides();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const res = await fetch(`/api/pest-management/guides/${deleteTarget.id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Rehber silinemedi");
      return;
    }
    toast.success("Rehber silindi");
    setDeleteTarget(null);
    loadGuides();
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
          <h1 className="text-[2rem] leading-tight font-semibold tracking-tight text-foreground">{EQUIPMENT_CATEGORY_LABELS[category]}</h1>
          <p className="max-w-xl text-sm text-muted-foreground">{CATEGORY_DESCRIPTIONS[category]}</p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
          startContent={<Plus className="size-4" aria-hidden="true" />}
        >
          Yeni Rehber Ekle
        </Button>
      </motion.div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <CrmKpiCard label="Uygulama Rehberi" value={guides.length} description="Kataloğunuzdaki rehber sayısı" changePercent={4} icon={Layers} accent="blue" delay={0.05} />
        <CrmKpiCard label="Toplam Stok" value={summary.totalStock} description="Bağlı Envanter ürünlerinin toplam miktarı" changePercent={6} icon={Package} accent="emerald" delay={0.1} />
        <CrmKpiCard label="Kritik Stok" value={summary.criticalCount} description="Kritik seviyenin altındaki ürün" changePercent={summary.criticalCount > 0 ? 12 : -12} icon={AlertTriangle} accent="amber" delay={0.15} />
      </div>

      {!loading && guides.length === 0 ? (
        <EmptyState icon={Target} title="Rehber bulunamadı" description="Bu kategori için henüz uygulama rehberi tanımlanmamış. Yeni Rehber Ekle ile başlayın." />
      ) : (
        <div className="flex flex-col gap-4">
          {guides.map((guide, index) => {
            const relatedProducts = getRelatedProducts(guide, products);
            const targetSpecies = guide.targetSpeciesIds.map((id) => speciesById.get(id)).filter((s): s is PestSpeciesEntryDTO => !!s);
            return (
              <motion.div
                key={guide.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: Math.min(index, 8) * 0.03, ease: [0.16, 1, 0.3, 1] }}
              >
                <Card className={cn(GLASS_CARD, "rounded-2xl")}>
                  <CardContent className="flex flex-col gap-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-semibold text-foreground">{guide.title}</p>
                      <div className="flex shrink-0 items-center gap-1">
                        <Button
                          variant="ghost"
                          size="xs"
                          startContent={<Pencil className="size-3.5" aria-hidden="true" />}
                          onClick={() => {
                            setEditing(guide);
                            setFormOpen(true);
                          }}
                        >
                          Düzenle
                        </Button>
                        <Button
                          variant="ghost"
                          size="xs"
                          startContent={<Trash2 className="size-3.5" aria-hidden="true" />}
                          onClick={() => setDeleteTarget(guide)}
                          className="text-destructive hover:bg-destructive/10"
                        >
                          Sil
                        </Button>
                      </div>
                    </div>

                    <div
                      className="text-sm text-foreground/80 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-0.5 [&_p]:my-1.5"
                      dangerouslySetInnerHTML={{ __html: guide.contentHtml }}
                    />

                    {targetSpecies.length > 0 && (
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold text-muted-foreground uppercase">Hedef Türler:</span>
                        {targetSpecies.map((s) => (
                          <span key={s.id} className="flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-foreground/80">
                            <PestIcon icon={s.icon as PestIconKey} className="size-3.5" />
                            {s.name}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="border-t border-border/60 pt-3">
                      {relatedProducts.length === 0 ? (
                        <p className="text-xs text-muted-foreground">Envanterde henüz bağlı ürün yok.</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {relatedProducts.map((product) => {
                            const isCritical = product.currentStock <= product.criticalLevel;
                            return (
                              <Link
                                key={product.id}
                                href="/dashboard/client/products"
                                className={cn(
                                  "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors hover:bg-muted",
                                  isCritical ? "border-destructive/20 text-destructive" : "border-border text-foreground/80",
                                )}
                              >
                                {product.name}
                                <span className="tabular-nums">
                                  {product.currentStock} {UNIT_LABELS[product.unit]}
                                </span>
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      <EquipmentGuideForm open={formOpen} onOpenChange={setFormOpen} onSubmit={handleSubmit} category={category} species={species} editing={editing} />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rehberi Sil</AlertDialogTitle>
            <AlertDialogDescription>&quot;{deleteTarget?.title}&quot; rehberini silmek istediğinize emin misiniz?</AlertDialogDescription>
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

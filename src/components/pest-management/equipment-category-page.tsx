"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { AlertTriangle, Layers, Package, Target } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { CrmKpiCard } from "@/components/crm/crm-kpi-card";
import { EmptyState } from "@/components/crm/detail/empty-state";
import { GLASS_CARD } from "@/components/dashboard/shared";
import { UNIT_LABELS } from "@/components/inventory/inventory-labels";
import { PestIcon } from "@/components/pest-management/pest-icon";
import {
  EQUIPMENT_CATEGORY_LABELS,
  getEquipmentByCategory,
  getEquipmentCategoryStockSummary,
  getRelatedProducts,
  getSpeciesById,
  type EquipmentCategory,
} from "@/lib/mock/pest-management";
import { cn } from "@/lib/utils";

const CATEGORY_DESCRIPTIONS: Record<EquipmentCategory, string> = {
  trap: "Sahada kullanılan tuzak tiplerinin uygulama rehberi ve envanter bağlantısı.",
  bait: "Yem uygulama yöntemleri, hedef türler ve stok durumu.",
  uv: "UV böcek tuzağı sistemlerinin kurulum ve bakım rehberi.",
  pheromone: "Feromon bazlı izleme tuzaklarının kullanım rehberi.",
};

interface EquipmentCategoryPageProps {
  category: EquipmentCategory;
}

export function EquipmentCategoryPage({ category }: EquipmentCategoryPageProps) {
  const guides = useMemo(() => getEquipmentByCategory(category), [category]);
  const summary = useMemo(() => getEquipmentCategoryStockSummary(category), [category]);

  return (
    <div className="flex flex-col gap-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col gap-1.5"
      >
        <h1 className="text-[2rem] leading-tight font-semibold tracking-tight text-foreground">{EQUIPMENT_CATEGORY_LABELS[category]}</h1>
        <p className="max-w-xl text-sm text-muted-foreground">{CATEGORY_DESCRIPTIONS[category]}</p>
      </motion.div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <CrmKpiCard label="Uygulama Rehberi" value={guides.length} description="Tanımlı kullanım rehberi" changePercent={4} icon={Layers} accent="blue" delay={0.05} />
        <CrmKpiCard label="Toplam Stok" value={summary.totalStock} description="Bağlı Envanter ürünlerinin toplam miktarı" changePercent={6} icon={Package} accent="emerald" delay={0.1} />
        <CrmKpiCard label="Kritik Stok" value={summary.criticalCount} description="Kritik seviyenin altındaki ürün" changePercent={summary.criticalCount > 0 ? 12 : -12} icon={AlertTriangle} accent="amber" delay={0.15} />
      </div>

      {guides.length === 0 ? (
        <EmptyState icon={Target} title="Rehber bulunamadı" description="Bu kategori için henüz uygulama rehberi tanımlanmamış." />
      ) : (
        <div className="flex flex-col gap-4">
          {guides.map((guide, index) => {
            const relatedProducts = getRelatedProducts(guide);
            const targetSpecies = guide.targetSpeciesIds.map((id) => getSpeciesById(id)).filter((s) => !!s);
            return (
              <motion.div
                key={guide.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: Math.min(index, 8) * 0.03, ease: [0.16, 1, 0.3, 1] }}
              >
                <Card className={cn(GLASS_CARD, "rounded-2xl")}>
                  <CardContent className="flex flex-col gap-3.5">
                    <div>
                      <p className="font-semibold text-foreground">{guide.title}</p>
                      <p className="mt-1 text-sm text-foreground/80">{guide.description}</p>
                    </div>

                    <div className="rounded-xl bg-muted/30 p-3 text-xs">
                      <p className="font-semibold text-muted-foreground uppercase">Uygulama Notu</p>
                      <p className="mt-0.5 text-foreground/80">{guide.usageNote}</p>
                    </div>

                    {targetSpecies.length > 0 && (
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold text-muted-foreground uppercase">Hedef Türler:</span>
                        {targetSpecies.map((species) => (
                          <span key={species!.id} className="flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-foreground/80">
                            <PestIcon icon={species!.icon} className="size-3.5" />
                            {species!.name}
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
    </div>
  );
}

"use client";

import { motion } from "framer-motion";
import { Pencil, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GLASS_CARD } from "@/components/dashboard/shared";
import { CategoryBadge, BiosidalBadge, CriticalBadge } from "@/components/inventory/inventory-badges";
import { UNIT_LABELS } from "@/components/inventory/inventory-labels";
import { stockLevelRatio, type Product, type ProductCategory } from "@/lib/mock/inventory";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
  delay?: number;
  onAddStock: (product: Product) => void;
  onEdit: (product: Product) => void;
}

const CATEGORY_GLOW_CLASS: Record<ProductCategory, string> = {
  ilac: "bg-primary",
  malzeme: "bg-amber-500",
  ekipman: "bg-violet-500",
};

const CATEGORY_BORDER_CLASS: Record<ProductCategory, string> = {
  ilac: "before:bg-primary",
  malzeme: "before:bg-amber-500",
  ekipman: "before:bg-violet-500",
};

export function ProductCard({ product, delay = 0, onAddStock, onEdit }: ProductCardProps) {
  const isCritical = product.currentStock <= product.criticalLevel;
  const ratio = stockLevelRatio(product);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      <Card
        className={cn(
          GLASS_CARD,
          "relative h-full overflow-hidden rounded-2xl before:absolute before:inset-x-0 before:top-0 before:h-1",
          CATEGORY_BORDER_CLASS[product.category],
        )}
      >
        <div
          className={cn(
            "pointer-events-none absolute -top-10 -right-10 size-28 rounded-full opacity-[0.1] blur-2xl",
            CATEGORY_GLOW_CLASS[product.category],
          )}
        />
        <CardContent className="relative flex flex-col gap-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate font-semibold leading-tight">{product.name}</p>
              <p className="text-xs text-muted-foreground">{product.manufacturer}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <CategoryBadge category={product.category} />
                {product.type === "biosidal" && <BiosidalBadge />}
              </div>
            </div>
            {isCritical && <CriticalBadge className="shrink-0" />}
          </div>

          <div className="flex items-baseline gap-1.5">
            <span className={cn("text-2xl font-bold tabular-nums", isCritical ? "text-destructive" : "text-foreground")}>
              {product.currentStock}
            </span>
            <span className="text-sm text-muted-foreground">{UNIT_LABELS[product.unit]}</span>
          </div>
          <p className="-mt-2 text-xs text-muted-foreground">
            Kritik: {product.criticalLevel} {UNIT_LABELS[product.unit]}
          </p>

          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${ratio * 100}%` }}
              transition={{ duration: 0.6, delay: delay + 0.1, ease: [0.16, 1, 0.3, 1] }}
              className={cn("h-full rounded-full", isCritical ? "bg-destructive" : "bg-success")}
            />
          </div>

          <div className="mt-1 grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" onClick={() => onEdit(product)}>
              <Pencil className="size-3.5" />
              Düzenle
            </Button>
            <Button variant="outline" size="sm" onClick={() => onAddStock(product)}>
              <Plus className="size-3.5" />
              Stok Ekle
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

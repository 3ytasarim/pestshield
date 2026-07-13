"use client";

import { motion } from "framer-motion";
import { AlertTriangle, MapPin, Phone, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { GLASS_CARD } from "@/components/dashboard/shared";
import { WarehouseTypeBadge } from "@/components/inventory/inventory-badges";
import { UNIT_LABELS } from "@/components/inventory/inventory-labels";
import { getProductsForWarehouse, type Warehouse } from "@/lib/mock/inventory";
import { cn } from "@/lib/utils";

interface WarehouseCardProps {
  warehouse: Warehouse;
  delay?: number;
}

export function WarehouseCard({ warehouse, delay = 0 }: WarehouseCardProps) {
  const items = getProductsForWarehouse(warehouse.id);
  const criticalCount = items.filter((p) => p.currentStock <= p.criticalLevel).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      <Card className={cn(GLASS_CARD, "h-full rounded-2xl")}>
        <CardContent className="flex flex-col gap-3.5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate font-semibold leading-tight">{warehouse.name}</p>
              <p className="text-xs text-muted-foreground">{warehouse.capacityNote}</p>
              <div className="mt-2">
                <WarehouseTypeBadge type={warehouse.type} />
              </div>
            </div>
            {criticalCount > 0 && (
              <span className="flex shrink-0 items-center gap-1 rounded-full border border-destructive/20 bg-destructive/10 px-2 py-1 text-xs font-semibold text-destructive">
                <AlertTriangle className="size-3" />
                {criticalCount} kritik
              </span>
            )}
          </div>

          <div className="flex flex-col gap-1.5 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <MapPin className="size-3.5 shrink-0" />
              <span className="truncate">{warehouse.address}</span>
            </div>
            <div className="flex items-center gap-2">
              <User className="size-3.5 shrink-0" />
              <span className="truncate">{warehouse.manager}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="size-3.5 shrink-0" />
              <span className="truncate">{warehouse.phone}</span>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-border/60 pt-3 text-xs font-medium text-muted-foreground">
            <span>Ürün Çeşidi</span>
            <span className="text-sm font-semibold text-foreground">{items.length}</span>
          </div>

          {items.length > 0 && (
            <ul className="flex flex-col gap-1.5">
              {items.slice(0, 4).map((item) => {
                const isCritical = item.currentStock <= item.criticalLevel;
                return (
                  <li key={item.id} className="flex items-center justify-between gap-2 text-xs">
                    <span className="truncate text-foreground/80">{item.name}</span>
                    <span className={cn("shrink-0 font-medium tabular-nums", isCritical ? "text-destructive" : "text-muted-foreground")}>
                      {item.currentStock} {UNIT_LABELS[item.unit]}
                    </span>
                  </li>
                );
              })}
              {items.length > 4 && (
                <li className="text-xs text-muted-foreground">+{items.length - 4} ürün daha</li>
              )}
            </ul>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

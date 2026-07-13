import { AlertTriangle, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CATEGORY_LABELS, WAREHOUSE_TYPE_LABELS } from "@/components/inventory/inventory-labels";
import type { ProductCategory, WarehouseType } from "@/lib/mock/inventory";

const CATEGORY_STYLES: Record<ProductCategory, string> = {
  ilac: "bg-primary/10 text-primary border-primary/20",
  malzeme: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
  ekipman: "bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-500/20",
};

const WAREHOUSE_TYPE_STYLES: Record<WarehouseType, string> = {
  main: "bg-primary/10 text-primary border-primary/20",
  vehicle: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
  branch: "bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-500/20",
};

export function WarehouseTypeBadge({ type, className }: { type: WarehouseType; className?: string }) {
  return (
    <Badge variant="outline" className={cn("rounded-full font-medium", WAREHOUSE_TYPE_STYLES[type], className)}>
      {WAREHOUSE_TYPE_LABELS[type]}
    </Badge>
  );
}

export function CategoryBadge({ category, className }: { category: ProductCategory; className?: string }) {
  return (
    <Badge variant="outline" className={cn("rounded-full font-medium", CATEGORY_STYLES[category], className)}>
      {CATEGORY_LABELS[category]}
    </Badge>
  );
}

export function BiosidalBadge({ className }: { className?: string }) {
  return (
    <Badge
      variant="outline"
      className={cn("gap-1 rounded-full border-success/20 bg-success/10 font-medium text-success", className)}
    >
      <ShieldCheck className="size-3" />
      Biyosidal
    </Badge>
  );
}

export function CriticalBadge({ className }: { className?: string }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1 rounded-full border-destructive/20 bg-destructive/10 font-semibold text-destructive uppercase",
        className,
      )}
    >
      <AlertTriangle className="size-3" />
      Kritik
    </Badge>
  );
}

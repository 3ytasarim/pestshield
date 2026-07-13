"use client";

import { useMemo } from "react";
import {
  AlertTriangle,
  Check,
  Clock3,
  FileClock,
  FileText,
  PauseCircle,
  Search,
  Sparkles,
  UserCheck,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FILTER_LABELS, matchesFilter, type CustomerFilterKey } from "@/components/crm/crm-filter-logic";
import type { Customer } from "@/lib/mock/crm";

interface CustomerFiltersProps {
  customers: Customer[];
  search: string;
  onSearchChange: (value: string) => void;
  activeFilters: Set<CustomerFilterKey>;
  onToggleFilter: (key: CustomerFilterKey) => void;
}

const FILTER_KEYS = Object.keys(FILTER_LABELS) as CustomerFilterKey[];

const FILTER_ICONS: Record<CustomerFilterKey, LucideIcon> = {
  active: UserCheck,
  passive: PauseCircle,
  contract_expiring: FileClock,
  high_risk: AlertTriangle,
  pending_collection: Wallet,
  recent_service: Clock3,
  pending_offer: FileText,
  potential: Sparkles,
};

export function CustomerFilters({
  customers,
  search,
  onSearchChange,
  activeFilters,
  onToggleFilter,
}: CustomerFiltersProps) {
  const counts = useMemo(() => {
    const result: Partial<Record<CustomerFilterKey, number>> = {};
    for (const key of FILTER_KEYS) {
      result[key] = customers.filter((c) => matchesFilter(c, key)).length;
    }
    return result;
  }, [customers]);

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-card/60 p-3.5 shadow-sm">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Firma, yetkili, telefon, e-posta veya şehir ara…"
          className="h-11 rounded-xl pl-10"
        />
        {search && (
          <Button
            variant="ghost"
            size="icon-sm"
            className="absolute top-1/2 right-1.5 -translate-y-1/2 rounded-lg"
            onClick={() => onSearchChange("")}
          >
            <X className="size-3.5" />
          </Button>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {FILTER_KEYS.map((key) => {
          const isActive = activeFilters.has(key);
          const Icon = FILTER_ICONS[key];
          const count = counts[key] ?? 0;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onToggleFilter(key)}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-150",
                isActive
                  ? "border-primary/20 bg-gradient-to-r from-primary to-primary/85 text-primary-foreground shadow-sm shadow-primary/20"
                  : "border-border/70 bg-background text-muted-foreground hover:border-primary/25 hover:bg-muted/60 hover:text-foreground",
              )}
            >
              {isActive ? <Check className="size-3.5 shrink-0" /> : <Icon className="size-3.5 shrink-0" />}
              {FILTER_LABELS[key]}
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums",
                  isActive ? "bg-white/20" : "bg-muted text-muted-foreground",
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

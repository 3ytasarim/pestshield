"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { AlertTriangle, FlaskConical, Search, ShieldCheck } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CrmKpiCard } from "@/components/crm/crm-kpi-card";
import { EmptyState } from "@/components/crm/detail/empty-state";
import { BiosidalBadge, CriticalBadge } from "@/components/inventory/inventory-badges";
import { UNIT_LABELS } from "@/components/inventory/inventory-labels";
import { products } from "@/lib/mock/inventory";
import { cn } from "@/lib/utils";

export function ChemicalsPage() {
  const [search, setSearch] = useState("");

  const chemicals = useMemo(() => products.filter((p) => p.category === "ilac"), []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return chemicals;
    return chemicals.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.manufacturer.toLowerCase().includes(q) ||
        c.activeIngredient?.toLowerCase().includes(q) ||
        c.targetOrganisms?.toLowerCase().includes(q),
    );
  }, [chemicals, search]);

  const biosidalCount = useMemo(() => chemicals.filter((c) => c.type === "biosidal").length, [chemicals]);
  const criticalCount = useMemo(() => chemicals.filter((c) => c.currentStock <= c.criticalLevel).length, [chemicals]);

  return (
    <div className="flex flex-col gap-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col gap-1.5"
      >
        <h1 className="text-[2rem] leading-tight font-semibold tracking-tight text-foreground">Kimyasallar</h1>
        <p className="max-w-xl text-sm text-muted-foreground">
          Kullanılan biyosidal ürünlerin ruhsat, aktif madde ve hedef organizma bilgisi. Stok verisi Envanter ile canlı senkronizedir.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <CrmKpiCard label="Toplam Kimyasal" value={chemicals.length} description="Envanterde kayıtlı ilaç ürünü" changePercent={5} icon={FlaskConical} accent="blue" delay={0.05} />
        <CrmKpiCard label="Biyosidal Ruhsatlı" value={biosidalCount} description="Ruhsat numarası tanımlı ürün" changePercent={6} icon={ShieldCheck} accent="emerald" delay={0.1} />
        <CrmKpiCard label="Kritik Stok" value={criticalCount} description="Kritik seviyenin altındaki kimyasallar" changePercent={criticalCount > 0 ? 14 : -14} icon={AlertTriangle} accent="amber" delay={0.15} />
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Ürün, üretici, aktif madde veya hedef organizmaya göre ara…" className="h-11 rounded-xl pl-10" />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={FlaskConical} title="Kimyasal bulunamadı" description="Arama kriterine uyan kimyasal yok." />
      ) : (
        <Card className="gap-0 overflow-hidden rounded-2xl border-border/60 py-0 shadow-sm">
          <CardHeader className="flex-row items-center justify-between gap-2 border-b border-border/60 bg-muted/30 px-4 py-3.5">
            <span className="text-sm font-semibold text-foreground">Kimyasal Listesi</span>
            <Link href="/dashboard/client/products" className="text-xs font-medium text-primary hover:underline">
              Envanterde Görüntüle
            </Link>
          </CardHeader>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ürün</TableHead>
                  <TableHead className="hidden sm:table-cell">Üretici</TableHead>
                  <TableHead className="hidden md:table-cell">Ruhsat No</TableHead>
                  <TableHead className="hidden lg:table-cell">Aktif Madde</TableHead>
                  <TableHead className="hidden xl:table-cell">Hedef Organizma</TableHead>
                  <TableHead>Stok</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((chemical) => {
                  const isCritical = chemical.currentStock <= chemical.criticalLevel;
                  return (
                    <TableRow key={chemical.id}>
                      <TableCell className="font-medium">
                        <span className="flex items-center gap-1.5">
                          {chemical.name}
                          {chemical.type === "biosidal" && <BiosidalBadge className="px-1.5 py-0 text-[10px]" />}
                        </span>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">{chemical.manufacturer}</TableCell>
                      <TableCell className="hidden md:table-cell font-mono text-xs">{chemical.licenseNumber ?? "—"}</TableCell>
                      <TableCell className="hidden lg:table-cell">{chemical.activeIngredient ?? "—"}</TableCell>
                      <TableCell className="hidden max-w-[220px] truncate xl:table-cell">{chemical.targetOrganisms ?? "—"}</TableCell>
                      <TableCell>
                        <span className={cn("flex items-center gap-1.5 font-medium tabular-nums", isCritical ? "text-destructive" : "text-foreground")}>
                          {chemical.currentStock} {UNIT_LABELS[chemical.unit]}
                          {isCritical && <CriticalBadge className="px-1.5 py-0 text-[10px]" />}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

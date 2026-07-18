"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { CheckCircle2, FileSpreadsheet, Search, Send } from "lucide-react";
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
import { OfferStatusBadge } from "@/components/crm/crm-badges";
import { formatCurrency, formatDate } from "@/components/crm/crm-format";
import type { Offer, OfferStatus } from "@/lib/mock/crm";
import { cn } from "@/lib/utils";

type StatusFilter = "all" | OfferStatus;

export interface OfferWithCustomer extends Offer {
  customer: { id: string; companyName: string } | null;
}

const STATUS_OPTIONS: { value: OfferStatus; label: string }[] = [
  { value: "draft", label: "Taslak" },
  { value: "sent", label: "Gönderildi" },
  { value: "accepted", label: "Kabul Edildi" },
  { value: "rejected", label: "Reddedildi" },
  { value: "expired", label: "Süresi Doldu" },
];

export function OffersPage({ initialOffers }: { initialOffers: OfferWithCustomer[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const offers = initialOffers;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return offers
      .filter((o) => {
        if (statusFilter !== "all" && o.status !== statusFilter) return false;
        if (q && !o.title.toLowerCase().includes(q) && !o.offerNo.toLowerCase().includes(q) && !o.customer?.companyName.toLowerCase().includes(q)) return false;
        return true;
      })
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }, [offers, search, statusFilter]);

  const totalAmount = useMemo(() => offers.reduce((sum, o) => sum + o.amount, 0), [offers]);
  const acceptedAmount = useMemo(() => offers.filter((o) => o.status === "accepted").reduce((sum, o) => sum + o.amount, 0), [offers]);
  const pendingCount = useMemo(() => offers.filter((o) => o.status === "sent" || o.status === "draft").length, [offers]);

  return (
    <div className="flex flex-col gap-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col gap-1.5"
      >
        <h1 className="text-[2rem] leading-tight font-semibold tracking-tight text-foreground">Teklifler</h1>
        <p className="max-w-xl text-sm text-muted-foreground">Tüm müşterilere gönderilen tekliflerin tek merkezden takibi.</p>
      </motion.div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <CrmKpiCard label="Toplam Teklif Tutarı" value={totalAmount} format={(v) => formatCurrency(v)} description={`${offers.length} teklif kaydı`} changePercent={7} icon={FileSpreadsheet} accent="blue" delay={0.05} />
        <CrmKpiCard label="Kabul Edilen" value={acceptedAmount} format={(v) => formatCurrency(v)} description="Kabul edilen tekliflerin tutarı" changePercent={9} icon={CheckCircle2} accent="emerald" delay={0.1} />
        <CrmKpiCard label="Bekleyen" value={pendingCount} description="Taslak veya gönderilmiş teklif" changePercent={pendingCount > 0 ? 6 : -6} icon={Send} accent="amber" delay={0.15} />
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-card/60 p-3.5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Teklif no, başlık veya müşteri ara…" className="h-11 rounded-xl pl-10" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
              statusFilter === "all" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70",
            )}
          >
            Tümü
          </button>
          {STATUS_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setStatusFilter(option.value)}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                statusFilter === option.value
                  ? "border-primary/20 bg-primary text-primary-foreground"
                  : "border-border bg-background text-muted-foreground hover:bg-muted",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={FileSpreadsheet} title="Teklif bulunamadı" description="Seçili filtrelere uyan teklif yok." />
      ) : (
        <Card className="gap-0 overflow-hidden rounded-2xl border-border/60 py-0 shadow-sm">
          <CardHeader className="flex-row items-center justify-between gap-2 border-b border-border/60 bg-muted/30 px-4 py-3.5">
            <span className="text-sm font-semibold text-foreground">Teklif Listesi</span>
            <span className="text-xs font-medium text-muted-foreground">{filtered.length} kayıt</span>
          </CardHeader>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Teklif No</TableHead>
                  <TableHead>Müşteri</TableHead>
                  <TableHead className="hidden md:table-cell">Başlık</TableHead>
                  <TableHead className="hidden sm:table-cell">Tutar</TableHead>
                  <TableHead className="hidden lg:table-cell">Geçerlilik</TableHead>
                  <TableHead>Durum</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((offer) => (
                  <TableRow key={offer.id}>
                    <TableCell className="font-medium">{offer.offerNo}</TableCell>
                    <TableCell>
                      {offer.customer ? (
                        <Link href={`/dashboard/client/customers/${offer.customer.id}`} className="hover:text-primary hover:underline">
                          {offer.customer.companyName}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{offer.title}</TableCell>
                    <TableCell className="hidden sm:table-cell font-semibold tabular-nums">{formatCurrency(offer.amount, offer.currency)}</TableCell>
                    <TableCell className="hidden lg:table-cell">{formatDate(offer.validUntil)}</TableCell>
                    <TableCell>
                      <OfferStatusBadge status={offer.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, Clock, FileText, Plus, Search } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { CrmKpiCard } from "@/components/crm/crm-kpi-card";
import { EmptyState } from "@/components/crm/detail/empty-state";
import { formatCurrency, formatDate } from "@/components/crm/crm-format";
import { InvoiceStatusBadge } from "@/components/finance/finance-badges";
import { InvoiceForm } from "@/components/finance/invoice-form";
import type { Invoice, InvoiceStatus } from "@/lib/mock/finance";
import type { InvoiceFormValues } from "@/lib/validations/finance";
import { cn } from "@/lib/utils";

type StatusFilter = "all" | InvoiceStatus;

interface InvoiceWithCustomer extends Invoice {
  customer: { id: string; companyName: string } | null;
}

export function InvoicesPage({
  initialInvoices,
  customers,
}: {
  initialInvoices: InvoiceWithCustomer[];
  customers: { id: string; companyName: string }[];
}) {
  const [invoices, setInvoices] = useState<InvoiceWithCustomer[]>(initialInvoices);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [formOpen, setFormOpen] = useState(false);

  const enriched = useMemo(
    () => [...invoices].sort((a, b) => (a.issueDate < b.issueDate ? 1 : -1)),
    [invoices],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return enriched.filter((inv) => {
      if (statusFilter !== "all" && inv.status !== statusFilter) return false;
      if (q && !inv.customer?.companyName.toLowerCase().includes(q) && !inv.invoiceNo.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [enriched, statusFilter, search]);

  const totalAmount = useMemo(() => invoices.reduce((sum, i) => sum + i.amount, 0), [invoices]);
  const paidAmount = useMemo(() => invoices.filter((i) => i.status === "paid").reduce((sum, i) => sum + i.amount, 0), [invoices]);
  const overdueAmount = useMemo(() => invoices.filter((i) => i.status === "overdue").reduce((sum, i) => sum + i.amount, 0), [invoices]);

  function statusCount(status: InvoiceStatus) {
    return invoices.filter((i) => i.status === status).length;
  }

  async function handleCreate(values: InvoiceFormValues) {
    const res = await fetch("/api/finance/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (!res.ok) {
      toast.error("Fatura oluşturulamadı");
      return;
    }
    const { invoice } = (await res.json()) as { invoice: Invoice };
    const customer = customers.find((c) => c.id === values.customerId) ?? null;
    setInvoices((prev) => [{ ...invoice, customer }, ...prev]);
    toast.success(`${customer?.companyName ?? "Müşteri"} için fatura oluşturuldu`);
  }

  return (
    <div className="flex flex-col gap-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex flex-col gap-1.5">
          <h1 className="text-[2rem] leading-tight font-semibold tracking-tight text-foreground">Faturalar</h1>
          <p className="max-w-xl text-sm text-muted-foreground">Müşteri faturalarını oluşturun ve durumlarını takip edin.</p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="size-4" />
          Yeni Fatura
        </Button>
      </motion.div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <CrmKpiCard
          label="Toplam Fatura"
          value={totalAmount}
          format={(v) => formatCurrency(v)}
          description={`${invoices.length} fatura kaydı`}
          changePercent={8}
          icon={FileText}
          accent="blue"
          delay={0.05}
        />
        <CrmKpiCard
          label="Ödenen"
          value={paidAmount}
          format={(v) => formatCurrency(v)}
          description={`${statusCount("paid")} fatura ödendi`}
          changePercent={9}
          icon={CheckCircle2}
          accent="emerald"
          delay={0.1}
        />
        <CrmKpiCard
          label="Geciken"
          value={overdueAmount}
          format={(v) => formatCurrency(v)}
          description={`${statusCount("overdue")} fatura vadesi geçti`}
          changePercent={overdueAmount > 0 ? 15 : -15}
          icon={AlertTriangle}
          accent="amber"
          delay={0.15}
        />
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-card/60 p-3.5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Fatura no veya müşteri ara…"
            className="h-11 rounded-xl pl-10"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(
            [
              { value: "all", label: "Tümü" },
              { value: "paid", label: "Ödendi" },
              { value: "pending", label: "Bekliyor" },
              { value: "overdue", label: "Gecikti" },
            ] as const
          ).map((option) => (
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
        <EmptyState icon={FileText} title="Fatura bulunamadı" description="Seçili filtrelere uyan fatura yok." />
      ) : (
        <Card className="gap-0 overflow-hidden rounded-2xl border-border/60 py-0 shadow-sm">
          <CardHeader className="flex-row items-center justify-between gap-2 border-b border-border/60 bg-muted/30 px-4 py-3.5">
            <span className="text-sm font-semibold text-foreground">Fatura Listesi</span>
            <span className="text-xs font-medium text-muted-foreground">{filtered.length} kayıt</span>
          </CardHeader>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fatura No</TableHead>
                  <TableHead>Müşteri</TableHead>
                  <TableHead className="hidden sm:table-cell">Düzenleme</TableHead>
                  <TableHead className="hidden md:table-cell">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="size-3" />
                      Vade
                    </span>
                  </TableHead>
                  <TableHead>Tutar</TableHead>
                  <TableHead>Durum</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-medium">{inv.invoiceNo}</TableCell>
                    <TableCell>
                      {inv.customer ? (
                        <Link href={`/dashboard/client/customers/${inv.customer.id}`} className="hover:text-primary hover:underline">
                          {inv.customer.companyName}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{formatDate(inv.issueDate)}</TableCell>
                    <TableCell className="hidden md:table-cell">{formatDate(inv.dueDate)}</TableCell>
                    <TableCell className="font-semibold tabular-nums">{formatCurrency(inv.amount)}</TableCell>
                    <TableCell>
                      <InvoiceStatusBadge status={inv.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <InvoiceForm open={formOpen} onOpenChange={setFormOpen} onSubmit={handleCreate} customers={customers} />
    </div>
  );
}

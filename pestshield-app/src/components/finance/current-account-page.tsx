"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  AlertCircle,
  ArrowDownCircle,
  ArrowUpCircle,
  CreditCard,
  Printer,
  Search,
  Users,
  Wallet,
} from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CrmKpiCard } from "@/components/crm/crm-kpi-card";
import { EmptyState } from "@/components/crm/detail/empty-state";
import { GLASS_CARD } from "@/components/dashboard/shared";
import { formatCurrency, formatDate } from "@/components/crm/crm-format";
import { BalanceStatusBadge, PaymentMethodBadge } from "@/components/finance/finance-badges";
import { CollectPaymentForm } from "@/components/finance/collect-payment-form";
import { printCurrentAccountStatement } from "@/components/finance/print-statement";
import type { Customer } from "@/lib/mock/crm";
import type { Invoice } from "@/lib/mock/finance";
import { computeLedger, debtorStatus, type SerializedCollection } from "@/lib/finance/serialize";
import { buildPaymentReminderMessage, getWhatsAppLink } from "@/lib/integrations/whatsapp";
import type { CollectPaymentFormValues } from "@/lib/validations/finance";
import { todayStr } from "@/lib/date-utils";
import { cn } from "@/lib/utils";

type StatusFilter = "all" | "balance" | "overdue" | "zero";
type SortBy = "balance" | "name" | "recent";

const today = todayStr();

const AVATAR_PALETTE = [
  "bg-primary/10 text-primary",
  "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  "bg-amber-500/10 text-amber-600 dark:text-amber-400",
];

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase() || "U";
}

export function CurrentAccountPage({
  initialCustomers,
  initialInvoices,
  initialCollections,
}: {
  initialCustomers: Customer[];
  initialInvoices: Invoice[];
  initialCollections: SerializedCollection[];
}) {
  const customers = initialCustomers;
  const [customerBalances, setCustomerBalances] = useState<Record<string, number>>(() =>
    Object.fromEntries(customers.map((c) => [c.id, c.pendingCollection])),
  );
  const [collections, setCollections] = useState<SerializedCollection[]>(initialCollections);
  const [selectedId, setSelectedId] = useState<string | null>(customers[0]?.id ?? null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortBy, setSortBy] = useState<SortBy>("balance");
  const [collectOpen, setCollectOpen] = useState(false);

  const rows = useMemo(
    () =>
      customers.map((customer) => {
        const balance = customerBalances[customer.id] ?? 0;
        const customerInvoices = initialInvoices.filter((i) => i.customerId === customer.id);
        const customerCollections = collections.filter((c) => c.customerId === customer.id);
        const entries = computeLedger(customerInvoices, customerCollections);
        const lastActivity = entries.sort((a, b) => (a.date < b.date ? 1 : -1))[0]?.date ?? customer.createdAt;
        return {
          customer,
          balance,
          overdue: balance > 0 && debtorStatus(customerInvoices, today).overdue,
          lastActivity,
        };
      }),
    [customers, customerBalances, initialInvoices, collections],
  );

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows
      .filter((r) => {
        if (statusFilter === "balance" && r.balance <= 0) return false;
        if (statusFilter === "overdue" && !r.overdue) return false;
        if (statusFilter === "zero" && r.balance > 0) return false;
        if (q && !r.customer.companyName.toLowerCase().includes(q) && !r.customer.contactName.toLowerCase().includes(q)) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "balance") return b.balance - a.balance;
        if (sortBy === "name") return a.customer.companyName.localeCompare(b.customer.companyName, "tr");
        return a.lastActivity < b.lastActivity ? 1 : -1;
      });
  }, [rows, statusFilter, search, sortBy]);

  const totalReceivable = useMemo(() => rows.reduce((sum, r) => sum + r.balance, 0), [rows]);
  const overdueCount = useMemo(() => rows.filter((r) => r.overdue).length, [rows]);

  const selectedCustomer: Customer | undefined = customers.find((c) => c.id === selectedId);
  const selectedBalance = selectedId ? (customerBalances[selectedId] ?? 0) : 0;

  const mergedEntries = useMemo(() => {
    if (!selectedId) return [];
    const customerInvoices = initialInvoices.filter((i) => i.customerId === selectedId);
    const customerCollections = collections.filter((c) => c.customerId === selectedId);
    return computeLedger(customerInvoices, customerCollections);
  }, [selectedId, initialInvoices, collections]);

  const summary = useMemo(() => {
    const totalDebt = mergedEntries.filter((e) => e.type === "debt").reduce((sum, e) => sum + e.amount, 0);
    const totalCollection = mergedEntries.filter((e) => e.type === "collection").reduce((sum, e) => sum + e.amount, 0);
    return { totalDebt, totalCollection };
  }, [mergedEntries]);

  const selectedDebtor = useMemo(
    () => debtorStatus(initialInvoices.filter((i) => i.customerId === selectedId), today),
    [selectedId, initialInvoices],
  );

  async function handleCollectPayment(values: CollectPaymentFormValues) {
    const res = await fetch("/api/finance/collections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (!res.ok) {
      toast.error("Tahsilat kaydedilemedi");
      return;
    }
    const { collection } = (await res.json()) as { collection: SerializedCollection };
    setCustomerBalances((prev) => ({
      ...prev,
      [values.customerId]: Math.max(0, (prev[values.customerId] ?? 0) - values.amount),
    }));
    setCollections((prev) => [collection, ...prev]);
    toast.success("Tahsilat kaydedildi");
  }

  return (
    <div className="flex flex-col gap-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col gap-1.5"
      >
        <h1 className="text-[2rem] leading-tight font-semibold tracking-tight text-foreground">Cari Hesap</h1>
        <p className="max-w-xl text-sm text-muted-foreground">Müşteri bazında borç, tahsilat ve bakiye takibi.</p>
      </motion.div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <CrmKpiCard
          label="Toplam Alacak"
          value={totalReceivable}
          format={(v) => formatCurrency(v)}
          description="Tüm müşterilerin açık bakiyesi"
          changePercent={totalReceivable > 0 ? 8 : -8}
          icon={Wallet}
          accent="blue"
          delay={0.05}
        />
        <CrmKpiCard
          label="Vadesi Geçen"
          value={overdueCount}
          description="Vadesi geçmiş müşteri sayısı"
          changePercent={overdueCount > 0 ? 14 : -14}
          icon={AlertCircle}
          accent="amber"
          delay={0.1}
        />
        <CrmKpiCard
          label="Cari Müşteri"
          value={customers.length}
          description="Cari hesabı bulunan müşteri"
          changePercent={4}
          icon={Users}
          accent="emerald"
          delay={0.15}
        />
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-[360px_1fr]">
        {/* Sol: Müşteri listesi */}
        <Card className={cn(GLASS_CARD, "flex min-w-0 flex-col gap-0 rounded-2xl p-0")}>
          <div className="flex flex-col gap-3 border-b border-border/60 p-3.5">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Müşteri veya firma ara…"
                className="h-10 rounded-xl pl-9"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  { value: "all", label: "Tümü" },
                  { value: "balance", label: "Bakiyeli" },
                  { value: "overdue", label: "Vadesi Geçen" },
                  { value: "zero", label: "Sıfır" },
                ] as const
              ).map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setStatusFilter(option.value)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                    statusFilter === option.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/70",
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <div className="flex gap-1.5 text-xs">
              {(
                [
                  { value: "balance", label: "Bakiye" },
                  { value: "name", label: "Müşteri" },
                  { value: "recent", label: "Son" },
                ] as const
              ).map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setSortBy(option.value)}
                  className={cn(
                    "rounded-lg px-2.5 py-1 font-medium transition-colors",
                    sortBy === option.value ? "bg-foreground/5 text-foreground" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex max-h-[560px] flex-col overflow-y-auto lg:max-h-[calc(100vh-22rem)]">
            {filteredRows.length === 0 ? (
              <p className="p-6 text-center text-sm text-muted-foreground">Sonuç bulunamadı.</p>
            ) : (
              filteredRows.map((row, index) => {
                const isSelected = row.customer.id === selectedId;
                return (
                  <button
                    key={row.customer.id}
                    type="button"
                    onClick={() => setSelectedId(row.customer.id)}
                    className={cn(
                      "flex items-center gap-3 border-l-2 px-3.5 py-3 text-left transition-colors",
                      isSelected ? "border-l-primary bg-primary/[0.06]" : "border-l-transparent hover:bg-muted/40",
                    )}
                  >
                    <div
                      className={cn(
                        "flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                        AVATAR_PALETTE[index % AVATAR_PALETTE.length],
                      )}
                    >
                      {initialsOf(row.customer.companyName)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{row.customer.companyName}</p>
                      <p className="truncate text-xs text-muted-foreground">{row.customer.contactName}</p>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 text-sm font-semibold tabular-nums",
                        row.balance > 0 ? "text-destructive" : "text-muted-foreground",
                      )}
                    >
                      {row.balance > 0 ? formatCurrency(row.balance) : "—"}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </Card>

        {/* Sağ: Seçili müşteri cari hesap detayı */}
        <div className="flex min-w-0 flex-col gap-4">
          {!selectedCustomer ? (
            <EmptyState icon={Wallet} title="Müşteri seçin" description="Detayları görmek için soldaki listeden bir müşteri seçin." />
          ) : (
            <>
              <Card className={cn(GLASS_CARD, "rounded-2xl")}>
                <CardContent className="flex flex-col gap-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-semibold text-foreground">{selectedCustomer.companyName}</h2>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                          {selectedCustomer.customerType}
                        </span>
                        {selectedBalance > 0 && selectedDebtor.overdue && (
                          <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-semibold text-destructive">
                            {selectedDebtor.days} gün gecikti
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="text-right">
                        <p className={cn("text-2xl font-bold tabular-nums", selectedBalance > 0 ? "text-destructive" : "text-success")}>
                          {formatCurrency(selectedBalance)}
                        </p>
                        <BalanceStatusBadge balance={selectedBalance} />
                      </div>
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button
                          size="sm"
                          disabled={selectedBalance <= 0}
                          onClick={() => setCollectOpen(true)}
                        >
                          <CreditCard className="size-3.5" />
                          Tahsilat Al
                        </Button>
                        {selectedBalance > 0 && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-success/30 text-success hover:bg-success/10"
                            onClick={() =>
                              window.open(
                                getWhatsAppLink(
                                  selectedCustomer.contactPhone,
                                  buildPaymentReminderMessage({
                                    contactName: selectedCustomer.contactName,
                                    companyName: selectedCustomer.companyName,
                                    amount: formatCurrency(selectedBalance),
                                    overdueDays: selectedDebtor.overdue ? selectedDebtor.days : undefined,
                                  }),
                                ),
                                "_blank",
                              )
                            }
                          >
                            <WhatsAppIcon className="size-3.5" />
                            WhatsApp
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => printCurrentAccountStatement(selectedCustomer, mergedEntries, selectedBalance)}
                        >
                          <Printer className="size-3.5" />
                          Yazdır / PDF
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Card className={GLASS_CARD}>
                  <CardContent className="flex flex-col gap-2">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                      <ArrowUpCircle className="size-4.5" />
                    </div>
                    <div>
                      <p className="text-lg font-bold tabular-nums">{formatCurrency(summary.totalDebt)}</p>
                      <p className="text-xs text-muted-foreground">Toplam Borç</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className={GLASS_CARD}>
                  <CardContent className="flex flex-col gap-2">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-success/10 text-success">
                      <ArrowDownCircle className="size-4.5" />
                    </div>
                    <div>
                      <p className="text-lg font-bold tabular-nums">{formatCurrency(summary.totalCollection)}</p>
                      <p className="text-xs text-muted-foreground">Tahsilat</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className={GLASS_CARD}>
                  <CardContent className="flex flex-col gap-2">
                    <div
                      className={cn(
                        "flex size-9 items-center justify-center rounded-xl",
                        selectedBalance > 0 ? "bg-destructive/10 text-destructive" : "bg-success/10 text-success",
                      )}
                    >
                      <Wallet className="size-4.5" />
                    </div>
                    <div>
                      <p className="text-lg font-bold tabular-nums">{formatCurrency(selectedBalance)}</p>
                      <p className="text-xs text-muted-foreground">{selectedBalance > 0 ? "Borçlu" : "Bakiye"}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className={cn(GLASS_CARD, "gap-0 divide-y divide-border/60 rounded-2xl p-0")}>
                {mergedEntries.length === 0 ? (
                  <div className="p-6">
                    <EmptyState icon={Wallet} title="Hareket yok" description="Bu müşteride cari hesap hareketi bulunmuyor." />
                  </div>
                ) : (
                  [...mergedEntries].reverse().map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between gap-4 px-4 py-3.5">
                      <div className="flex min-w-0 items-start gap-3">
                        <span
                          className={cn(
                            "mt-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase",
                            entry.type === "debt"
                              ? "bg-destructive/10 text-destructive"
                              : "bg-success/10 text-success",
                          )}
                        >
                          {entry.type === "debt" ? "Borç" : "Tahsilat"}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm text-foreground">{entry.description}</p>
                          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            {formatDate(entry.date)}
                            {entry.method && <PaymentMethodBadge method={entry.method} className="px-1.5 py-0 text-[10px]" />}
                          </p>
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <p
                          className={cn(
                            "text-sm font-semibold tabular-nums",
                            entry.type === "debt" ? "text-destructive" : "text-success",
                          )}
                        >
                          {entry.type === "debt" ? "+" : "-"}
                          {formatCurrency(entry.amount)}
                        </p>
                        <p className="text-xs text-muted-foreground tabular-nums">{formatCurrency(entry.balanceAfter)}</p>
                      </div>
                    </div>
                  ))
                )}
              </Card>
            </>
          )}
        </div>
      </div>

      <CollectPaymentForm
        open={collectOpen}
        onOpenChange={setCollectOpen}
        customer={selectedCustomer ?? null}
        currentBalance={selectedBalance}
        onSubmit={handleCollectPayment}
      />
    </div>
  );
}

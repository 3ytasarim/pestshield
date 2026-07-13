"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import Link from "next/link";
import {
  AlertOctagon,
  CalendarClock,
  CreditCard,
  Mail,
  Phone,
  PhoneCall,
  TrendingDown,
} from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CrmKpiCard } from "@/components/crm/crm-kpi-card";
import { EmptyState } from "@/components/crm/detail/empty-state";
import { GLASS_CARD } from "@/components/dashboard/shared";
import { formatCurrency, formatDate } from "@/components/crm/crm-format";
import { CollectPaymentForm } from "@/components/finance/collect-payment-form";
import { customers, getCustomerById, type Customer } from "@/lib/mock/crm";
import { getCustomerBalance, invoices, isOverdue, overdueDays } from "@/lib/mock/finance";
import { buildPaymentReminderMessage, getWhatsAppLink } from "@/lib/integrations/whatsapp";
import { buildPaymentReminderEmail, getMailtoLink, getTelLink } from "@/lib/contact-actions";
import type { CollectPaymentFormValues } from "@/lib/validations/finance";
import { cn } from "@/lib/utils";

function sendPaymentReminderWhatsApp(customer: Customer, balance: number, overdueDaysCount: number) {
  const message = buildPaymentReminderMessage({
    contactName: customer.contactName,
    companyName: customer.companyName,
    amount: formatCurrency(balance),
    overdueDays: overdueDaysCount,
  });
  window.open(getWhatsAppLink(customer.contactPhone, message), "_blank");
}

function sendPaymentReminderEmail(customer: Customer, balance: number, overdueDaysCount: number) {
  const { subject, body } = buildPaymentReminderEmail({
    contactName: customer.contactName,
    companyName: customer.companyName,
    amount: formatCurrency(balance),
    overdueDays: overdueDaysCount,
  });
  window.open(getMailtoLink(customer.invoiceEmail || customer.contactEmail, subject, body), "_blank");
}

function openInvoiceDueDate(customerId: string): string | null {
  return invoices.find((i) => i.customerId === customerId && i.status !== "paid")?.dueDate ?? null;
}

export function PaymentTrackingPage() {
  const [customerBalances, setCustomerBalances] = useState<Record<string, number>>(() =>
    Object.fromEntries(customers.map((c) => [c.id, getCustomerBalance(c.id)])),
  );
  const [collectTarget, setCollectTarget] = useState<Customer | null>(null);
  const [collectOpen, setCollectOpen] = useState(false);

  const debtors = useMemo(
    () =>
      customers
        .filter((c) => (customerBalances[c.id] ?? 0) > 0)
        .map((c) => ({
          customer: c,
          balance: customerBalances[c.id] ?? 0,
          overdue: isOverdue(c.id),
          days: overdueDays(c.id),
          dueDate: openInvoiceDueDate(c.id),
        })),
    [customerBalances],
  );

  const overdueRows = useMemo(
    () => debtors.filter((d) => d.overdue).sort((a, b) => b.days - a.days),
    [debtors],
  );
  const upcomingRows = useMemo(
    () =>
      debtors
        .filter((d) => !d.overdue)
        .sort((a, b) => (a.dueDate && b.dueDate ? (a.dueDate < b.dueDate ? -1 : 1) : 0)),
    [debtors],
  );

  const totalOverdueAmount = useMemo(() => overdueRows.reduce((sum, d) => sum + d.balance, 0), [overdueRows]);
  const averageOverdueDays = useMemo(() => {
    if (overdueRows.length === 0) return 0;
    return Math.round(overdueRows.reduce((sum, d) => sum + d.days, 0) / overdueRows.length);
  }, [overdueRows]);

  function handleCollectPayment(values: CollectPaymentFormValues) {
    setCustomerBalances((prev) => ({
      ...prev,
      [values.customerId]: Math.max(0, (prev[values.customerId] ?? 0) - values.amount),
    }));
    toast.success(`${getCustomerById(values.customerId)?.companyName ?? "Müşteri"} için tahsilat kaydedildi`);
  }

  return (
    <div className="flex flex-col gap-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col gap-1.5"
      >
        <h1 className="text-[2rem] leading-tight font-semibold tracking-tight text-foreground">Ödeme Takibi</h1>
        <p className="max-w-xl text-sm text-muted-foreground">
          Vadesi geçen ve yaklaşan tahsilatlar, en acil olandan başlayarak sıralanır.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <CrmKpiCard
          label="Vadesi Geçen"
          value={overdueRows.length}
          description="Gecikmiş müşteri sayısı"
          changePercent={overdueRows.length > 0 ? 14 : -14}
          icon={AlertOctagon}
          accent="amber"
          delay={0.05}
        />
        <CrmKpiCard
          label="Gecikmiş Tutar"
          value={totalOverdueAmount}
          format={(v) => formatCurrency(v)}
          description="Vadesi geçmiş toplam bakiye"
          changePercent={totalOverdueAmount > 0 ? 18 : -18}
          icon={TrendingDown}
          accent="blue"
          delay={0.1}
        />
        <CrmKpiCard
          label="Ortalama Gecikme (Gün)"
          value={averageOverdueDays}
          description="Gecikmiş müşterilerin ortalaması"
          changePercent={averageOverdueDays > 0 ? 10 : -10}
          icon={CalendarClock}
          accent="emerald"
          delay={0.15}
        />
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">Vadesi Geçenler</h2>
        {overdueRows.length === 0 ? (
          <EmptyState icon={AlertOctagon} title="Vadesi geçen yok" description="Şu anda vadesi geçmiş hiçbir tahsilat bulunmuyor." />
        ) : (
          <div className="flex flex-col gap-2.5">
            {overdueRows.map((row, index) => (
              <motion.div
                key={row.customer.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: Math.min(index, 8) * 0.03, ease: [0.16, 1, 0.3, 1] }}
              >
                <Card className={cn(GLASS_CARD, "rounded-2xl border-l-4 border-l-destructive")}>
                  <CardContent className="flex flex-wrap items-center justify-between gap-3 py-3.5">
                    <div className="min-w-0">
                      <Link
                        href={`/dashboard/client/customers/${row.customer.id}`}
                        className="truncate font-semibold text-foreground hover:text-primary hover:underline"
                      >
                        {row.customer.companyName}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {row.customer.contactName} · Vade: {formatDate(row.dueDate)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-semibold text-destructive">
                        {row.days} gün gecikti
                      </span>
                      <span className="text-lg font-bold tabular-nums text-destructive">{formatCurrency(row.balance)}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-success/30 text-success hover:bg-success/10"
                        onClick={() => sendPaymentReminderWhatsApp(row.customer, row.balance, row.days)}
                      >
                        <WhatsAppIcon className="size-3.5" />
                        WhatsApp
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          setCollectTarget(row.customer);
                          setCollectOpen(true);
                        }}
                      >
                        <CreditCard className="size-3.5" />
                        Tahsilat Al
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">Vadesi Yaklaşanlar</h2>
        {upcomingRows.length === 0 ? (
          <EmptyState icon={CalendarClock} title="Yaklaşan ödeme yok" description="Vadesi henüz gelmemiş açık bakiye bulunmuyor." />
        ) : (
          <div className="flex flex-col gap-2.5">
            {upcomingRows.map((row, index) => (
              <motion.div
                key={row.customer.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: Math.min(index, 8) * 0.03, ease: [0.16, 1, 0.3, 1] }}
              >
                <Card className={cn(GLASS_CARD, "rounded-2xl border-l-4 border-l-amber-500")}>
                  <CardContent className="flex flex-wrap items-center justify-between gap-3 py-3.5">
                    <div className="min-w-0">
                      <Link
                        href={`/dashboard/client/customers/${row.customer.id}`}
                        className="truncate font-semibold text-foreground hover:text-primary hover:underline"
                      >
                        {row.customer.companyName}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {row.customer.contactName} · Vade: {formatDate(row.dueDate)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold tabular-nums text-foreground">{formatCurrency(row.balance)}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-success/30 text-success hover:bg-success/10"
                        onClick={() => sendPaymentReminderWhatsApp(row.customer, row.balance, 0)}
                      >
                        <WhatsAppIcon className="size-3.5" />
                        WhatsApp
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setCollectTarget(row.customer);
                          setCollectOpen(true);
                        }}
                      >
                        <CreditCard className="size-3.5" />
                        Tahsilat Al
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">Aranacaklar</h2>
          <p className="text-xs text-muted-foreground">
            Bakiyesi bulunan tüm müşteri/firmalar — tek tabloda arama listesi.
          </p>
        </div>
        {debtors.length === 0 ? (
          <EmptyState icon={PhoneCall} title="Aranacak kimse yok" description="Şu anda bakiyesi olan müşteri bulunmuyor." />
        ) : (
          <Card className={cn(GLASS_CARD, "gap-0 rounded-2xl p-0")}>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Müşteri / Firma</TableHead>
                    <TableHead className="hidden sm:table-cell">Yetkili</TableHead>
                    <TableHead className="hidden md:table-cell">Telefon</TableHead>
                    <TableHead>Bakiye</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead className="text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {debtors
                    .slice()
                    .sort((a, b) => b.balance - a.balance)
                    .map((row) => (
                      <TableRow key={row.customer.id}>
                        <TableCell className="font-medium">
                          <Link
                            href={`/dashboard/client/customers/${row.customer.id}`}
                            className="hover:text-primary hover:underline"
                          >
                            {row.customer.companyName}
                          </Link>
                        </TableCell>
                        <TableCell className="hidden text-muted-foreground sm:table-cell">{row.customer.contactName}</TableCell>
                        <TableCell className="hidden text-muted-foreground md:table-cell">{row.customer.contactPhone}</TableCell>
                        <TableCell className="font-semibold tabular-nums">{formatCurrency(row.balance)}</TableCell>
                        <TableCell>
                          {row.overdue ? (
                            <span className="rounded-full bg-destructive/10 px-2.5 py-0.5 text-[11px] font-semibold text-destructive">
                              {row.days} gün gecikti
                            </span>
                          ) : (
                            <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                              Vade: {formatDate(row.dueDate)}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="icon-sm"
                              variant="outline"
                              className="border-success/30 text-success hover:bg-success/10"
                              aria-label="WhatsApp ile gönder"
                              onClick={() => sendPaymentReminderWhatsApp(row.customer, row.balance, row.days)}
                            >
                              <WhatsAppIcon className="size-3.5" />
                            </Button>
                            <Button
                              size="icon-sm"
                              variant="outline"
                              aria-label="Ara"
                              nativeButton={false}
                              render={<a href={getTelLink(row.customer.contactPhone)} />}
                            >
                              <Phone className="size-3.5" />
                            </Button>
                            <Button
                              size="icon-sm"
                              variant="outline"
                              aria-label="E-Posta Hatırlatma"
                              onClick={() => sendPaymentReminderEmail(row.customer, row.balance, row.days)}
                            >
                              <Mail className="size-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}
      </div>

      <CollectPaymentForm
        open={collectOpen}
        onOpenChange={setCollectOpen}
        customer={collectTarget}
        currentBalance={collectTarget ? (customerBalances[collectTarget.id] ?? 0) : 0}
        onSubmit={handleCollectPayment}
      />
    </div>
  );
}

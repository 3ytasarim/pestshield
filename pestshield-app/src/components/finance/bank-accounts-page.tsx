"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { ArrowDownLeft, ArrowUpRight, Plus, Wallet } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CrmKpiCard } from "@/components/crm/crm-kpi-card";
import { formatCurrency, formatDate } from "@/components/crm/crm-format";
import { BankAccountCard } from "@/components/finance/bank-account-card";
import { BankAccountForm } from "@/components/finance/bank-account-form";
import type { BankAccount, BankTransaction } from "@/lib/mock/finance";
import type { BankAccountFormValues } from "@/lib/validations/finance";
import { cn } from "@/lib/utils";

export function BankAccountsPage({
  initialAccounts,
  initialTransactions,
}: {
  initialAccounts: BankAccount[];
  initialTransactions: BankTransaction[];
}) {
  const [accounts, setAccounts] = useState<BankAccount[]>(initialAccounts);
  const bankTransactions = initialTransactions;
  const [formOpen, setFormOpen] = useState(false);

  const totalBalance = useMemo(() => accounts.reduce((sum, a) => sum + a.balance, 0), [accounts]);

  const thisMonthInflow = useMemo(() => {
    const now = new Date();
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    return bankTransactions.filter((t) => t.type === "in" && t.date.startsWith(ym)).reduce((sum, t) => sum + t.amount, 0);
  }, [bankTransactions]);

  const thisMonthOutflow = useMemo(() => {
    const now = new Date();
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    return bankTransactions.filter((t) => t.type === "out" && t.date.startsWith(ym)).reduce((sum, t) => sum + t.amount, 0);
  }, [bankTransactions]);

  const recentTransactions = useMemo(() => bankTransactions.slice(0, 10), [bankTransactions]);

  async function handleCreate(values: BankAccountFormValues) {
    const res = await fetch("/api/finance/bank-accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (!res.ok) {
      toast.error("Banka hesabı eklenemedi");
      return;
    }
    const { bankAccount } = (await res.json()) as { bankAccount: BankAccount };
    setAccounts((prev) => [...prev, bankAccount]);
    toast.success("Banka hesabı eklendi");
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
          <h1 className="text-[2rem] leading-tight font-semibold tracking-tight text-foreground">Banka</h1>
          <p className="max-w-xl text-sm text-muted-foreground">Şirket banka hesaplarını ve hareketlerini görüntüleyin.</p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="size-4" />
          Yeni Hesap Ekle
        </Button>
      </motion.div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <CrmKpiCard
          label="Toplam Bakiye"
          value={totalBalance}
          format={(v) => formatCurrency(v)}
          description={`${accounts.length} banka hesabı`}
          changePercent={6}
          icon={Wallet}
          accent="blue"
          delay={0.05}
        />
        <CrmKpiCard
          label="Bu Ay Giriş"
          value={thisMonthInflow}
          format={(v) => formatCurrency(v)}
          description="Bu ay hesaplara giren tutar"
          changePercent={9}
          icon={ArrowDownLeft}
          accent="emerald"
          delay={0.1}
        />
        <CrmKpiCard
          label="Bu Ay Çıkış"
          value={thisMonthOutflow}
          format={(v) => formatCurrency(v)}
          description="Bu ay hesaplardan çıkan tutar"
          changePercent={-5}
          icon={ArrowUpRight}
          accent="amber"
          delay={0.15}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {accounts.map((account, index) => (
          <BankAccountCard
            key={account.id}
            account={account}
            transactions={bankTransactions.filter((t) => t.bankAccountId === account.id).slice(0, 3)}
            delay={Math.min(index, 9) * 0.04}
          />
        ))}
      </div>

      <Card className="gap-0 overflow-hidden rounded-2xl border-border/60 py-0 shadow-sm">
        <CardHeader className="flex-row items-center justify-between gap-2 border-b border-border/60 bg-muted/30 px-4 py-3.5">
          <span className="text-sm font-semibold text-foreground">Son Hareketler</span>
          <span className="text-xs font-medium text-muted-foreground">{recentTransactions.length} kayıt</span>
        </CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tarih</TableHead>
                <TableHead>Hesap</TableHead>
                <TableHead className="hidden lg:table-cell">Açıklama</TableHead>
                <TableHead>Tutar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentTransactions.map((tx) => {
                const account = accounts.find((a) => a.id === tx.bankAccountId);
                return (
                  <TableRow key={tx.id}>
                    <TableCell>{formatDate(tx.date)}</TableCell>
                    <TableCell className="font-medium">{account?.bankName ?? "—"}</TableCell>
                    <TableCell className="hidden max-w-[260px] truncate text-xs text-muted-foreground lg:table-cell">
                      {tx.description}
                    </TableCell>
                    <TableCell className={cn("font-semibold tabular-nums", tx.type === "in" ? "text-success" : "text-destructive")}>
                      {tx.type === "in" ? "+" : "-"}
                      {formatCurrency(tx.amount)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <BankAccountForm open={formOpen} onOpenChange={setFormOpen} onSubmit={handleCreate} />
    </div>
  );
}

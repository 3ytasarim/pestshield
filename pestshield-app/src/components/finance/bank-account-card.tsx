"use client";

import { motion } from "framer-motion";
import { ArrowDownLeft, ArrowUpRight, Landmark } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { GLASS_CARD } from "@/components/dashboard/shared";
import { formatCurrency } from "@/components/crm/crm-format";
import type { BankAccount, BankTransaction } from "@/lib/mock/finance";
import { cn } from "@/lib/utils";

interface BankAccountCardProps {
  account: BankAccount;
  transactions: BankTransaction[];
  delay?: number;
}

export function BankAccountCard({ account, transactions, delay = 0 }: BankAccountCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      <Card className={cn(GLASS_CARD, "h-full rounded-2xl")}>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Landmark className="size-5" />
              </div>
              <div className="min-w-0">
                <p className="truncate font-semibold leading-tight">{account.bankName}</p>
                <p className="text-xs text-muted-foreground">{account.accountName}</p>
              </div>
            </div>
          </div>

          <p className="font-mono text-xs tracking-wide text-muted-foreground">{account.iban}</p>

          <div>
            <p className="text-2xl font-bold tabular-nums text-foreground">{formatCurrency(account.balance, account.currency)}</p>
            <p className="text-xs text-muted-foreground">Güncel Bakiye</p>
          </div>

          {transactions.length > 0 && (
            <ul className="flex flex-col gap-2 border-t border-border/60 pt-3">
              {transactions.map((tx) => (
                <li key={tx.id} className="flex items-center justify-between gap-2 text-xs">
                  <span className="flex min-w-0 items-center gap-1.5">
                    {tx.type === "in" ? (
                      <ArrowDownLeft className="size-3.5 shrink-0 text-success" />
                    ) : (
                      <ArrowUpRight className="size-3.5 shrink-0 text-destructive" />
                    )}
                    <span className="truncate text-foreground/80">{tx.description}</span>
                  </span>
                  <span className={cn("shrink-0 font-medium tabular-nums", tx.type === "in" ? "text-success" : "text-destructive")}>
                    {tx.type === "in" ? "+" : "-"}
                    {formatCurrency(tx.amount, account.currency)}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {transactions.length === 0 && <p className="text-xs text-muted-foreground">Henüz hareket yok.</p>}
        </CardContent>
      </Card>
    </motion.div>
  );
}

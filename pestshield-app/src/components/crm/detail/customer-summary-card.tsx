"use client";

import { motion } from "framer-motion";
import { Building2, Calendar, CalendarCheck, ShieldCheck, Wallet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { GLASS_CARD } from "@/components/dashboard/shared";
import { CustomerStatusBadge, RiskBadge, CustomerTypeBadge, PotentialBadge } from "@/components/crm/crm-badges";
import { formatCurrency, formatDate } from "@/components/crm/crm-format";
import type { Customer } from "@/lib/mock/crm";

function scoreTone(score: number) {
  if (score >= 80) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 50) return "text-amber-600 dark:text-amber-400";
  return "text-destructive";
}

export function CustomerSummaryCard({ customer }: { customer: Customer }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <Card className={GLASS_CARD}>
        <CardContent className="flex flex-col gap-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <Building2 className="size-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-semibold tracking-tight">{customer.companyName}</h1>
                <p className="text-sm text-muted-foreground">
                  {customer.sector} · {customer.city}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <CustomerTypeBadge type={customer.customerType} />
              {customer.isPotential && <PotentialBadge />}
              <CustomerStatusBadge status={customer.status} />
              <RiskBadge level={customer.riskLevel} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
            <div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <ShieldCheck className="size-3.5" />
                Risk Skoru
              </div>
              <p className={`text-lg font-bold tabular-nums ${scoreTone(100 - customer.riskScore)}`}>
                {customer.riskScore}
              </p>
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <ShieldCheck className="size-3.5" />
                Denetim Hazırlığı
              </div>
              <p className={`text-lg font-bold tabular-nums ${scoreTone(customer.auditReadinessScore)}`}>
                {customer.auditReadinessScore}
              </p>
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <CalendarCheck className="size-3.5" />
                Son Servis
              </div>
              <p className="text-sm font-semibold">{formatDate(customer.lastServiceDate)}</p>
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Calendar className="size-3.5" />
                Sonraki Servis
              </div>
              <p className="text-sm font-semibold">{formatDate(customer.nextServiceDate)}</p>
            </div>
            <div className="col-span-2">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Wallet className="size-3.5" />
                Bekleyen Tahsilat
              </div>
              <p
                className={`text-sm font-semibold tabular-nums ${
                  customer.pendingCollection > 0 ? "text-destructive" : ""
                }`}
              >
                {formatCurrency(customer.pendingCollection)}
              </p>
            </div>
            <div className="col-span-2">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Calendar className="size-3.5" />
                Sözleşme Bitiş Tarihi
              </div>
              <p className="text-sm font-semibold">{formatDate(customer.contractEndDate)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

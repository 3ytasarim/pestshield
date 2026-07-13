import { AlertCircle, ArrowDownCircle, ArrowUpCircle, CalendarCheck, Wallet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { GLASS_CARD } from "@/components/dashboard/shared";
import { cn } from "@/lib/utils";
import { formatCurrency, formatDate } from "@/components/crm/crm-format";

interface CurrentAccountSummaryProps {
  totalDebit: number;
  totalCredit: number;
  pendingCollection: number;
  overdueAmount: number;
  lastPaymentDate: string | null;
}

export function CurrentAccountSummary({
  totalDebit,
  totalCredit,
  pendingCollection,
  overdueAmount,
  lastPaymentDate,
}: CurrentAccountSummaryProps) {
  const items = [
    { label: "Toplam Borç", value: formatCurrency(totalDebit), icon: ArrowUpCircle, accent: "bg-primary/10 text-primary" },
    {
      label: "Toplam Alacak",
      value: formatCurrency(totalCredit),
      icon: ArrowDownCircle,
      accent: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    },
    {
      label: "Bekleyen Tahsilat",
      value: formatCurrency(pendingCollection),
      icon: Wallet,
      accent: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    },
    {
      label: "Vadesi Geçen Tutar",
      value: formatCurrency(overdueAmount),
      icon: AlertCircle,
      accent: "bg-destructive/10 text-destructive",
    },
    {
      label: "Son Ödeme",
      value: formatDate(lastPaymentDate),
      icon: CalendarCheck,
      accent: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {items.map((item) => (
        <Card key={item.label} className={GLASS_CARD}>
          <CardContent className="flex flex-col gap-2">
            <div className={cn("flex size-9 items-center justify-center rounded-xl", item.accent)}>
              <item.icon className="size-4.5" />
            </div>
            <div>
              <p className="text-lg font-bold tabular-nums">{item.value}</p>
              <p className="text-xs text-muted-foreground">{item.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

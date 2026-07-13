import { AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { INVOICE_STATUS_LABELS, PAYMENT_METHOD_LABELS } from "@/components/finance/finance-labels";
import type { InvoiceStatus, PaymentMethod } from "@/lib/mock/finance";

export function BalanceStatusBadge({ balance, className }: { balance: number; className?: string }) {
  if (balance <= 0) {
    return (
      <Badge
        variant="outline"
        className={cn("gap-1 rounded-full border-success/20 bg-success/10 font-semibold text-success uppercase", className)}
      >
        <CheckCircle2 className="size-3" />
        Ödendi
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className={cn("gap-1 rounded-full border-destructive/20 bg-destructive/10 font-semibold text-destructive uppercase", className)}
    >
      <AlertTriangle className="size-3" />
      Borçlu
    </Badge>
  );
}

const INVOICE_STATUS_STYLES: Record<InvoiceStatus, string> = {
  paid: "border-success/20 bg-success/10 text-success",
  pending: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  overdue: "border-destructive/20 bg-destructive/10 text-destructive",
};

export function InvoiceStatusBadge({ status, className }: { status: InvoiceStatus; className?: string }) {
  return (
    <Badge variant="outline" className={cn("gap-1 rounded-full font-medium", INVOICE_STATUS_STYLES[status], className)}>
      {status === "overdue" && <Clock className="size-3" />}
      {INVOICE_STATUS_LABELS[status]}
    </Badge>
  );
}

const METHOD_STYLES: Record<PaymentMethod, string> = {
  nakit: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  kart: "border-violet-500/20 bg-violet-500/10 text-violet-700 dark:text-violet-400",
  havale: "border-primary/20 bg-primary/10 text-primary",
};

export function PaymentMethodBadge({ method, className }: { method: PaymentMethod; className?: string }) {
  return (
    <Badge variant="outline" className={cn("rounded-full font-medium", METHOD_STYLES[method], className)}>
      {PAYMENT_METHOD_LABELS[method]}
    </Badge>
  );
}

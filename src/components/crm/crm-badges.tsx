import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type {
  ContractStatus,
  CustomerStatus,
  CustomerType,
  NotePriority,
  OfferStatus,
  RiskLevel,
  WorkOrderStatus,
} from "@/lib/mock/crm";

const RISK_STYLES: Record<RiskLevel, string> = {
  low: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  medium: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
  high: "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20",
  critical: "bg-destructive/10 text-destructive border-destructive/20",
};

const RISK_LABELS: Record<RiskLevel, string> = {
  low: "Düşük",
  medium: "Orta",
  high: "Yüksek",
  critical: "Kritik",
};

export function RiskBadge({ level, className }: { level: RiskLevel; className?: string }) {
  return (
    <Badge variant="outline" className={cn("rounded-full font-medium", RISK_STYLES[level], className)}>
      {RISK_LABELS[level]}
    </Badge>
  );
}

const CUSTOMER_STATUS_STYLES: Record<CustomerStatus, string> = {
  active: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  passive: "bg-muted text-muted-foreground border-border",
};

const CUSTOMER_STATUS_LABELS: Record<CustomerStatus, string> = {
  active: "Aktif",
  passive: "Pasif",
};

export function CustomerStatusBadge({ status, className }: { status: CustomerStatus; className?: string }) {
  return (
    <Badge variant="outline" className={cn("rounded-full font-medium", CUSTOMER_STATUS_STYLES[status], className)}>
      {CUSTOMER_STATUS_LABELS[status]}
    </Badge>
  );
}

const CUSTOMER_TYPE_STYLES: Record<CustomerType, string> = {
  Bireysel: "bg-primary/10 text-primary border-primary/20",
  Kurumsal: "bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-500/20",
};

const CUSTOMER_TYPE_LABELS: Record<CustomerType, string> = {
  Bireysel: "Bireysel",
  Kurumsal: "Kurumsal",
};

export function CustomerTypeBadge({ type, className }: { type: CustomerType; className?: string }) {
  return (
    <Badge variant="outline" className={cn("rounded-full font-medium", CUSTOMER_TYPE_STYLES[type], className)}>
      {CUSTOMER_TYPE_LABELS[type]}
    </Badge>
  );
}

export function PotentialBadge({ className }: { className?: string }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-full font-medium bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
        className,
      )}
    >
      Potansiyel Müşteri
    </Badge>
  );
}

const CONTRACT_STATUS_STYLES: Record<ContractStatus, string> = {
  active: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  expiring: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
  expired: "bg-destructive/10 text-destructive border-destructive/20",
  cancelled: "bg-muted text-muted-foreground border-border",
};

const CONTRACT_STATUS_LABELS: Record<ContractStatus, string> = {
  active: "Aktif",
  expiring: "Süresi Yaklaşıyor",
  expired: "Süresi Doldu",
  cancelled: "İptal",
};

export function ContractStatusBadge({ status, className }: { status: ContractStatus; className?: string }) {
  return (
    <Badge variant="outline" className={cn("rounded-full font-medium", CONTRACT_STATUS_STYLES[status], className)}>
      {CONTRACT_STATUS_LABELS[status]}
    </Badge>
  );
}

const OFFER_STATUS_STYLES: Record<OfferStatus, string> = {
  draft: "bg-muted text-muted-foreground border-border",
  sent: "bg-primary/10 text-primary border-primary/20",
  accepted: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  rejected: "bg-destructive/10 text-destructive border-destructive/20",
  expired: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
};

const OFFER_STATUS_LABELS: Record<OfferStatus, string> = {
  draft: "Taslak",
  sent: "Gönderildi",
  accepted: "Kabul Edildi",
  rejected: "Reddedildi",
  expired: "Süresi Doldu",
};

export function OfferStatusBadge({ status, className }: { status: OfferStatus; className?: string }) {
  return (
    <Badge variant="outline" className={cn("rounded-full font-medium", OFFER_STATUS_STYLES[status], className)}>
      {OFFER_STATUS_LABELS[status]}
    </Badge>
  );
}

const WORK_ORDER_STATUS_STYLES: Record<WorkOrderStatus, string> = {
  planned: "bg-primary/10 text-primary border-primary/20",
  in_progress: "bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-500/20",
  completed: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  delayed: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
  cancelled: "bg-muted text-muted-foreground border-border",
};

const WORK_ORDER_STATUS_LABELS: Record<WorkOrderStatus, string> = {
  planned: "Planlandı",
  in_progress: "Devam Ediyor",
  completed: "Tamamlandı",
  delayed: "Gecikti",
  cancelled: "İptal",
};

export function WorkOrderStatusBadge({ status, className }: { status: WorkOrderStatus; className?: string }) {
  return (
    <Badge variant="outline" className={cn("rounded-full font-medium", WORK_ORDER_STATUS_STYLES[status], className)}>
      {WORK_ORDER_STATUS_LABELS[status]}
    </Badge>
  );
}

const NOTE_PRIORITY_STYLES: Record<NotePriority, string> = {
  low: "bg-muted text-muted-foreground border-border",
  normal: "bg-primary/10 text-primary border-primary/20",
  high: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
  critical: "bg-destructive/10 text-destructive border-destructive/20",
};

const NOTE_PRIORITY_LABELS: Record<NotePriority, string> = {
  low: "Düşük",
  normal: "Normal",
  high: "Yüksek",
  critical: "Kritik",
};

export function NotePriorityBadge({ priority, className }: { priority: NotePriority; className?: string }) {
  return (
    <Badge variant="outline" className={cn("rounded-full font-medium", NOTE_PRIORITY_STYLES[priority], className)}>
      {NOTE_PRIORITY_LABELS[priority]}
    </Badge>
  );
}

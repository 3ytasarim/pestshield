import {
  AlertOctagon,
  ClipboardCheck,
  FileSignature,
  MapPinned,
  Package,
  Truck,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import type { NotificationPriority, NotificationType } from "@/lib/mock/notifications";

export const NOTIFICATION_TYPE_ICONS: Record<NotificationType, LucideIcon> = {
  work_order: ClipboardCheck,
  contract: FileSignature,
  stock: Package,
  station: MapPinned,
  capa: AlertOctagon,
  risk: AlertOctagon,
  payment: Wallet,
  fleet: Truck,
};

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  work_order: "İş Emri",
  contract: "Sözleşme",
  stock: "Stok",
  station: "İstasyon",
  capa: "Düzeltici Faaliyet",
  risk: "Risk",
  payment: "Tahsilat",
  fleet: "Filo",
};

export const NOTIFICATION_PRIORITY_STYLES: Record<NotificationPriority, string> = {
  low: "bg-muted text-muted-foreground",
  normal: "bg-primary/10 text-primary",
  high: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  critical: "bg-destructive/10 text-destructive",
};

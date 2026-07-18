import type { AlertSeverity } from "@/lib/ai/alerts/types";
import { cn } from "@/lib/utils";

const STYLES: Record<AlertSeverity, string> = {
  info: "bg-primary/10 text-primary",
  warning: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  high: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
  critical: "bg-destructive/10 text-destructive",
};

const LABELS: Record<AlertSeverity, string> = {
  info: "Bilgi",
  warning: "Uyarı",
  high: "Yüksek",
  critical: "Kritik",
};

export function AlertSeverityBadge({ severity }: { severity: AlertSeverity }) {
  return <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold", STYLES[severity])}>{LABELS[severity]}</span>;
}

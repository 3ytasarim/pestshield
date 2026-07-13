import { AlertOctagon, CheckCircle2, Clock, MinusCircle, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  AUDIT_RESULT_LABELS,
  CAPA_SEVERITY_LABELS,
  CAPA_STATUS_LABELS,
  CHECKLIST_STATUS_LABELS,
} from "@/components/audit/audit-labels";
import { riskLevel, type AuditResult, type CapaSeverity, type CapaStatus, type ChecklistStatus, type RiskLevel } from "@/lib/mock/audit";

const CHECKLIST_STATUS_STYLES: Record<ChecklistStatus, string> = {
  compliant: "border-success/20 bg-success/10 text-success",
  non_compliant: "border-destructive/20 bg-destructive/10 text-destructive",
  pending: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  not_applicable: "border-border bg-muted text-muted-foreground",
};

const CHECKLIST_STATUS_ICON: Record<ChecklistStatus, typeof CheckCircle2> = {
  compliant: CheckCircle2,
  non_compliant: XCircle,
  pending: Clock,
  not_applicable: MinusCircle,
};

export function ChecklistStatusBadge({ status, className }: { status: ChecklistStatus; className?: string }) {
  const Icon = CHECKLIST_STATUS_ICON[status];
  return (
    <Badge variant="outline" className={cn("gap-1 rounded-full font-medium", CHECKLIST_STATUS_STYLES[status], className)}>
      <Icon className="size-3" />
      {CHECKLIST_STATUS_LABELS[status]}
    </Badge>
  );
}

const CAPA_SEVERITY_STYLES: Record<CapaSeverity, string> = {
  low: "border-border bg-muted text-muted-foreground",
  medium: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  high: "border-orange-500/20 bg-orange-500/10 text-orange-700 dark:text-orange-400",
  critical: "border-destructive/20 bg-destructive/10 text-destructive",
};

export function CapaSeverityBadge({ severity, className }: { severity: CapaSeverity; className?: string }) {
  return (
    <Badge variant="outline" className={cn("gap-1 rounded-full font-semibold uppercase", CAPA_SEVERITY_STYLES[severity], className)}>
      {severity === "critical" && <AlertOctagon className="size-3" />}
      {CAPA_SEVERITY_LABELS[severity]}
    </Badge>
  );
}

const CAPA_STATUS_STYLES: Record<CapaStatus, string> = {
  open: "border-destructive/20 bg-destructive/10 text-destructive",
  in_progress: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  resolved: "border-primary/20 bg-primary/10 text-primary",
  verified: "border-success/20 bg-success/10 text-success",
};

export function CapaStatusBadge({ status, className }: { status: CapaStatus; className?: string }) {
  return (
    <Badge variant="outline" className={cn("rounded-full font-medium", CAPA_STATUS_STYLES[status], className)}>
      {CAPA_STATUS_LABELS[status]}
    </Badge>
  );
}

const RISK_LEVEL_STYLES: Record<RiskLevel, string> = {
  low: "border-success/20 bg-success/10 text-success",
  medium: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  high: "border-orange-500/20 bg-orange-500/10 text-orange-700 dark:text-orange-400",
  critical: "border-destructive/20 bg-destructive/10 text-destructive",
};

const RISK_LEVEL_LABELS: Record<RiskLevel, string> = {
  low: "Düşük",
  medium: "Orta",
  high: "Yüksek",
  critical: "Kritik",
};

export function RiskLevelBadge({ score, className }: { score: number; className?: string }) {
  const level = riskLevel(score);
  return (
    <Badge variant="outline" className={cn("rounded-full font-semibold", RISK_LEVEL_STYLES[level], className)}>
      {RISK_LEVEL_LABELS[level]} · {score}
    </Badge>
  );
}

const AUDIT_RESULT_STYLES: Record<AuditResult, string> = {
  passed: "border-success/20 bg-success/10 text-success",
  passed_with_findings: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  failed: "border-destructive/20 bg-destructive/10 text-destructive",
  scheduled: "border-primary/20 bg-primary/10 text-primary",
};

export function AuditResultBadge({ result, className }: { result: AuditResult; className?: string }) {
  return (
    <Badge variant="outline" className={cn("rounded-full font-medium", AUDIT_RESULT_STYLES[result], className)}>
      {AUDIT_RESULT_LABELS[result]}
    </Badge>
  );
}

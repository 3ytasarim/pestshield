import { AlertTriangle, CheckCircle2, MinusCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  ACTIVITY_LEVEL_LABELS,
  STATION_STATUS_LABELS,
  TECHNICIAN_STATUS_LABELS,
  VEHICLE_STATUS_LABELS,
} from "@/components/operations/operations-labels";
import type { ActivityLevel, StationStatus, TechnicianStatus, VehicleStatus } from "@/lib/mock/operations";

const STATION_STATUS_STYLES: Record<StationStatus, string> = {
  active: "border-success/20 bg-success/10 text-success",
  needs_attention: "border-destructive/20 bg-destructive/10 text-destructive",
  inactive: "border-border bg-muted text-muted-foreground",
};

export function StationStatusBadge({ status, className }: { status: StationStatus; className?: string }) {
  const Icon = status === "active" ? CheckCircle2 : status === "needs_attention" ? AlertTriangle : MinusCircle;
  return (
    <Badge variant="outline" className={cn("gap-1 rounded-full font-medium", STATION_STATUS_STYLES[status], className)}>
      <Icon className="size-3" />
      {STATION_STATUS_LABELS[status]}
    </Badge>
  );
}

const ACTIVITY_LEVEL_STYLES: Record<ActivityLevel, string> = {
  none: "border-border bg-muted text-muted-foreground",
  low: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  medium: "border-orange-500/20 bg-orange-500/10 text-orange-700 dark:text-orange-400",
  high: "border-destructive/20 bg-destructive/10 text-destructive",
};

export function ActivityLevelBadge({ level, className }: { level: ActivityLevel; className?: string }) {
  return (
    <Badge variant="outline" className={cn("rounded-full font-medium", ACTIVITY_LEVEL_STYLES[level], className)}>
      {ACTIVITY_LEVEL_LABELS[level]}
    </Badge>
  );
}

const TECHNICIAN_STATUS_STYLES: Record<TechnicianStatus, string> = {
  active: "border-success/20 bg-success/10 text-success",
  on_leave: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  inactive: "border-border bg-muted text-muted-foreground",
};

export function TechnicianStatusBadge({ status, className }: { status: TechnicianStatus; className?: string }) {
  return (
    <Badge variant="outline" className={cn("rounded-full font-medium", TECHNICIAN_STATUS_STYLES[status], className)}>
      {TECHNICIAN_STATUS_LABELS[status]}
    </Badge>
  );
}

const VEHICLE_STATUS_STYLES: Record<VehicleStatus, string> = {
  active: "border-success/20 bg-success/10 text-success",
  maintenance: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  inactive: "border-border bg-muted text-muted-foreground",
};

export function VehicleStatusBadge({ status, className }: { status: VehicleStatus; className?: string }) {
  return (
    <Badge variant="outline" className={cn("rounded-full font-medium", VEHICLE_STATUS_STYLES[status], className)}>
      {VEHICLE_STATUS_LABELS[status]}
    </Badge>
  );
}

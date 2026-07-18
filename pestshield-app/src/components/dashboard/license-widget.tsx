"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShieldAlert, ShieldCheck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { LicenseStatus } from "@/lib/license";

interface LicenseStatusResponse {
  daysRemaining: number | null;
  status: LicenseStatus;
}

export function LicenseWidget() {
  const [data, setData] = useState<LicenseStatusResponse | null | "loading">("loading");

  useEffect(() => {
    function sync() {
      fetch("/api/license/status")
        .then((res) => (res.ok ? res.json() : null))
        .then((d: LicenseStatusResponse | null) => setData(d))
        .catch(() => setData(null));
    }
    sync();
    window.addEventListener("pestshield:license-updated", sync);
    return () => window.removeEventListener("pestshield:license-updated", sync);
  }, []);

  if (data === "loading") {
    return <Skeleton className="h-10 w-20" />;
  }
  if (!data) return null;

  const isBlocked = data.status === "EXPIRED" || data.status === "NONE";
  const isWarning = data.status === "EXPIRING_SOON";
  const Icon = isBlocked ? ShieldAlert : ShieldCheck;

  const content = (
    <div className="flex items-center gap-2">
      <Icon
        className={cn(
          "size-4",
          isBlocked ? "text-destructive" : isWarning ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground",
        )}
      />
      <div className="flex flex-col leading-tight">
        <span
          className={cn(
            "text-sm font-semibold tabular-nums",
            isBlocked ? "text-destructive" : isWarning ? "text-amber-600 dark:text-amber-400" : "text-foreground",
          )}
        >
          {isBlocked ? "Süresi Doldu" : `${data.daysRemaining} gün`}
        </span>
        <span className="text-xs text-muted-foreground">Kalan Lisans</span>
      </div>
    </div>
  );

  if (isBlocked) {
    return (
      <Link href="/dashboard/client/license" className="transition-opacity hover:opacity-80">
        {content}
      </Link>
    );
  }

  return content;
}

"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export function HeaderClock({ className }: { className?: string }) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000 * 30);
    return () => clearInterval(id);
  }, []);

  if (!now) {
    return <div className={cn("h-9 w-20", className)} />;
  }

  const time = new Intl.DateTimeFormat("tr-TR", { hour: "2-digit", minute: "2-digit" }).format(now);
  const date = new Intl.DateTimeFormat("tr-TR", { day: "2-digit", month: "short" }).format(now);

  return (
    <div className={cn("items-center gap-2 rounded-full border border-border/60 bg-muted/40 px-3 py-1.5", className)}>
      <Clock className="size-3.5 text-muted-foreground" />
      <span className="text-xs font-medium tabular-nums text-foreground">{time}</span>
      <span className="text-xs text-muted-foreground">· {date}</span>
    </div>
  );
}

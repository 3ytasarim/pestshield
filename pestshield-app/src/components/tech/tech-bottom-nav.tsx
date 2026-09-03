"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, FileClock, FileText, LayoutGrid, MapPin, MoreHorizontal, QrCode, ShieldCheck, UserRound, Wrench } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const PRIMARY_TABS = [
  { href: "/dashboard/tech", label: "Ana", icon: LayoutGrid },
  { href: "/dashboard/tech/stations", label: "İstasyon", icon: MapPin },
  { href: "/dashboard/tech/profile", label: "Profil", icon: UserRound },
] as const;

/** Alt gezinme çubuğunda tek tek sığmayan diğer teknisyen sayfaları — "Daha" sayfasında listelenir. */
const MORE_ITEMS = [
  { href: "/dashboard/tech/scan", label: "QR Kontrol", icon: QrCode },
  { href: "/dashboard/tech/calendar", label: "Takvim", icon: Calendar },
  { href: "/dashboard/tech/services", label: "Hizmetler", icon: Wrench },
  { href: "/dashboard/tech/daily-reports", label: "Günlük Rapor", icon: FileClock },
  { href: "/dashboard/tech/technical-reports", label: "Teknik Rapor", icon: FileText },
  { href: "/dashboard/tech/compliance", label: "Uygunluk", icon: ShieldCheck },
] as const;

export function TechBottomNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const isMoreActive = MORE_ITEMS.some((item) => pathname.startsWith(item.href));

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md">
        <div className="mx-auto flex max-w-md items-stretch justify-around">
          {PRIMARY_TABS.map((tab) => {
            const isActive = tab.href === "/dashboard/tech" ? pathname === tab.href : pathname.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground",
                )}
              >
                <tab.icon className="size-5" />
                {tab.label}
                <span className={cn("h-0.5 w-8 rounded-full transition-colors", isActive ? "bg-primary" : "bg-transparent")} />
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors",
              isMoreActive ? "text-primary" : "text-muted-foreground",
            )}
          >
            <MoreHorizontal className="size-5" />
            Daha
            <span className={cn("h-0.5 w-8 rounded-full transition-colors", isMoreActive ? "bg-primary" : "bg-transparent")} />
          </button>
        </div>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="mx-auto max-w-md rounded-t-2xl pb-[calc(env(safe-area-inset-bottom)+1rem)]">
          <SheetHeader className="gap-0.5">
            <SheetTitle>Daha</SheetTitle>
            <SheetDescription>Diğer teknisyen sayfaları</SheetDescription>
          </SheetHeader>
          <div className="flex flex-col gap-1 px-4 pb-2">
            {MORE_ITEMS.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMoreOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors active:bg-muted/60",
                    isActive ? "bg-primary/10 text-primary" : "text-foreground",
                  )}
                >
                  <item.icon className="size-4.5" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, MapPin, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/dashboard/tech", label: "Ana", icon: LayoutGrid },
  { href: "/dashboard/tech/stations", label: "İstasyon", icon: MapPin },
  { href: "/dashboard/tech/profile", label: "Profil", icon: UserRound },
] as const;

export function TechBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md">
      <div className="mx-auto flex max-w-md items-stretch justify-around">
        {TABS.map((tab) => {
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
      </div>
    </nav>
  );
}

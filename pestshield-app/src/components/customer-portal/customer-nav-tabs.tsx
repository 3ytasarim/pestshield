"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileClock, FileSignature, LayoutDashboard, LifeBuoy, ListChecks } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/dashboard/customer", label: "Genel Bakış", icon: LayoutDashboard },
  { href: "/dashboard/customer/work-orders", label: "Hizmet Geçmişi", icon: ListChecks },
  { href: "/dashboard/customer/invoices", label: "Faturalar", icon: FileClock },
  { href: "/dashboard/customer/contracts", label: "Sözleşmeler", icon: FileSignature },
  { href: "/dashboard/customer/support", label: "Destek", icon: LifeBuoy },
] as const;

export function CustomerNavTabs() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-[57px] z-10 overflow-x-auto border-b border-border bg-background/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-stretch gap-1 px-2 sm:px-6">
        {TABS.map((tab) => {
          const isActive = tab.href === "/dashboard/customer" ? pathname === tab.href : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-colors",
                isActive ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              <tab.icon className="size-4" />
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

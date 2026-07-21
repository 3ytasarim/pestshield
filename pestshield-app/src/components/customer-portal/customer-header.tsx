"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase() || "U";
}

export function CustomerHeader({
  companyName,
  companyLogo,
  userName,
}: {
  companyName: string;
  companyLogo: string | null;
  userName: string;
}) {
  return (
    <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-card/95 px-4 py-3 backdrop-blur-md sm:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-2.5">
        {companyLogo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={companyLogo} alt="Firma logosu" className="size-9 shrink-0 rounded-lg border border-border/60 bg-white object-contain p-1" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src="/logo-icon.png" alt="PestShield" className="size-9 shrink-0 rounded-lg object-contain" />
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{companyName}</p>
          <p className="truncate text-[10px] text-muted-foreground">Müşteri Portalı</p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <div className="hidden size-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/60 text-xs font-semibold text-white sm:flex">
          {initialsOf(userName)}
        </div>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/login" })}
          aria-label="Çıkış Yap"
          className="flex size-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
        >
          <LogOut className="size-4" />
        </button>
      </div>
    </header>
  );
}

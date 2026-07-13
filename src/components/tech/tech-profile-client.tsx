"use client";

import { signOut } from "next-auth/react";
import { toast } from "sonner";
import { Bell, ChevronRight, LifeBuoy, LogOut, Mail, ShieldCheck, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { GLASS_CARD } from "@/components/dashboard/shared";
import { cn } from "@/lib/utils";

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase() || "U";
}

interface TechProfileClientProps {
  userName: string;
  userEmail: string;
}

export function TechProfileClient({ userName, userEmail }: TechProfileClientProps) {
  return (
    <div className="flex flex-col gap-4 pb-6">
      <h1 className="text-lg font-bold text-foreground">Profil</h1>

      <div className="flex items-center gap-3.5 rounded-2xl bg-gradient-to-br from-primary to-primary/70 p-4 text-white shadow-sm">
        <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-white/20 text-lg font-bold">
          {initialsOf(userName)}
        </div>
        <div className="min-w-0">
          <p className="truncate text-base font-semibold">{userName}</p>
          <p className="text-xs text-white/80">Saha Personeli</p>
          <p className="truncate text-xs text-white/70">{userEmail}</p>
        </div>
      </div>

      <Card className={cn(GLASS_CARD, "rounded-2xl")}>
        <CardContent className="flex flex-col gap-3">
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Hesap Bilgileri</p>
          <div className="flex flex-col gap-3 text-sm">
            <div className="flex items-center gap-2.5">
              <UserRound className="size-4 text-muted-foreground" />
              <span className="text-foreground">{userName}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Mail className="size-4 text-muted-foreground" />
              <span className="text-foreground">{userEmail}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="size-4 text-muted-foreground" />
              <span className="text-foreground">Saha Personeli</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className={cn(GLASS_CARD, "gap-0 divide-y divide-border/60 rounded-2xl p-0")}>
        <button
          type="button"
          onClick={() => toast.info("Bildirim ayarları yakında eklenecek")}
          className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-muted/40"
        >
          <Bell className="size-4 text-muted-foreground" />
          <span className="flex-1 text-sm text-foreground">Bildirimler</span>
          <ChevronRight className="size-4 text-muted-foreground" />
        </button>
        <button
          type="button"
          onClick={() => toast.info("Yardım merkezi yakında eklenecek")}
          className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-muted/40"
        >
          <LifeBuoy className="size-4 text-muted-foreground" />
          <span className="flex-1 text-sm text-foreground">Yardım &amp; Destek</span>
          <ChevronRight className="size-4 text-muted-foreground" />
        </button>
      </Card>

      <Button
        variant="destructive"
        className="h-12 w-full justify-center rounded-xl"
        onClick={() => signOut({ callbackUrl: "/login" })}
      >
        <LogOut className="size-4" />
        Çıkış Yap
      </Button>
    </div>
  );
}

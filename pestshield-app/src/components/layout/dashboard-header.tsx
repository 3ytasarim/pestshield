"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Languages, LifeBuoy, LogOut, Search, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import { toast } from "sonner";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { HeaderClock } from "@/components/layout/header-clock";
import { PestShieldFmWidget } from "@/components/layout/pestshield-fm-widget";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { useCommandPalette } from "@/components/layout/command-palette-context";
import { useAiPanel } from "@/components/ai-assistant/ai-panel-context";
import { getPageTitle, matchCustomerDetailPath } from "@/components/layout/nav-config";
import { getCompanySettings } from "@/lib/company-settings";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase() || "U";
}

export function DashboardHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const { openPalette } = useCommandPalette();
  const { openAiPanel } = useAiPanel();

  const [companyName, setCompanyName] = useState<string | null>(null);
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [customerDetailLabel, setCustomerDetailLabel] = useState<string | null>(null);
  const role = session?.user?.role;
  const customerDetailId = matchCustomerDetailPath(pathname);
  const currentLabel = customerDetailId ? (customerDetailLabel ?? getPageTitle(pathname)) : getPageTitle(pathname);

  useEffect(() => {
    if (!customerDetailId) {
      setCustomerDetailLabel(null);
      return;
    }
    setCustomerDetailLabel(null);
    fetch(`/api/crm/customers/${customerDetailId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setCustomerDetailLabel(data?.customer?.companyName ?? null))
      .catch(() => setCustomerDetailLabel(null));
  }, [customerDetailId]);

  useEffect(() => {
    if (role !== "CLIENT") return;
    function syncCompanySettings() {
      const settings = getCompanySettings();
      setCompanyName(settings.companyName || null);
      setCompanyLogo(settings.logo);
    }
    syncCompanySettings();
    window.addEventListener("pestshield:company-settings-updated", syncCompanySettings);
    window.addEventListener("storage", syncCompanySettings);
    return () => {
      window.removeEventListener("pestshield:company-settings-updated", syncCompanySettings);
      window.removeEventListener("storage", syncCompanySettings);
    };
  }, [role]);

  const userEmail = session?.user?.email ?? "";
  const userName = companyName ?? session?.user?.name ?? "Kullanıcı";

  return (
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-3 border-b border-border bg-card/80 px-4 shadow-sm backdrop-blur-md sm:px-6">
      <SidebarTrigger className="-ml-1" />
      <Breadcrumb className="hidden shrink-0 sm:block">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage className="text-base font-semibold tracking-tight text-foreground">
              {currentLabel}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <button
        type="button"
        onClick={openPalette}
        className="group relative mx-auto hidden h-9 w-full max-w-sm items-center rounded-full border border-border bg-muted/50 pr-14 pl-9 text-left text-sm text-muted-foreground transition-all hover:border-ring/40 hover:bg-background lg:flex"
      >
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground transition-colors group-hover:text-primary" />
        <span>Müşteri, sayfa veya işlem ara…</span>
        <kbd className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 rounded-md border border-border bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
          ⌘K
        </kbd>
      </button>

      <div className="ml-auto flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full lg:hidden"
          onClick={openPalette}
          aria-label="Ara"
        >
          <Search className="size-4.5" />
        </Button>
        <PestShieldFmWidget className="mr-1" />
        <HeaderClock className="mr-1 hidden xl:flex" />
        <Separator orientation="vertical" className="mx-0.5 hidden h-6 xl:block" />
        <Button
          variant="ghost"
          size="sm"
          className="hidden items-center gap-1.5 rounded-full border border-primary/15 bg-gradient-to-br from-primary/10 to-primary/[0.02] px-3 text-primary hover:from-primary/15 hover:to-primary/5 md:inline-flex"
          onClick={openAiPanel}
        >
          <Sparkles className="size-3.5" />
          AI
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="hidden rounded-full sm:inline-flex"
          onClick={() => toast.info("Çok dil desteği yakında eklenecek")}
          aria-label="Dil değiştir"
        >
          <Languages className="size-4.5" />
        </Button>
        <NotificationBell />
        <ThemeToggle />
        <Separator orientation="vertical" className="mx-1 hidden h-6 sm:block" />
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="ghost" className="h-9 gap-2 rounded-full pr-2 pl-1" />}
          >
            {companyLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={companyLogo}
                alt="Firma logosu"
                className="size-7 shrink-0 rounded-full border border-border/60 bg-white object-contain p-0.5"
              />
            ) : (
              <div className="flex size-7 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/60 text-[11px] font-semibold text-white">
                {initialsOf(userName)}
              </div>
            )}
            <span className="hidden max-w-28 truncate text-sm font-medium sm:inline">{userName}</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="flex flex-col gap-0.5">
                <span className="truncate text-sm font-medium text-foreground">{userName}</span>
                <span className="truncate text-xs font-normal text-muted-foreground">{userEmail}</span>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/dashboard/client/settings")}>
              <UserRound className="size-3.5" />
              Profil / Şirket Ayarları
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/dashboard/client/license")}>
              <ShieldCheck className="size-3.5" />
              Lisans
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => toast.info("Destek merkezi yakında eklenecek")}>
              <LifeBuoy className="size-3.5" />
              Destek
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut className="size-3.5" />
              Çıkış
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

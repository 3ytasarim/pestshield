"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, ChevronsUpDown, LogOut, Search, Settings } from "lucide-react";
import { signOut } from "next-auth/react";
import { toast } from "sonner";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NAV_GROUPS_BY_ROLE, type NavGroup } from "@/components/layout/nav-config";
import { useCommandPalette } from "@/components/layout/command-palette-context";
import { cn } from "@/lib/utils";
import type { Role } from "@/generated/prisma/enums";

const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Yönetici",
  TECH: "Saha Personeli",
  CLIENT: "Müşteri",
};

const STORAGE_KEY = "pestshield.sidebar.open-groups";

interface AppSidebarProps {
  role: Role;
  userName: string;
  userEmail: string;
}

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase() || "U";
}

function getInitialOpenState(groups: NavGroup[], pathname: string): Record<string, boolean> {
  const state: Record<string, boolean> = {};
  for (const group of groups) {
    const hasActiveItem = group.items.some((item) => item.href === pathname);
    state[group.label] = hasActiveItem || !!group.defaultOpen;
  }
  return state;
}

export function AppSidebar({ role, userName, userEmail }: AppSidebarProps) {
  const pathname = usePathname();
  const { state: sidebarState } = useSidebar();
  const { openPalette } = useCommandPalette();
  const groups = NAV_GROUPS_BY_ROLE[role];
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() =>
    getInitialOpenState(groups, pathname),
  );
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const stored = JSON.parse(raw) as Record<string, boolean>;
        setOpenGroups((prev) => ({ ...prev, ...stored }));
      }
    } catch {
      // localStorage unavailable — ignore, defaults already applied
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(openGroups));
  }, [openGroups, hydrated]);

  function toggleGroup(label: string) {
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="gap-3 border-b border-sidebar-border/60 px-3 py-5 group-data-[collapsible=icon]:pb-6">
        <div className="flex flex-col gap-1.5 px-1">
          <Image
            src="/logo-shield.png"
            alt="PestShield"
            width={328}
            height={401}
            className="hidden h-9 w-auto shrink-0 group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:block"
          />
          <Image
            src="/logo-wordmark.png"
            alt="PestShield"
            width={1113}
            height={208}
            className="h-8 w-auto shrink-0 group-data-[collapsible=icon]:hidden"
          />
          <span className="text-[10px] font-medium tracking-wide text-sidebar-foreground/50 uppercase group-data-[collapsible=icon]:hidden">
            {ROLE_LABELS[role]} Paneli
          </span>
        </div>

        <button
          type="button"
          onClick={openPalette}
          className="flex w-full items-center gap-2 rounded-xl border border-sidebar-border/60 bg-sidebar-accent/25 px-3 py-2 text-left text-sm text-sidebar-foreground/50 transition-colors hover:bg-sidebar-accent/50 group-data-[collapsible=icon]:hidden"
        >
          <Search className="size-4 shrink-0" />
          <span className="flex-1">Ara…</span>
          <kbd className="shrink-0 rounded-md bg-sidebar-foreground/10 px-1.5 py-0.5 text-[9px] font-medium text-sidebar-foreground/50">
            ⌘K
          </kbd>
        </button>
      </SidebarHeader>

      <SidebarContent className="gap-0.5 px-1 py-2 group-data-[collapsible=icon]:pt-3">
        {groups.map((group) => {
          const isOpen = sidebarState === "collapsed" || (openGroups[group.label] ?? false);
          const hasActiveItem = group.items.some((item) => item.href === pathname);

          return (
            <SidebarGroup key={group.label} className="py-0.5">
              <button
                type="button"
                onClick={() => toggleGroup(group.label)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-[11px] font-semibold tracking-widest uppercase transition-colors group-data-[collapsible=icon]:hidden",
                  hasActiveItem
                    ? "text-sidebar-foreground/80"
                    : "text-sidebar-foreground/40 hover:text-sidebar-foreground/70",
                )}
              >
                <group.icon className="size-3.5 shrink-0" />
                <span className="flex-1 text-left">{group.label}</span>
                <ChevronRight
                  className={cn(
                    "size-3.5 shrink-0 transition-transform duration-200",
                    isOpen && "rotate-90",
                  )}
                />
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden"
                  >
                    <SidebarGroupContent>
                      <SidebarMenu>
                        {group.items.map((item) => (
                          <SidebarMenuItem key={item.href}>
                            {item.comingSoon ? (
                              <SidebarMenuButton
                                disabled
                                tooltip={`${item.label} · Yakında`}
                                className="cursor-not-allowed opacity-45 hover:translate-x-0 hover:bg-transparent"
                              >
                                <item.icon />
                                <span>{item.label}</span>
                                <span className="ml-auto rounded-full bg-sidebar-foreground/10 px-1.5 py-0.5 text-[9px] font-semibold tracking-wide text-sidebar-foreground/60 uppercase group-data-[collapsible=icon]:hidden">
                                  Yakında
                                </span>
                              </SidebarMenuButton>
                            ) : item.action === "open-command-palette" ? (
                              <SidebarMenuButton tooltip={item.label} onClick={openPalette}>
                                <item.icon />
                                <span>{item.label}</span>
                                <kbd className="ml-auto rounded-md bg-sidebar-foreground/10 px-1.5 py-0.5 text-[9px] font-medium text-sidebar-foreground/60 group-data-[collapsible=icon]:hidden">
                                  ⌘K
                                </kbd>
                              </SidebarMenuButton>
                            ) : (
                              <SidebarMenuButton
                                render={<Link href={item.href} />}
                                isActive={pathname === item.href}
                                tooltip={item.label}
                              >
                                <item.icon />
                                <span>{item.label}</span>
                              </SidebarMenuButton>
                            )}
                          </SidebarMenuItem>
                        ))}
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </motion.div>
                )}
              </AnimatePresence>
            </SidebarGroup>
          );
        })}
      </SidebarContent>

      <SidebarFooter className="gap-2 border-t border-sidebar-border/60 p-2.5 group-data-[collapsible=icon]:items-center">
        <DropdownMenu>
          <DropdownMenuTrigger className="flex w-full items-center gap-2.5 rounded-xl bg-sidebar-accent/60 p-2 text-left transition-colors hover:bg-sidebar-accent/85 group-data-[collapsible=icon]:hidden">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sidebar-primary to-sidebar-primary/60 text-xs font-semibold text-white">
              {initialsOf(userName)}
            </div>
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-xs font-medium text-sidebar-foreground">{userName}</span>
              <span className="truncate text-[11px] text-sidebar-foreground/55">{userEmail}</span>
            </div>
            <ChevronsUpDown className="size-3.5 shrink-0 text-sidebar-foreground/40" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="top" className="w-64">
            <DropdownMenuItem disabled className="flex items-center gap-2.5 opacity-100">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/60 text-[11px] font-semibold text-white">
                {initialsOf(userName)}
              </div>
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-medium text-foreground">{userName}</span>
                <span className="truncate text-xs text-muted-foreground">Şu anki firma</span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => toast.info("Çoklu firma yönetimi yakında eklenecek")}>
              <Settings className="size-3.5" />
              Firma ekle / değiştir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Çıkış Yap"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-sidebar-foreground/70 hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut />
              <span>Çıkış Yap</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

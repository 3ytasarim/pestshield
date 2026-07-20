"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { signOut } from "next-auth/react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { CornerDownLeft, LogOut, Moon, Plus, Search, Sun, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_GROUPS_BY_ROLE } from "@/components/layout/nav-config";
import { useCommandPalette } from "@/components/layout/command-palette-context";
import type { Role } from "@/generated/prisma";

interface CommandItem {
  id: string;
  label: string;
  group: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
}

interface CommandPaletteProps {
  role: Role;
}

export function CommandPalette({ role }: CommandPaletteProps) {
  const { open, setOpen } = useCommandPalette();
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(!open);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, setOpen]);

  const items = useMemo<CommandItem[]>(() => {
    const navItems: CommandItem[] = NAV_GROUPS_BY_ROLE[role].flatMap((group) =>
      group.items
        .filter((item) => !item.comingSoon && item.action !== "open-command-palette")
        .map((item) => ({
          id: item.href,
          label: item.label,
          group: group.label,
          icon: item.icon,
          action: () => router.push(item.href),
        })),
    );

    const createItems: CommandItem[] =
      role === "CLIENT"
        ? [
            {
              id: "new-customer",
              label: "Yeni Müşteri",
              group: "Hızlı Oluştur",
              icon: Plus,
              action: () => router.push("/dashboard/client/customers?new=1"),
            },
          ]
        : [];

    const utilityItems: CommandItem[] = [
      {
        id: "theme-toggle",
        label: resolvedTheme === "dark" ? "Aydınlık Temaya Geç" : "Karanlık Temaya Geç",
        group: "Hızlı İşlemler",
        icon: resolvedTheme === "dark" ? Sun : Moon,
        action: () => setTheme(resolvedTheme === "dark" ? "light" : "dark"),
      },
      {
        id: "logout",
        label: "Çıkış Yap",
        group: "Hızlı İşlemler",
        icon: LogOut,
        action: () => signOut({ callbackUrl: "/login" }),
      },
    ];

    return [...createItems, ...navItems, ...utilityItems];
  }, [role, resolvedTheme, router, setTheme]);

  const filtered = useMemo(() => {
    const trimmed = query.trim();
    if (!trimmed) return items;
    const q = trimmed.toLowerCase();
    const matches = items.filter(
      (item) => item.label.toLowerCase().includes(q) || item.group.toLowerCase().includes(q),
    );
    const searchAction: CommandItem = {
      id: "search-customers",
      label: `"${trimmed}" için müşterilerde ara`,
      group: "Ara",
      icon: Users,
      action: () => router.push(`/dashboard/client/customers?search=${encodeURIComponent(trimmed)}`),
    };
    return [searchAction, ...matches];
  }, [items, query, router]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIndex(0);
    }
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  function runItem(item: CommandItem) {
    item.action();
    setOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = filtered[activeIndex];
      if (item) runItem(item);
    }
  }

  let runningIndex = -1;

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/30 backdrop-blur-[2px] duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0" />
        <DialogPrimitive.Popup className="fixed top-[14vh] left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 flex-col overflow-hidden rounded-2xl bg-popover text-popover-foreground shadow-2xl ring-1 ring-foreground/10 duration-150 data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0">
          <DialogPrimitive.Title className="sr-only">Komut Paleti</DialogPrimitive.Title>
          <div className="flex items-center gap-2.5 border-b border-border/60 px-4 py-3.5">
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Sayfa veya işlem ara…"
              className="h-6 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            <kbd className="shrink-0 rounded-md border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
              ESC
            </kbd>
          </div>

          <div className="max-h-[min(60vh,420px)] overflow-y-auto p-2">
            {filtered.length === 0 && (
              <p className="px-3 py-8 text-center text-sm text-muted-foreground">Sonuç bulunamadı.</p>
            )}
            {Object.entries(
              filtered.reduce<Record<string, CommandItem[]>>((acc, item) => {
                (acc[item.group] ??= []).push(item);
                return acc;
              }, {}),
            ).map(([groupLabel, groupItems]) => (
              <div key={groupLabel} className="mb-1 last:mb-0">
                <p className="px-3 py-1.5 text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
                  {groupLabel}
                </p>
                {groupItems.map((item) => {
                  runningIndex += 1;
                  const isActive = runningIndex === activeIndex;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onMouseEnter={() => setActiveIndex(runningIndex)}
                      onClick={() => runItem(item)}
                      className={cn(
                        "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                        isActive ? "bg-accent text-accent-foreground" : "text-foreground hover:bg-muted",
                      )}
                    >
                      <item.icon className="size-4 shrink-0 text-muted-foreground" />
                      <span className="flex-1 truncate">{item.label}</span>
                      {isActive && <CornerDownLeft className="size-3.5 shrink-0 text-muted-foreground" />}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

"use client";

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { CommandPalette } from "@/components/layout/command-palette";
import { CommandPaletteProvider } from "@/components/layout/command-palette-context";
import { NotificationsProvider } from "@/components/notifications/notifications-context";
import { AiCommandCenter } from "@/components/ai-assistant/ai-command-center";
import { AiPanelProvider } from "@/components/ai-assistant/ai-panel-context";
import type { Role } from "@/generated/prisma";

interface DashboardShellProps {
  role: Role;
  userName: string;
  userEmail: string;
  /** `null` = kısıtlama yok (kiracı sahibi / ADMIN / TECH). Alt kullanıcı için sidebar'da görünecek href listesi. */
  visibleNavHrefs?: string[] | null;
  children: React.ReactNode;
}

export function DashboardShell({ role, userName, userEmail, visibleNavHrefs = null, children }: DashboardShellProps) {
  return (
    <NotificationsProvider role={role}>
      <AiPanelProvider>
        <CommandPaletteProvider>
          <SidebarProvider style={{ "--sidebar-width": "18.75rem" } as React.CSSProperties}>
            <AppSidebar role={role} userName={userName} userEmail={userEmail} visibleNavHrefs={visibleNavHrefs} />
            <SidebarInset>
              <DashboardHeader />
              <main className="flex flex-1 flex-col gap-4 p-4 md:p-6">{children}</main>
            </SidebarInset>
          </SidebarProvider>
          <CommandPalette role={role} />
        </CommandPaletteProvider>
        <AiCommandCenter />
      </AiPanelProvider>
    </NotificationsProvider>
  );
}

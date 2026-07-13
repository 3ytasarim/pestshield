"use client";

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { CommandPalette } from "@/components/layout/command-palette";
import { CommandPaletteProvider } from "@/components/layout/command-palette-context";
import { NotificationsProvider } from "@/components/notifications/notifications-context";
import type { Role } from "@/generated/prisma/enums";

interface DashboardShellProps {
  role: Role;
  userName: string;
  userEmail: string;
  children: React.ReactNode;
}

export function DashboardShell({ role, userName, userEmail, children }: DashboardShellProps) {
  return (
    <NotificationsProvider>
      <CommandPaletteProvider>
        <SidebarProvider style={{ "--sidebar-width": "18.75rem" } as React.CSSProperties}>
          <AppSidebar role={role} userName={userName} userEmail={userEmail} />
          <SidebarInset>
            <DashboardHeader />
            <main className="flex flex-1 flex-col gap-4 p-4 md:p-6">{children}</main>
          </SidebarInset>
        </SidebarProvider>
        <CommandPalette role={role} />
      </CommandPaletteProvider>
    </NotificationsProvider>
  );
}

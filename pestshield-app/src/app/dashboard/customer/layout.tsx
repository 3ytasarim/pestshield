import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { CommandPalette } from "@/components/layout/command-palette";
import { CommandPaletteProvider } from "@/components/layout/command-palette-context";
import { SupportNotifier } from "@/components/support/support-notifier";

export default async function CustomerPortalLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "CUSTOMER") {
    redirect("/login");
  }

  const customer = await prisma.customer.findUnique({
    where: { userId: session.user.id },
    select: { ownerId: true },
  });
  if (!customer) {
    redirect("/login");
  }

  const owner = await prisma.user.findUnique({
    where: { id: customer.ownerId },
    select: { logoUrl: true },
  });

  return (
    <CommandPaletteProvider>
      <SupportNotifier href="/dashboard/customer/support" />
      <SidebarProvider style={{ "--sidebar-width": "18.75rem" } as React.CSSProperties}>
        <AppSidebar
          role={session.user.role}
          userName={session.user.name ?? "Müşteri"}
          userEmail={session.user.email ?? ""}
          registeredLogoUrl={owner?.logoUrl ?? null}
        />
        <SidebarInset>
          <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-3 border-b border-border bg-card/95 px-4 backdrop-blur-md sm:px-6">
            <SidebarTrigger />
          </header>
          <main className="flex flex-1 flex-col gap-4 p-4 md:p-6">{children}</main>
        </SidebarInset>
      </SidebarProvider>
      <CommandPalette role={session.user.role} />
    </CommandPaletteProvider>
  );
}

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { CustomerHeader } from "@/components/customer-portal/customer-header";
import { CustomerNavTabs } from "@/components/customer-portal/customer-nav-tabs";
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
    select: { companyName: true, logoUrl: true },
  });

  return (
    <div className="flex min-h-screen flex-col bg-muted/20">
      <SupportNotifier href="/dashboard/customer/support" />
      <CustomerHeader
        companyName={owner?.companyName || "PestShield"}
        companyLogo={owner?.logoUrl ?? null}
        userName={session.user.name ?? "Müşteri"}
      />
      <CustomerNavTabs />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}

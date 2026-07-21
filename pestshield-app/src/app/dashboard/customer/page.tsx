import { redirect } from "next/navigation";
import { LayoutDashboard, ListChecks, Wallet } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GLASS_CARD } from "@/components/dashboard/shared";
import { formatCurrency, formatDate } from "@/components/crm/crm-format";
import { cn } from "@/lib/utils";

export default async function CustomerPortalOverviewPage() {
  const session = await auth();
  const customer = await prisma.customer.findUnique({ where: { userId: session!.user.id } });
  if (!customer) redirect("/login");

  const [openTicketCount, upcomingWorkOrder] = await Promise.all([
    prisma.supportTicket.count({ where: { customerId: customer.id, status: { in: ["open", "answered"] } } }),
    prisma.workOrder.findFirst({
      where: { customerId: customer.id, status: { in: ["planned", "in_progress"] } },
      orderBy: { plannedDate: "asc" },
    }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-[1.75rem] leading-tight font-semibold tracking-tight text-foreground">
          Hoş geldiniz, {customer.companyName}
        </h1>
        <p className="text-sm text-muted-foreground">Hizmetlerinizi, faturalarınızı ve sözleşmelerinizi buradan takip edebilirsiniz.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className={cn(GLASS_CARD, "rounded-2xl")}>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
                <ListChecks className="size-4 text-primary" />
              </div>
              <CardTitle className="text-sm">Sıradaki Servis</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {upcomingWorkOrder ? (
              <>
                <p className="text-lg font-semibold text-foreground">{formatDate(upcomingWorkOrder.plannedDate)}</p>
                <p className="text-xs text-muted-foreground">{upcomingWorkOrder.serviceType}</p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Planlanmış servis yok</p>
            )}
          </CardContent>
        </Card>

        <Card className={cn(GLASS_CARD, "rounded-2xl")}>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-amber-500/10">
                <Wallet className="size-4 text-amber-600 dark:text-amber-400" />
              </div>
              <CardTitle className="text-sm">Bekleyen Tahsilat</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold text-foreground">{formatCurrency(Number(customer.pendingCollection), customer.currency)}</p>
          </CardContent>
        </Card>

        <Card className={cn(GLASS_CARD, "rounded-2xl")}>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-blue-500/10">
                <LayoutDashboard className="size-4 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle className="text-sm">Açık Destek Talebi</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold text-foreground">{openTicketCount}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

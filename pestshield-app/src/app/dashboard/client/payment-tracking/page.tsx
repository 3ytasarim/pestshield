import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { PaymentTrackingPage } from "@/components/finance/payment-tracking-page";
import { serializeCustomer } from "@/lib/crm/serialize";
import { debtorStatus } from "@/lib/finance/serialize";
import { todayStr } from "@/lib/date-utils";

export default async function Page() {
  const session = await auth();
  const ownerId = session!.user.id;
  const today = todayStr();

  const debtorCustomers = await prisma.customer.findMany({
    where: { ownerId, pendingCollection: { gt: 0 } },
  });

  const debtors = await Promise.all(
    debtorCustomers.map(async (c) => {
      const invoices = await prisma.invoice.findMany({
        where: { ownerId, customerId: c.id },
        select: { dueDate: true, status: true },
      });
      const status = debtorStatus(invoices, today);
      return {
        customer: serializeCustomer(c),
        balance: Number(c.pendingCollection),
        overdue: status.overdue,
        days: status.days,
        dueDate: status.dueDate,
      };
    }),
  );

  return <PaymentTrackingPage initialDebtors={debtors} />;
}

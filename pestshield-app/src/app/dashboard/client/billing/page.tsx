import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { InvoicesPage } from "@/components/finance/invoices-page";
import { serializeInvoice } from "@/lib/finance/serialize";

export default async function Page() {
  const session = await auth();
  const ownerId = session!.user.id;

  const [invoices, customers] = await Promise.all([
    prisma.invoice.findMany({
      where: { ownerId },
      include: { customer: { select: { id: true, companyName: true } } },
      orderBy: { issueDate: "desc" },
    }),
    prisma.customer.findMany({ where: { ownerId }, select: { id: true, companyName: true }, orderBy: { companyName: "asc" } }),
  ]);

  return (
    <InvoicesPage
      initialInvoices={invoices.map((i) => ({ ...serializeInvoice(i), customer: i.customer }))}
      customers={customers}
    />
  );
}

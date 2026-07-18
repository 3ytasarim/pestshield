import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { CurrentAccountPage } from "@/components/finance/current-account-page";
import { serializeInvoice, serializeCollection } from "@/lib/finance/serialize";
import { serializeCustomer } from "@/lib/crm/serialize";

export default async function Page() {
  const session = await auth();
  const ownerId = session!.user.id;

  const [customers, invoices, collections] = await Promise.all([
    prisma.customer.findMany({ where: { ownerId }, orderBy: { companyName: "asc" } }),
    prisma.invoice.findMany({ where: { ownerId } }),
    prisma.collection.findMany({ where: { ownerId } }),
  ]);

  return (
    <CurrentAccountPage
      initialCustomers={customers.map(serializeCustomer)}
      initialInvoices={invoices.map(serializeInvoice)}
      initialCollections={collections.map(serializeCollection)}
    />
  );
}

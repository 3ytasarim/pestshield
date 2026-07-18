import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { CustomerManagementPage } from "@/components/crm/customer-management-page";
import { serializeCustomer } from "@/lib/crm/serialize";

export default async function CustomersPage() {
  const session = await auth();
  const ownerId = session!.user.id;

  const [customers, contracts, pendingOffers] = await Promise.all([
    prisma.customer.findMany({ where: { ownerId }, orderBy: { createdAt: "desc" } }),
    prisma.contract.findMany({ where: { ownerId }, orderBy: { startDate: "desc" } }),
    prisma.offer.findMany({ where: { ownerId, status: "sent" }, select: { customerId: true } }),
  ]);

  const contractStatusByCustomer: Record<string, (typeof contracts)[number]["status"]> = {};
  for (const contract of contracts) {
    if (!(contract.customerId in contractStatusByCustomer)) {
      contractStatusByCustomer[contract.customerId] = contract.status;
    }
  }

  return (
    <CustomerManagementPage
      initialCustomers={customers.map(serializeCustomer)}
      contractStatusByCustomer={contractStatusByCustomer}
      pendingOfferCustomerIds={pendingOffers.map((o) => o.customerId)}
    />
  );
}

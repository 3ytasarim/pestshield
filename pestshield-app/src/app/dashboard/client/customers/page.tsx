import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { getSessionPermissions } from "@/lib/api-auth";
import { CustomerManagementPage } from "@/components/crm/customer-management-page";
import { serializeCustomer } from "@/lib/crm/serialize";

export default async function CustomersPage() {
  const session = await auth();
  const ownerId = session!.user.id;
  const permissions = await getSessionPermissions();
  const canCreate = permissions?.can("/dashboard/client/customers", "create") ?? true;
  const canEdit = permissions?.can("/dashboard/client/customers", "edit") ?? true;
  const canDelete = permissions?.can("/dashboard/client/customers", "delete") ?? true;

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
      canCreate={canCreate}
      canEdit={canEdit}
      canDelete={canDelete}
    />
  );
}

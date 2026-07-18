import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { ContractsPage } from "@/components/crm/contracts-page";
import { serializeContract } from "@/lib/crm/serialize";

export default async function Page() {
  const session = await auth();
  const contracts = await prisma.contract.findMany({
    where: { ownerId: session!.user.id },
    include: { customer: { select: { id: true, companyName: true } } },
    orderBy: { startDate: "desc" },
  });

  return (
    <ContractsPage
      initialContracts={contracts.map((c) => ({ ...serializeContract(c), customer: c.customer }))}
    />
  );
}

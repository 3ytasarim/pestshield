import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { RiskManagementPage } from "@/components/audit/risk-management-page";
import { serializeRisk } from "@/lib/audit/serialize";

export default async function Page() {
  const session = await auth();
  const ownerId = session!.user.id;

  const [risks, customers] = await Promise.all([
    prisma.risk.findMany({ where: { ownerId }, orderBy: { reviewDate: "desc" } }),
    prisma.customer.findMany({ where: { ownerId }, select: { id: true, companyName: true }, orderBy: { companyName: "asc" } }),
  ]);

  return <RiskManagementPage initialRisks={risks.map(serializeRisk)} customers={customers} />;
}

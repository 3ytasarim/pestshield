import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { RiskReportPage } from "@/components/reports/risk-report-page";
import { serializeRisk } from "@/lib/audit/serialize";

export default async function Page() {
  const session = await auth();
  const ownerId = session!.user.id;

  const [risks, customers] = await Promise.all([
    prisma.risk.findMany({ where: { ownerId }, orderBy: { reviewDate: "desc" } }),
    prisma.customer.findMany({ where: { ownerId }, select: { id: true, companyName: true }, orderBy: { companyName: "asc" } }),
  ]);

  return <RiskReportPage initialRisks={risks.map(serializeRisk)} customers={customers} />;
}

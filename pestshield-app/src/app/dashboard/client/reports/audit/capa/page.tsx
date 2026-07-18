import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { CapaReportPage } from "@/components/reports/capa-report-page";
import { serializeCorrectiveAction } from "@/lib/audit/serialize";

export default async function Page() {
  const session = await auth();
  const ownerId = session!.user.id;

  const [capas, customers] = await Promise.all([
    prisma.correctiveAction.findMany({ where: { ownerId }, orderBy: { createdDate: "desc" } }),
    prisma.customer.findMany({ where: { ownerId }, select: { id: true, companyName: true }, orderBy: { companyName: "asc" } }),
  ]);

  return <CapaReportPage initialCapas={capas.map(serializeCorrectiveAction)} customers={customers} />;
}

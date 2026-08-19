import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { UygunlukReportPage } from "@/components/reports/uygunluk-report-page";
import { ensureChecklistSeeded, serializeChecklistItem } from "@/lib/audit/serialize";

export default async function Page() {
  const session = await auth();
  const ownerId = session!.user.id;

  await ensureChecklistSeeded(prisma, ownerId);
  const [items, customers] = await Promise.all([
    prisma.complianceChecklistItem.findMany({ where: { ownerId, customerId: null }, orderBy: { id: "asc" } }),
    prisma.customer.findMany({ where: { ownerId }, select: { id: true, companyName: true }, orderBy: { companyName: "asc" } }),
  ]);

  return <UygunlukReportPage initialItems={items.map(serializeChecklistItem)} customers={customers} />;
}

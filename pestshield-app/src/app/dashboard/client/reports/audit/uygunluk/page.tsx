import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { UygunlukReportPage } from "@/components/reports/uygunluk-report-page";
import { ensureChecklistSeeded, serializeChecklistItem } from "@/lib/audit/serialize";

export default async function Page() {
  const session = await auth();
  const ownerId = session!.user.id;

  await ensureChecklistSeeded(prisma, ownerId);
  const items = await prisma.complianceChecklistItem.findMany({ where: { ownerId }, orderBy: { id: "asc" } });

  return <UygunlukReportPage initialItems={items.map(serializeChecklistItem)} />;
}

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { StandardCompliancePage } from "@/components/audit/standard-compliance-page";
import { ensureChecklistSeeded, serializeChecklistItem } from "@/lib/audit/serialize";

export default async function Page() {
  const session = await auth();
  const ownerId = session!.user.id;

  await ensureChecklistSeeded(prisma, ownerId);
  const items = await prisma.complianceChecklistItem.findMany({ where: { ownerId, standard: "brcgs" }, orderBy: { id: "asc" } });

  return <StandardCompliancePage standard="brcgs" initialItems={items.map(serializeChecklistItem)} />;
}

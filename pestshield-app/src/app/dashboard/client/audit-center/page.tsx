import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { AuditCenterPage } from "@/components/audit/audit-center-page";
import { ensureChecklistSeeded, serializeAuditRecord, serializeChecklistItem, serializeCorrectiveAction } from "@/lib/audit/serialize";

export default async function Page() {
  const session = await auth();
  const ownerId = session!.user.id;

  await ensureChecklistSeeded(prisma, ownerId);

  const [checklistItems, correctiveActions, auditRecords, customers] = await Promise.all([
    prisma.complianceChecklistItem.findMany({ where: { ownerId }, orderBy: { id: "asc" } }),
    prisma.correctiveAction.findMany({ where: { ownerId }, orderBy: { createdDate: "desc" } }),
    prisma.auditRecord.findMany({ where: { ownerId }, orderBy: { scheduledDate: "asc" } }),
    prisma.customer.findMany({ where: { ownerId }, select: { id: true, companyName: true }, orderBy: { companyName: "asc" } }),
  ]);

  return (
    <AuditCenterPage
      checklistItems={checklistItems.map(serializeChecklistItem)}
      correctiveActions={correctiveActions.map(serializeCorrectiveAction)}
      auditRecords={auditRecords.map(serializeAuditRecord)}
      customers={customers}
    />
  );
}

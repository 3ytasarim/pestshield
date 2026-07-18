import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { CheckpointsPage } from "@/components/operations/checkpoints-page";
import { serializeChecklistTemplate } from "@/lib/operations/serialize";

export default async function Page() {
  const session = await auth();
  const templates = await prisma.checklistTemplate.findMany({
    where: { ownerId: session!.user.id },
    orderBy: { title: "asc" },
  });

  return <CheckpointsPage initialTemplates={templates.map(serializeChecklistTemplate)} />;
}

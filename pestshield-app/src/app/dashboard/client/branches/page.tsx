import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { BranchesPage } from "@/components/crm/branches-page";

export default async function Page() {
  const session = await auth();
  const branches = await prisma.branch.findMany({
    where: { ownerId: session!.user.id },
    include: { customer: { select: { id: true, companyName: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <BranchesPage
      initialBranches={branches.map(({ ownerId: _ownerId, ...b }) => b)}
    />
  );
}

import { prisma } from "@/lib/db";
import { AdminCompaniesPage } from "@/components/admin/admin-companies-page";

export default async function CompaniesPage() {
  const [companies, codes, plans] = await Promise.all([
    prisma.user.findMany({
      where: { role: "CLIENT" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        companyName: true,
        address: true,
        phone: true,
        logoUrl: true,
        licenseType: true,
        licenseExpiresAt: true,
        createdAt: true,
        isActive: true,
        planId: true,
        extraModules: true,
        plan: { select: { name: true } },
        _count: { select: { customers: true, companyUsersOwned: true, techniciansOwned: true } },
      },
    }),
    prisma.licenseCode.findMany({
      orderBy: { createdAt: "desc" },
      take: 30,
      include: {
        targetUser: { select: { companyName: true, name: true, email: true } },
      },
    }),
    prisma.plan.findMany({ orderBy: { createdAt: "asc" } }),
  ]);

  return (
    <AdminCompaniesPage
      companies={companies.map((c) => ({
        ...c,
        licenseExpiresAt: c.licenseExpiresAt?.toISOString() ?? null,
        createdAt: c.createdAt.toISOString(),
        planName: c.plan?.name ?? null,
        userCount: 1 + c._count.companyUsersOwned + c._count.techniciansOwned,
        customerCount: c._count.customers,
      }))}
      codes={codes.map((c) => ({
        ...c,
        createdAt: c.createdAt.toISOString(),
        redeemedAt: c.redeemedAt?.toISOString() ?? null,
      }))}
      plans={plans.map((p) => ({ id: p.id, key: p.key, name: p.name }))}
    />
  );
}

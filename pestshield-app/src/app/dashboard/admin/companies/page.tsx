import { prisma } from "@/lib/db";
import { AdminCompaniesPage } from "@/components/admin/admin-companies-page";

export default async function CompaniesPage() {
  const [companies, codes] = await Promise.all([
    prisma.user.findMany({
      where: { role: "CLIENT" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        companyName: true,
        licenseType: true,
        licenseExpiresAt: true,
        createdAt: true,
        isActive: true,
      },
    }),
    prisma.licenseCode.findMany({
      orderBy: { createdAt: "desc" },
      take: 30,
      include: {
        targetUser: { select: { companyName: true, name: true, email: true } },
      },
    }),
  ]);

  return (
    <AdminCompaniesPage
      companies={companies.map((c) => ({
        ...c,
        licenseExpiresAt: c.licenseExpiresAt?.toISOString() ?? null,
        createdAt: c.createdAt.toISOString(),
      }))}
      codes={codes.map((c) => ({
        ...c,
        createdAt: c.createdAt.toISOString(),
        redeemedAt: c.redeemedAt?.toISOString() ?? null,
      }))}
    />
  );
}

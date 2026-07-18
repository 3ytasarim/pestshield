import { auth } from "@/auth";
import { Building2, ShieldAlert, ShieldCheck } from "lucide-react";
import { StatCard } from "@/components/layout/stat-card";
import { OverviewChart } from "@/components/dashboard/overview-chart";
import { RecentUsersTable } from "@/components/dashboard/recent-users-table";
import { prisma } from "@/lib/db";
import { computeLicenseStatus } from "@/lib/license";

export default async function AdminDashboardPage() {
  const session = await auth();

  const companies = await prisma.user.findMany({
    where: { role: "CLIENT" },
    select: { licenseExpiresAt: true },
  });

  const totalCompanies = companies.length;
  const expiringSoon = companies.filter(
    (c) => computeLicenseStatus(c.licenseExpiresAt) === "EXPIRING_SOON",
  ).length;
  const expired = companies.filter(
    (c) => computeLicenseStatus(c.licenseExpiresAt) === "EXPIRED",
  ).length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Hoş geldiniz, {session?.user?.name}</h1>
        <p className="text-sm text-muted-foreground">PestShield yönetim özeti</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Toplam Firma" value={String(totalCompanies)} icon={Building2} />
        <StatCard label="Lisansı Yakında Dolan" value={String(expiringSoon)} icon={ShieldAlert} />
        <StatCard label="Lisansı Dolmuş" value={String(expired)} icon={ShieldCheck} />
      </div>

      <OverviewChart />
      <RecentUsersTable />
    </div>
  );
}

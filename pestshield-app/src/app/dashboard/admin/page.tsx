import { auth } from "@/auth";
import { Building2, ShieldCheck, Users } from "lucide-react";
import { StatCard } from "@/components/layout/stat-card";
import { OverviewChart } from "@/components/dashboard/overview-chart";
import { RecentUsersTable } from "@/components/dashboard/recent-users-table";

export default async function AdminDashboardPage() {
  const session = await auth();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Hoş geldiniz, {session?.user?.name}</h1>
        <p className="text-sm text-muted-foreground">PestShield yönetim özeti</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Toplam Firma" value="0" icon={Building2} />
        <StatCard label="Toplam Kullanıcı" value="0" icon={Users} />
        <StatCard label="Aktif Cihaz" value="0" icon={ShieldCheck} />
      </div>

      <OverviewChart />
      <RecentUsersTable />
    </div>
  );
}

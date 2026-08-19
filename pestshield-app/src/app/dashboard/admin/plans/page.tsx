import { ensurePlansSeeded } from "@/lib/plan-seed";
import { AdminPlansPage } from "@/components/admin/admin-plans-page";

export default async function PlansPage() {
  const plans = await ensurePlansSeeded();

  return (
    <AdminPlansPage
      initialPlans={plans.map((p) => ({
        key: p.key,
        name: p.name,
        maxUsers: p.maxUsers,
        maxCustomers: p.maxCustomers,
        allowedModules: p.allowedModules,
      }))}
    />
  );
}

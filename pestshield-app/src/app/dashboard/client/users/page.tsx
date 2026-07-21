import { ShieldAlert } from "lucide-react";
import { getSessionPermissions } from "@/lib/api-auth";
import { CompanyUsersPage } from "@/components/system/company-users-page";
import { EmptyState } from "@/components/crm/detail/empty-state";

export default async function Page() {
  const permissions = await getSessionPermissions();
  const allowed = !permissions || permissions.visibleNavHrefs === null || permissions.visibleNavHrefs.includes("/dashboard/client/users");

  if (!allowed) {
    return <EmptyState icon={ShieldAlert} title="Yetkiniz bulunmuyor" description="Bu sayfayı görüntülemek için firma yöneticinizle iletişime geçin." />;
  }

  return <CompanyUsersPage />;
}

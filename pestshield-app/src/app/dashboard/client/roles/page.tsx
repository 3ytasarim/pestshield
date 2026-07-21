import { ShieldAlert } from "lucide-react";
import { getSessionPermissions } from "@/lib/api-auth";
import { CompanyRolesPage } from "@/components/system/company-roles-page";
import { EmptyState } from "@/components/crm/detail/empty-state";

export default async function Page() {
  const permissions = await getSessionPermissions();
  const allowed = !permissions || permissions.visibleNavHrefs === null || permissions.visibleNavHrefs.includes("/dashboard/client/roles");

  if (!allowed) {
    return <EmptyState icon={ShieldAlert} title="Yetkiniz bulunmuyor" description="Bu sayfayı görüntülemek için firma yöneticinizle iletişime geçin." />;
  }

  return <CompanyRolesPage viewerCompanyRoleId={permissions?.companyRoleId ?? null} />;
}

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getSessionPermissions } from "@/lib/api-auth";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { prisma } from "@/lib/db";
import { getAllowedModuleHrefs } from "@/lib/plan-limits";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role === "TECH" || session.user.role === "CUSTOMER") {
    return <>{children}</>;
  }

  const permissions = session.user.role === "CLIENT" ? await getSessionPermissions() : null;

  // Standalone dağıtımlarda sidebar'da PestShield yerine firma kendi logosunu
  // görsün diye — session.user.id her zaman kiracı sahibinin id'si (alt
  // kullanıcı girişinde bile), bu yüzden ekstra owner lookup gerekmiyor.
  const owner =
    session.user.role === "CLIENT"
      ? await prisma.user.findUnique({ where: { id: session.user.id }, select: { logoUrl: true } })
      : null;

  // Paket bazlı modül kısıtlaması (SADECE multi-tenant'ta anlamlı) RBAC'ın
  // visibleNavHrefs'iyle kesiştirilir — plan atanmamışsa/standalone'daysa
  // getAllowedModuleHrefs null döner ve RBAC sonucu hiç değişmeden kullanılır.
  const planHrefs = session.user.role === "CLIENT" ? await getAllowedModuleHrefs(session.user.id) : null;
  const rbacHrefs = permissions?.visibleNavHrefs ?? null;
  const visibleNavHrefs =
    planHrefs === null ? rbacHrefs : rbacHrefs === null ? planHrefs : rbacHrefs.filter((h) => planHrefs.includes(h));

  return (
    <DashboardShell
      role={session.user.role}
      userName={session.user.name ?? "Kullanıcı"}
      userEmail={session.user.email ?? ""}
      visibleNavHrefs={visibleNavHrefs}
      registeredLogoUrl={owner?.logoUrl ?? null}
    >
      {children}
    </DashboardShell>
  );
}

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getSessionPermissions } from "@/lib/api-auth";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { prisma } from "@/lib/db";

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

  return (
    <DashboardShell
      role={session.user.role}
      userName={session.user.name ?? "Kullanıcı"}
      userEmail={session.user.email ?? ""}
      visibleNavHrefs={permissions?.visibleNavHrefs ?? null}
      registeredLogoUrl={owner?.logoUrl ?? null}
    >
      {children}
    </DashboardShell>
  );
}

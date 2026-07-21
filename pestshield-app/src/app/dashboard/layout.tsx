import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getSessionPermissions } from "@/lib/api-auth";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role === "TECH") {
    return <>{children}</>;
  }

  const permissions = session.user.role === "CLIENT" ? await getSessionPermissions() : null;

  return (
    <DashboardShell
      role={session.user.role}
      userName={session.user.name ?? "Kullanıcı"}
      userEmail={session.user.email ?? ""}
      visibleNavHrefs={permissions?.visibleNavHrefs ?? null}
    >
      {children}
    </DashboardShell>
  );
}

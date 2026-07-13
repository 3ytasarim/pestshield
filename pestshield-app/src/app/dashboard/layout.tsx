import { redirect } from "next/navigation";
import { auth } from "@/auth";
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

  return (
    <DashboardShell
      role={session.user.role}
      userName={session.user.name ?? "Kullanıcı"}
      userEmail={session.user.email ?? ""}
    >
      {children}
    </DashboardShell>
  );
}

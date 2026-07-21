import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { SupportTicketsPanel } from "@/components/support/support-tickets-panel";

export default async function AdminSupportPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-[1.75rem] leading-tight font-semibold tracking-tight text-foreground">Destek Talepleri</h1>
        <p className="text-sm text-muted-foreground">İlaçlama firmalarının size doğrudan açtığı destek talepleri.</p>
      </div>

      <SupportTicketsPanel
        viewerUserId={session.user.id}
        openedByRoleFilter="CLIENT"
        canCreate={false}
        title="Firma Talepleri"
        emptyDescription="Henüz hiçbir firma destek talebi açmadı."
        showOwnerCompany
      />
    </div>
  );
}

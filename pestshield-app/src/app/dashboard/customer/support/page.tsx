import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { SupportTicketsPanel } from "@/components/support/support-tickets-panel";

export default async function CustomerPortalSupportPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <SupportTicketsPanel
      viewerUserId={session.user.id}
      canCreate
      title="Destek"
      emptyDescription="Bir sorunuz mu var? Yeni Talep ile bize ulaşabilirsiniz."
    />
  );
}

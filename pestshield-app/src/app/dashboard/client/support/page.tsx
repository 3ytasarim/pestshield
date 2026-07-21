import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { SupportTicketsPanel } from "@/components/support/support-tickets-panel";

export default async function ClientSupportPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-[1.75rem] leading-tight font-semibold tracking-tight text-foreground">Destek Mesajları</h1>
        <p className="text-sm text-muted-foreground">Müşterilerinizden gelen destek taleplerini yanıtlayın veya Superadmin&apos;e ulaşın.</p>
      </div>

      <Tabs defaultValue="customer">
        <TabsList>
          <TabsTrigger value="customer">Müşteri Talepleri</TabsTrigger>
          <TabsTrigger value="admin">Bize Yazın</TabsTrigger>
        </TabsList>
        <TabsContent value="customer">
          <SupportTicketsPanel
            viewerUserId={session.user.id}
            openedByRoleFilter="CUSTOMER"
            canCreate={false}
            title="Müşteri Talepleri"
            emptyDescription="Müşterilerinizden henüz bir destek talebi gelmedi."
            showCustomerName
          />
        </TabsContent>
        <TabsContent value="admin">
          <SupportTicketsPanel
            viewerUserId={session.user.id}
            openedByRoleFilter="CLIENT"
            canCreate
            title="Superadmin'e Yazın"
            emptyDescription="PestShield ekibine henüz bir destek talebi açmadınız."
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

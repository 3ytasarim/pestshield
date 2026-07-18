import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { ContactsPage } from "@/components/crm/contacts-page";

export default async function Page() {
  const session = await auth();
  const contacts = await prisma.contact.findMany({
    where: { ownerId: session!.user.id },
    include: { customer: { select: { id: true, companyName: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <ContactsPage
      initialContacts={contacts.map(({ ownerId: _ownerId, ...c }) => c)}
    />
  );
}

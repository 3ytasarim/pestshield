import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { supportTicketMessageFormSchema } from "@/lib/validations/support";

/**
 * Bir talebe mesaj ekler. Görünürlük kuralları GET /api/support/tickets ile
 * birebir aynı: CUSTOMER kendi açtığı talebe, CLIENT kendi ownerId'sindeki
 * (müşteriden gelen veya Superadmin'e açtığı) talebe, ADMIN sadece
 * openedByRole=CLIENT talebe yazabilir. Cevaplayan taraf "answered", talebi
 * açan taraf tekrar yazarsa "open" durumuna döner.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: "Yetkiniz yok." }, { status: 403 });
  }
  const { id } = await params;

  const ticket = await prisma.supportTicket.findUnique({ where: { id } });
  if (!ticket) {
    return NextResponse.json({ message: "Talep bulunamadı." }, { status: 404 });
  }

  const role = session.user.role;
  let authorized = false;
  let nextStatus: "open" | "answered" = "open";

  if (role === "CUSTOMER") {
    const customer = await prisma.customer.findUnique({ where: { userId: session.user.id } });
    authorized = !!customer && ticket.customerId === customer.id;
    nextStatus = "open";
  } else if (role === "CLIENT") {
    authorized = ticket.ownerId === session.user.id;
    nextStatus = ticket.openedByRole === "CUSTOMER" ? "answered" : "open";
  } else if (role === "ADMIN") {
    authorized = ticket.openedByRole === "CLIENT";
    nextStatus = "answered";
  }

  if (!authorized) {
    return NextResponse.json({ message: "Yetkiniz yok." }, { status: 403 });
  }

  const parsed = supportTicketMessageFormSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Geçersiz istek" }, { status: 400 });
  }

  const [message] = await prisma.$transaction([
    prisma.supportTicketMessage.create({
      data: { ticketId: id, authorUserId: session.user.id, authorRole: role, body: parsed.data.body },
    }),
    prisma.supportTicket.update({ where: { id }, data: { status: nextStatus } }),
  ]);

  return NextResponse.json({ message });
}

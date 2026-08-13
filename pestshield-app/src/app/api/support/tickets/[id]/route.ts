import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { supportTicketEditFormSchema } from "@/lib/validations/support";

/** Görünürlük/yetki kuralları GET /api/support/tickets ve mesaj ekleme ucuyla birebir aynıdır. */
async function resolveAuthorization(ticketId: string, userId: string, role: string) {
  const ticket = await prisma.supportTicket.findUnique({ where: { id: ticketId } });
  if (!ticket) return { ticket: null, authorized: false };

  let authorized = false;
  if (role === "CUSTOMER") {
    const customer = await prisma.customer.findUnique({ where: { userId } });
    authorized = !!customer && ticket.customerId === customer.id;
  } else if (role === "CLIENT") {
    authorized = ticket.ownerId === userId;
  } else if (role === "ADMIN") {
    authorized = ticket.openedByRole === "CLIENT";
  }
  return { ticket, authorized };
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: "Yetkiniz yok." }, { status: 403 });
  }
  const { id } = await params;

  const { ticket, authorized } = await resolveAuthorization(id, session.user.id, session.user.role);
  if (!ticket) {
    return NextResponse.json({ message: "Talep bulunamadı." }, { status: 404 });
  }
  if (!authorized) {
    return NextResponse.json({ message: "Yetkiniz yok." }, { status: 403 });
  }

  const parsed = supportTicketEditFormSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Geçersiz istek" }, { status: 400 });
  }

  const updated = await prisma.supportTicket.update({
    where: { id },
    data: { subject: parsed.data.subject },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
      customer: { select: { id: true, companyName: true } },
      owner: { select: { id: true, companyName: true } },
    },
  });
  return NextResponse.json({ ticket: updated });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: "Yetkiniz yok." }, { status: 403 });
  }
  const { id } = await params;

  const { ticket, authorized } = await resolveAuthorization(id, session.user.id, session.user.role);
  if (!ticket) {
    return NextResponse.json({ message: "Talep bulunamadı." }, { status: 404 });
  }
  if (!authorized) {
    return NextResponse.json({ message: "Yetkiniz yok." }, { status: 403 });
  }

  await prisma.supportTicket.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

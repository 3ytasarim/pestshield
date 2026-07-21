import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { supportTicketFormSchema } from "@/lib/validations/support";

const TICKET_INCLUDE = {
  messages: { orderBy: { createdAt: "asc" as const } },
  customer: { select: { id: true, companyName: true } },
  owner: { select: { id: true, companyName: true } },
} as const;

/**
 * Rol bazlı görünürlük: CUSTOMER sadece kendi açtığı talepleri, CLIENT hem
 * kendisine açılan müşteri taleplerini hem de Superadmin'e açtığı talepleri
 * (ownerId her iki durumda da kendisi), ADMIN sadece firmaların Superadmin'e
 * açtığı talepleri (openedByRole=CLIENT) görür.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: "Yetkiniz yok." }, { status: 403 });
  }

  if (session.user.role === "CUSTOMER") {
    const customer = await prisma.customer.findUnique({ where: { userId: session.user.id } });
    if (!customer) {
      return NextResponse.json({ message: "Müşteri kaydı bulunamadı." }, { status: 403 });
    }
    const tickets = await prisma.supportTicket.findMany({
      where: { customerId: customer.id, openedByRole: "CUSTOMER" },
      include: TICKET_INCLUDE,
      orderBy: { updatedAt: "desc" },
    });
    return NextResponse.json({ tickets });
  }

  if (session.user.role === "CLIENT") {
    const tickets = await prisma.supportTicket.findMany({
      where: { ownerId: session.user.id },
      include: TICKET_INCLUDE,
      orderBy: { updatedAt: "desc" },
    });
    return NextResponse.json({ tickets });
  }

  if (session.user.role === "ADMIN") {
    const tickets = await prisma.supportTicket.findMany({
      where: { openedByRole: "CLIENT" },
      include: TICKET_INCLUDE,
      orderBy: { updatedAt: "desc" },
    });
    return NextResponse.json({ tickets });
  }

  return NextResponse.json({ message: "Yetkiniz yok." }, { status: 403 });
}

/** Yeni destek talebi + ilk mesaj oluşturur. ADMIN talep açamaz, sadece cevaplar. */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user || (session.user.role !== "CUSTOMER" && session.user.role !== "CLIENT")) {
    return NextResponse.json({ message: "Yetkiniz yok." }, { status: 403 });
  }

  const body = await request.json();
  const parsed = supportTicketFormSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Geçersiz istek" }, { status: 400 });
  }

  if (session.user.role === "CUSTOMER") {
    const customer = await prisma.customer.findUnique({ where: { userId: session.user.id } });
    if (!customer) {
      return NextResponse.json({ message: "Müşteri kaydı bulunamadı." }, { status: 403 });
    }
    const ticket = await prisma.supportTicket.create({
      data: {
        ownerId: customer.ownerId,
        openedByRole: "CUSTOMER",
        openedByUserId: session.user.id,
        customerId: customer.id,
        subject: parsed.data.subject,
        messages: { create: { authorUserId: session.user.id, authorRole: "CUSTOMER", body: parsed.data.body } },
      },
      include: TICKET_INCLUDE,
    });
    return NextResponse.json({ ticket });
  }

  const ticket = await prisma.supportTicket.create({
    data: {
      ownerId: session.user.id,
      openedByRole: "CLIENT",
      openedByUserId: session.user.id,
      subject: parsed.data.subject,
      messages: { create: { authorUserId: session.user.id, authorRole: "CLIENT", body: parsed.data.body } },
    },
    include: TICKET_INCLUDE,
  });
  return NextResponse.json({ ticket });
}

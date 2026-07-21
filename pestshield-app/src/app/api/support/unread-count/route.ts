import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

const EPOCH = new Date(0);

/**
 * Bildirim/ses polling'i için hafif uç nokta. `since` (ISO tarih) parametresinden
 * yeni, kendi yazmadığı mesaj sayısını döner. Ekstra "okundu" tablosu/alanı
 * gerektirmez — istemci son görülen zamanı kendi tarafında (localStorage) tutar.
 */
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: "Yetkiniz yok." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const sinceParam = searchParams.get("since");
  const since = sinceParam && !Number.isNaN(Date.parse(sinceParam)) ? new Date(sinceParam) : EPOCH;

  const role = session.user.role;

  if (role === "CUSTOMER") {
    const customer = await prisma.customer.findUnique({ where: { userId: session.user.id } });
    if (!customer) return NextResponse.json({ count: 0 });
    const count = await prisma.supportTicketMessage.count({
      where: {
        createdAt: { gt: since },
        authorUserId: { not: session.user.id },
        ticket: { customerId: customer.id, openedByRole: "CUSTOMER" },
      },
    });
    return NextResponse.json({ count });
  }

  if (role === "CLIENT") {
    const count = await prisma.supportTicketMessage.count({
      where: {
        createdAt: { gt: since },
        authorUserId: { not: session.user.id },
        ticket: { ownerId: session.user.id },
      },
    });
    return NextResponse.json({ count });
  }

  if (role === "ADMIN") {
    const count = await prisma.supportTicketMessage.count({
      where: {
        createdAt: { gt: since },
        authorUserId: { not: session.user.id },
        ticket: { openedByRole: "CLIENT" },
      },
    });
    return NextResponse.json({ count });
  }

  return NextResponse.json({ count: 0 });
}

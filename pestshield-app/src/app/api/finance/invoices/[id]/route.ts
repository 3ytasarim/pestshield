import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireClientOwner } from "@/lib/api-auth";
import { invoiceFormSchema } from "@/lib/validations/finance";
import { serializeInvoice } from "@/lib/finance/serialize";
import { todayStr } from "@/lib/date-utils";

/**
 * Fatura tutarı/vadesi/müşterisi customer.pendingCollection önbelleğini besler
 * (bkz. POST /api/finance/invoices) — düzenleme/silme bu önbelleği de doğru
 * şekilde günceller (eski tutarı geri al, yeniyi uygula; müşteri değiştiyse
 * her iki müşteride de).
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;
  const { id } = await params;

  const existing = await prisma.invoice.findFirst({ where: { id, ownerId } });
  if (!existing) {
    return NextResponse.json({ message: "Fatura bulunamadı." }, { status: 404 });
  }

  const parsed = invoiceFormSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Geçersiz istek" }, { status: 400 });
  }

  const { customerId, description, amount, issueDate, dueDate } = parsed.data;
  const customer = await prisma.customer.findFirst({ where: { id: customerId, ownerId } });
  if (!customer) {
    return NextResponse.json({ message: "Müşteri bulunamadı." }, { status: 404 });
  }

  const status = dueDate < todayStr() ? "overdue" : "pending";
  const oldAmount = Number(existing.amount);

  const invoiceUpdate = prisma.invoice.update({
    where: { id },
    data: { customerId, invoiceNo: existing.invoiceNo, issueDate, dueDate, amount, status, description },
  });

  const [invoice] =
    customerId === existing.customerId
      ? await prisma.$transaction([
          invoiceUpdate,
          prisma.customer.update({
            where: { id: customerId },
            data: { pendingCollection: { increment: amount - oldAmount } },
          }),
        ])
      : await prisma.$transaction([
          invoiceUpdate,
          prisma.customer.update({ where: { id: existing.customerId }, data: { pendingCollection: { decrement: oldAmount } } }),
          prisma.customer.update({ where: { id: customerId }, data: { pendingCollection: { increment: amount } } }),
        ]);
  return NextResponse.json({ invoice: serializeInvoice(invoice) });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;
  const { id } = await params;

  const existing = await prisma.invoice.findFirst({ where: { id, ownerId } });
  if (!existing) {
    return NextResponse.json({ message: "Fatura bulunamadı." }, { status: 404 });
  }

  await prisma.$transaction([
    prisma.invoice.delete({ where: { id } }),
    prisma.customer.update({
      where: { id: existing.customerId },
      data: { pendingCollection: { decrement: Number(existing.amount) } },
    }),
  ]);

  return NextResponse.json({ success: true });
}

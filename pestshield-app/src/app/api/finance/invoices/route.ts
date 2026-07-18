import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireClientOwner } from "@/lib/api-auth";
import { invoiceFormSchema } from "@/lib/validations/finance";
import { serializeInvoice } from "@/lib/finance/serialize";
import { todayStr } from "@/lib/date-utils";

export async function GET(request: Request) {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;

  const url = new URL(request.url);
  const customerId = url.searchParams.get("customerId");

  const invoices = await prisma.invoice.findMany({
    where: { ownerId, ...(customerId ? { customerId } : {}) },
    orderBy: { issueDate: "desc" },
  });
  return NextResponse.json({ invoices: invoices.map(serializeInvoice) });
}

export async function POST(request: Request) {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;

  const parsed = invoiceFormSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Geçersiz istek" }, { status: 400 });
  }

  const { customerId, description, amount, issueDate, dueDate } = parsed.data;
  const customer = await prisma.customer.findFirst({ where: { id: customerId, ownerId } });
  if (!customer) {
    return NextResponse.json({ message: "Müşteri bulunamadı." }, { status: 404 });
  }

  const year = new Date(issueDate).getFullYear();
  const countThisYear = await prisma.invoice.count({
    where: { ownerId, invoiceNo: { startsWith: `FTR-${year}-` } },
  });
  const invoiceNo = `FTR-${year}-${String(countThisYear + 1).padStart(4, "0")}`;
  const status = dueDate < todayStr() ? "overdue" : "pending";

  const [invoice] = await prisma.$transaction([
    prisma.invoice.create({
      data: { ownerId, customerId, invoiceNo, issueDate, dueDate, amount, status, description },
    }),
    prisma.customer.update({
      where: { id: customerId },
      data: { pendingCollection: { increment: amount } },
    }),
  ]);

  return NextResponse.json({ invoice: serializeInvoice(invoice) }, { status: 201 });
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireCustomerOwner } from "@/lib/api-auth";
import { serializeInvoice, serializeCollection, computeLedger } from "@/lib/finance/serialize";

/** Müşteri portalı — sadece oturumdaki müşterinin kendi fatura/tahsilat defterini (cari hesap) döner. */
export async function GET() {
  const { customerId, ownerId, error } = await requireCustomerOwner();
  if (error) return error;

  const [invoices, collections] = await Promise.all([
    prisma.invoice.findMany({ where: { ownerId, customerId }, orderBy: { issueDate: "desc" } }),
    prisma.collection.findMany({ where: { ownerId, customerId }, orderBy: { date: "desc" } }),
  ]);

  const serializedInvoices = invoices.map(serializeInvoice);
  const serializedCollections = collections.map(serializeCollection);
  const ledger = computeLedger(serializedInvoices, serializedCollections);

  return NextResponse.json({ invoices: serializedInvoices, collections: serializedCollections, ledger });
}

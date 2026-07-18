import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireClientOwner } from "@/lib/api-auth";
import { serializeBankTransaction } from "@/lib/finance/serialize";

export async function GET(request: Request) {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;

  const url = new URL(request.url);
  const bankAccountId = url.searchParams.get("bankAccountId");

  const transactions = await prisma.bankTransaction.findMany({
    where: { ownerId, ...(bankAccountId ? { bankAccountId } : {}) },
    orderBy: { date: "desc" },
  });
  return NextResponse.json({ bankTransactions: transactions.map(serializeBankTransaction) });
}

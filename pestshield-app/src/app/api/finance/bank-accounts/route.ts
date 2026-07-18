import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireClientOwner } from "@/lib/api-auth";
import { bankAccountFormSchema } from "@/lib/validations/finance";
import { serializeBankAccount } from "@/lib/finance/serialize";

export async function GET() {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;

  const accounts = await prisma.bankAccount.findMany({ where: { ownerId }, orderBy: { bankName: "asc" } });
  return NextResponse.json({ bankAccounts: accounts.map(serializeBankAccount) });
}

export async function POST(request: Request) {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;

  const parsed = bankAccountFormSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Geçersiz istek" }, { status: 400 });
  }

  const account = await prisma.bankAccount.create({ data: { ownerId, ...parsed.data } });
  return NextResponse.json({ bankAccount: serializeBankAccount(account) }, { status: 201 });
}

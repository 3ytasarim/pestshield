import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireClientOwner } from "@/lib/api-auth";
import { contractFormSchema } from "@/lib/validations/crm";
import { serializeContract } from "@/lib/crm/serialize";

const createSchema = contractFormSchema.extend({ customerId: z.string().min(1) });

export async function GET(request: Request) {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;

  const customerId = new URL(request.url).searchParams.get("customerId");
  const contracts = await prisma.contract.findMany({
    where: { ownerId, ...(customerId ? { customerId } : {}) },
    orderBy: { startDate: "desc" },
  });
  return NextResponse.json({ contracts: contracts.map(serializeContract) });
}

export async function POST(request: Request) {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;

  const parsed = createSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Geçersiz istek" },
      { status: 400 },
    );
  }

  const { customerId, servicePeriod: _servicePeriod, description: _description, ...values } = parsed.data;
  void _servicePeriod;
  void _description;

  const customer = await prisma.customer.findFirst({ where: { id: customerId, ownerId } });
  if (!customer) {
    return NextResponse.json({ message: "Müşteri bulunamadı." }, { status: 404 });
  }

  const remainingDays = Math.round((new Date(values.endDate).getTime() - Date.now()) / 86_400_000);
  const status = remainingDays < 0 ? "expired" : remainingDays <= 30 ? "expiring" : "active";

  const contract = await prisma.contract.create({
    data: { ...values, ownerId, customerId, status, remainingDays, fileName: "Yeni Sözleşme.pdf" },
  });
  return NextResponse.json({ contract: serializeContract(contract) });
}

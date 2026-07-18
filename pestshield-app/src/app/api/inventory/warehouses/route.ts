import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireClientOwner } from "@/lib/api-auth";
import { warehouseFormSchema } from "@/lib/validations/inventory";
import { serializeWarehouse } from "@/lib/inventory/serialize";

export async function GET() {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;

  const warehouses = await prisma.warehouse.findMany({ where: { ownerId }, orderBy: { name: "asc" } });
  return NextResponse.json({ warehouses: warehouses.map(serializeWarehouse) });
}

export async function POST(request: Request) {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;

  const parsed = warehouseFormSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Geçersiz istek" }, { status: 400 });
  }

  const warehouse = await prisma.warehouse.create({ data: { ownerId, ...parsed.data } });
  return NextResponse.json({ warehouse: serializeWarehouse(warehouse) }, { status: 201 });
}

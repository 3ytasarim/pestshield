import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireClientOwner } from "@/lib/api-auth";
import { warehouseFormSchema } from "@/lib/validations/inventory";
import { serializeWarehouse } from "@/lib/inventory/serialize";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;
  const { id } = await params;

  const existing = await prisma.warehouse.findFirst({ where: { id, ownerId } });
  if (!existing) {
    return NextResponse.json({ message: "Depo bulunamadı." }, { status: 404 });
  }

  const parsed = warehouseFormSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Geçersiz istek" }, { status: 400 });
  }

  const warehouse = await prisma.warehouse.update({ where: { id }, data: parsed.data });
  return NextResponse.json({ warehouse: serializeWarehouse(warehouse) });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;
  const { id } = await params;

  const existing = await prisma.warehouse.findFirst({ where: { id, ownerId } });
  if (!existing) {
    return NextResponse.json({ message: "Depo bulunamadı." }, { status: 404 });
  }

  // Product.warehouseId zorunlu bir alan (schema: onDelete Cascade) — depo silinirse
  // içindeki ürünler de silinir. Veri kaybını önlemek için önce ürünlerin taşınması/silinmesi istenir.
  const productCount = await prisma.product.count({ where: { warehouseId: id } });
  if (productCount > 0) {
    return NextResponse.json(
      { message: `Bu depoda ${productCount} ürün kayıtlı. Depoyu silmeden önce ürünleri başka bir depoya taşıyın veya silin.` },
      { status: 409 },
    );
  }

  await prisma.warehouse.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

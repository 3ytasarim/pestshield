import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireClientOwner } from "@/lib/api-auth";
import { newProductFormSchema } from "@/lib/validations/inventory";
import { serializeProduct } from "@/lib/inventory/serialize";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;
  const { id } = await params;

  const parsed = newProductFormSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Geçersiz istek" }, { status: 400 });
  }

  const existing = await prisma.product.findFirst({ where: { id, ownerId } });
  if (!existing) {
    return NextResponse.json({ message: "Ürün bulunamadı." }, { status: 404 });
  }

  const {
    isBiosidal,
    startingStock,
    licenseNumber,
    activeIngredient,
    defaultDose,
    targetOrganisms,
    packageAmount,
    antidote,
    usageAreas,
    licenseFileDataUrl,
    licenseFileName,
    msdsFileDataUrl,
    msdsFileName,
    ...rest
  } = parsed.data;
  const warehouse = await prisma.warehouse.findFirst({ where: { id: rest.warehouseId, ownerId } });
  if (!warehouse) {
    return NextResponse.json({ message: "Depo bulunamadı." }, { status: 404 });
  }

  const product = await prisma.product.update({
    where: { id },
    data: {
      ...rest,
      currentStock: startingStock,
      type: isBiosidal ? "biosidal" : "diger",
      licenseNumber: isBiosidal ? licenseNumber : null,
      activeIngredient: isBiosidal ? activeIngredient : null,
      defaultDose: isBiosidal ? defaultDose : null,
      targetOrganisms: isBiosidal ? targetOrganisms : null,
      packageAmount: isBiosidal ? packageAmount : null,
      antidote: isBiosidal ? antidote : null,
      usageAreas: isBiosidal ? usageAreas : [],
      licenseFileDataUrl: isBiosidal ? licenseFileDataUrl : null,
      licenseFileName: isBiosidal ? licenseFileName : null,
      msdsFileDataUrl: isBiosidal ? msdsFileDataUrl : null,
      msdsFileName: isBiosidal ? msdsFileName : null,
    },
  });
  return NextResponse.json({ product: serializeProduct(product) });
}

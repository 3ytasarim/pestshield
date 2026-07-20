import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireClientOwner } from "@/lib/api-auth";
import { newProductFormSchema } from "@/lib/validations/inventory";
import { serializeProduct } from "@/lib/inventory/serialize";

export async function GET() {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;

  const products = await prisma.product.findMany({ where: { ownerId }, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ products: products.map(serializeProduct) });
}

export async function POST(request: Request) {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;

  const parsed = newProductFormSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Geçersiz istek" }, { status: 400 });
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

  const product = await prisma.product.create({
    data: {
      ownerId,
      ...rest,
      currentStock: startingStock,
      type: isBiosidal ? "biosidal" : "diger",
      createdAt: new Date().toISOString().slice(0, 10),
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
  return NextResponse.json({ product: serializeProduct(product) }, { status: 201 });
}

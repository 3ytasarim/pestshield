import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireClientOwner } from "@/lib/api-auth";
import { companySettingsSchema } from "@/lib/validations/auth";

export async function GET() {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;

  const user = await prisma.user.findUnique({ where: { id: ownerId } });
  if (!user) {
    return NextResponse.json({ message: "Kullanıcı bulunamadı." }, { status: 404 });
  }

  return NextResponse.json({
    companyName: user.companyName ?? "",
    authorizedName: user.name ?? "",
    address: user.address ?? "",
    phone: user.phone ?? "",
    logo: user.logoUrl,
    updatedAt: user.updatedAt,
  });
}

export async function PATCH(request: Request) {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;

  const body = await request.json();
  const parsed = companySettingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Geçersiz istek" },
      { status: 400 },
    );
  }

  const values = parsed.data;
  const user = await prisma.user.update({
    where: { id: ownerId },
    data: {
      companyName: values.companyName,
      name: values.authorizedName || null,
      address: values.address || null,
      phone: values.phone || null,
      logoUrl: values.logo ?? null,
    },
  });

  return NextResponse.json({
    companyName: user.companyName ?? "",
    authorizedName: user.name ?? "",
    address: user.address ?? "",
    phone: user.phone ?? "",
    logo: user.logoUrl,
    updatedAt: user.updatedAt,
  });
}

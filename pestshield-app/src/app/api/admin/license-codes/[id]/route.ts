import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

/** Kullanılmamış bir lisans kodunu iptal eder. Kullanılmış kodlar denetim izi için silinemez. */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ message: "Yetkiniz yok." }, { status: 403 });
  }
  const { id } = await params;

  const existing = await prisma.licenseCode.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ message: "Lisans kodu bulunamadı." }, { status: 404 });
  }
  if (existing.redeemedAt) {
    return NextResponse.json({ message: "Kullanılmış lisans kodu silinemez." }, { status: 409 });
  }

  await prisma.licenseCode.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

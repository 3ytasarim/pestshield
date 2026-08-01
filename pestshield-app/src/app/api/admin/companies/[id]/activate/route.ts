import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { LICENSE_PRESETS } from "@/lib/license";

/** Bekleyen (isActive=false) bir firma kaydını onaylar — bu, 5 günlük demo lisansın başladığı andır. */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ message: "Yetkiniz yok." }, { status: 403 });
  }

  const { id } = await params;
  const existing = await prisma.user.findFirst({ where: { id, role: "CLIENT" } });
  if (!existing) {
    return NextResponse.json({ message: "Firma bulunamadı." }, { status: 404 });
  }
  if (existing.isActive) {
    return NextResponse.json({ message: "Firma zaten aktif." }, { status: 409 });
  }

  const demoPreset = LICENSE_PRESETS.find((p) => p.type === "DEMO")!;
  const licenseExpiresAt = new Date(Date.now() + demoPreset.durationDays * 24 * 60 * 60 * 1000);

  const company = await prisma.user.update({
    where: { id },
    data: { isActive: true, licenseType: "DEMO", licenseExpiresAt },
  });

  return NextResponse.json({
    company: {
      id: company.id,
      isActive: company.isActive,
      licenseType: company.licenseType,
      licenseExpiresAt: company.licenseExpiresAt,
    },
  });
}

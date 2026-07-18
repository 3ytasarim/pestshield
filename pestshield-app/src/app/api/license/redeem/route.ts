import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { computeDaysRemaining, computeLicenseStatus } from "@/lib/license";

const bodySchema = z.object({
  code: z.string().trim().min(1, "Lisans kodu gerekli"),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: "Oturum bulunamadı." }, { status: 401 });
  }

  const body = await request.json();
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Geçersiz istek" },
      { status: 400 },
    );
  }

  const code = parsed.data.code.toUpperCase();
  const licenseCode = await prisma.licenseCode.findUnique({ where: { code } });

  if (!licenseCode) {
    return NextResponse.json({ message: "Lisans kodu bulunamadı." }, { status: 404 });
  }
  if (licenseCode.redeemedAt) {
    return NextResponse.json({ message: "Bu lisans kodu daha önce kullanılmış." }, { status: 409 });
  }
  if (licenseCode.targetUserId !== session.user.id) {
    return NextResponse.json(
      { message: "Bu lisans kodu hesabınıza tanımlı değil." },
      { status: 403 },
    );
  }

  // Yeni kod, süresi ne olursa olsun her zaman mevcut lisansın YERİNE geçer
  // (üst üste eklenmez) — aksi halde ör. kalan süresi olan bir "Aylık" lisansın
  // üstüne "5 Günlük Deneme" kodu uygulandığında tür etiketi ile kalan gün
  // sayısı tutarsız hale gelir (tür "5 Günlük" görünürken kalan süre 30+ gün
  // olabilir). Süper admin zaten her kodu bilinçli olarak üretip veriyor.
  const newExpiresAt = new Date(Date.now() + licenseCode.durationDays * 24 * 60 * 60 * 1000);

  const [updatedUser] = await prisma.$transaction([
    prisma.user.update({
      where: { id: session.user.id },
      data: { licenseType: licenseCode.type, licenseExpiresAt: newExpiresAt },
    }),
    prisma.licenseCode.update({
      where: { id: licenseCode.id },
      data: { redeemedAt: new Date(), redeemedByUserId: session.user.id },
    }),
  ]);

  return NextResponse.json({
    licenseType: updatedUser.licenseType,
    licenseExpiresAt: updatedUser.licenseExpiresAt,
    daysRemaining: computeDaysRemaining(updatedUser.licenseExpiresAt),
    status: computeLicenseStatus(updatedUser.licenseExpiresAt),
  });
}

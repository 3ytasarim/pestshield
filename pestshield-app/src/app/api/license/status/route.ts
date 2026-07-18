import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { computeDaysRemaining, computeLicenseStatus } from "@/lib/license";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: "Oturum bulunamadı." }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { licenseType: true, licenseExpiresAt: true },
  });
  if (!user) {
    return NextResponse.json({ message: "Kullanıcı bulunamadı." }, { status: 404 });
  }

  return NextResponse.json({
    licenseType: user.licenseType,
    licenseExpiresAt: user.licenseExpiresAt,
    daysRemaining: computeDaysRemaining(user.licenseExpiresAt),
    status: computeLicenseStatus(user.licenseExpiresAt),
  });
}

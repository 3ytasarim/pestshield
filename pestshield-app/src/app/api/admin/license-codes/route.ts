import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { LICENSE_PRESETS } from "@/lib/license";
import { generateLicenseCode } from "@/lib/license-codegen";

const bodySchema = z.object({
  targetUserId: z.string().uuid(),
  type: z.enum(["DEMO", "MONTHLY", "YEARLY"]),
  durationDays: z.number().int().min(1).max(3650).optional(),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ message: "Yetkiniz yok." }, { status: 403 });
  }

  const body = await request.json();
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Geçersiz istek" },
      { status: 400 },
    );
  }

  const targetUser = await prisma.user.findUnique({ where: { id: parsed.data.targetUserId } });
  if (!targetUser || targetUser.role !== "CLIENT") {
    return NextResponse.json({ message: "Firma bulunamadı." }, { status: 404 });
  }

  const preset = LICENSE_PRESETS.find((p) => p.type === parsed.data.type);
  const durationDays = parsed.data.durationDays ?? preset?.durationDays ?? 30;

  let code = generateLicenseCode();
  for (let attempt = 0; attempt < 5; attempt++) {
    const existing = await prisma.licenseCode.findUnique({ where: { code } });
    if (!existing) break;
    code = generateLicenseCode();
  }

  const licenseCode = await prisma.licenseCode.create({
    data: {
      code,
      type: parsed.data.type,
      durationDays,
      targetUserId: targetUser.id,
      createdByUserId: session.user.id,
    },
  });

  return NextResponse.json({ licenseCode });
}

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ message: "Yetkiniz yok." }, { status: 403 });
  }

  const codes = await prisma.licenseCode.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      targetUser: { select: { companyName: true, name: true, email: true } },
      redeemedBy: { select: { companyName: true, name: true, email: true } },
    },
  });

  return NextResponse.json({ codes });
}

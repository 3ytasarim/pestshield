import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

const patchSchema = z.object({
  planId: z.string().nullable(),
  extraModules: z.array(z.string()).default([]),
});

/** Superadmin bir firmaya paket atar/kaldırır ve firmaya özel ek modül (eklenti) verir. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ message: "Yetkiniz yok." }, { status: 403 });
  }
  const { id } = await params;

  const existing = await prisma.user.findFirst({ where: { id, role: "CLIENT" } });
  if (!existing) {
    return NextResponse.json({ message: "Firma bulunamadı." }, { status: 404 });
  }

  const parsed = patchSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Geçersiz istek" }, { status: 400 });
  }

  if (parsed.data.planId) {
    const plan = await prisma.plan.findUnique({ where: { id: parsed.data.planId } });
    if (!plan) {
      return NextResponse.json({ message: "Paket bulunamadı." }, { status: 404 });
    }
  }

  const company = await prisma.user.update({
    where: { id },
    data: { planId: parsed.data.planId, extraModules: parsed.data.extraModules },
    include: { plan: true },
  });

  return NextResponse.json({
    company: { id: company.id, planId: company.planId, planName: company.plan?.name ?? null, extraModules: company.extraModules },
  });
}

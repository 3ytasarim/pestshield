import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { ensurePlansSeeded } from "@/lib/plan-seed";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ message: "Yetkiniz yok." }, { status: 403 });
  }

  const plans = await ensurePlansSeeded();
  return NextResponse.json({ plans });
}

const patchSchema = z.object({
  key: z.enum(["starter", "pro", "enterprise"]),
  maxUsers: z.number().int().min(0).nullable(),
  maxCustomers: z.number().int().min(0).nullable(),
  allowedModules: z.array(z.string()),
});

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ message: "Yetkiniz yok." }, { status: 403 });
  }

  const parsed = patchSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Geçersiz istek" }, { status: 400 });
  }

  const { key, ...values } = parsed.data;
  const plan = await prisma.plan.update({ where: { key }, data: values });
  return NextResponse.json({ plan });
}

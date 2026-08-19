import "server-only";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isMultiTenant } from "@/lib/tenant";
import type { Plan } from "@/generated/prisma";

/** Standalone'da veya paket atanmamış firmalarda her zaman `null` (=sınırsız) döner. */
export async function getEffectivePlan(ownerId: string): Promise<Plan | null> {
  if (!isMultiTenant()) return null;
  const user = await prisma.user.findUnique({ where: { id: ownerId }, include: { plan: true } });
  return user?.plan ?? null;
}

const LIMIT_LABELS: Record<"users" | "customers", string> = {
  users: "kullanıcı",
  customers: "müşteri",
};

/** Limit aşılmışsa hazır bir 403 NextResponse döner, izinliyse `null` döner. */
export async function checkCountLimit(ownerId: string, kind: "users" | "customers"): Promise<NextResponse | null> {
  const plan = await getEffectivePlan(ownerId);
  if (!plan) return null;

  const limit = kind === "users" ? plan.maxUsers : plan.maxCustomers;
  if (limit == null) return null;

  const current =
    kind === "users"
      ? 1 + (await prisma.companyUser.count({ where: { ownerId } })) + (await prisma.technician.count({ where: { ownerId } }))
      : await prisma.customer.count({ where: { ownerId } });

  if (current >= limit) {
    return NextResponse.json(
      {
        message: `Paketinizin ${LIMIT_LABELS[kind]} limitine ulaştınız (${current}/${limit}). Yükseltmek için bizimle iletişime geçin.`,
      },
      { status: 403 },
    );
  }
  return null;
}

/** Standalone'da veya paket atanmamış firmalarda `null` (=kısıtlama yok) döner. */
export async function getAllowedModuleHrefs(ownerId: string): Promise<string[] | null> {
  const plan = await getEffectivePlan(ownerId);
  if (!plan) return null;
  const user = await prisma.user.findUnique({ where: { id: ownerId }, select: { extraModules: true } });
  return [...plan.allowedModules, ...(user?.extraModules ?? [])];
}

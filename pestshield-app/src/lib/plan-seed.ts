import "server-only";
import { prisma } from "@/lib/db";
import { getClientNavHrefs } from "@/components/layout/nav-config";
import type { Plan, PlanKey } from "@/generated/prisma";

/** "Başlangıç" paketinde hiç gösterilmeyen modüller (Pro/Kurumsal'da vardır). */
const EXCLUDED_FOR_STARTER = [
  "/dashboard/client/contracts",
  "/dashboard/client/vehicles",
  "/dashboard/client/warehouses",
  "/dashboard/client/stock-movements",
  "/dashboard/client/critical-stock",
  "/dashboard/client/audit-center",
  "/dashboard/client/haccp",
  "/dashboard/client/brcgs",
  "/dashboard/client/iso-22000",
  "/dashboard/client/fssc",
  "/dashboard/client/corrective-actions",
  "/dashboard/client/risk-management",
  "/dashboard/client/collections",
  "/dashboard/client/billing",
  "/dashboard/client/bank-accounts",
  "/dashboard/client/payment-tracking",
  "/dashboard/client/roles",
  "/dashboard/client/permissions",
  "/dashboard/client/integrations",
  "/dashboard/client/reports/ai",
  "/dashboard/client/ai/risk-prediction",
];

/** Pro paketinde ek olarak "isteğe bağlı eklenti" sayılıp varsayılan gizli olan modüller
 * (Başlangıç'ta zaten hariç olanların dışında, sadece bunlar Pro'da ayrıca kapalı başlar). */
const ADDITIONALLY_EXCLUDED_FOR_PRO = [
  "/dashboard/client/reports/ai",
  "/dashboard/client/ai/risk-prediction",
  "/dashboard/client/vehicles",
  "/dashboard/client/stock-movements",
  "/dashboard/client/critical-stock",
  "/dashboard/client/collections",
  "/dashboard/client/billing",
  "/dashboard/client/bank-accounts",
  "/dashboard/client/payment-tracking",
];

const FEATURE_KEYS = ["feature:kroki", "feature:trend-analiz", "feature:customer-portal"];

const PLAN_DEFAULTS: Record<PlanKey, { name: string; maxUsers: number | null; maxCustomers: number | null; excluded: string[] }> = {
  starter: { name: "Başlangıç Paketi", maxUsers: 1, maxCustomers: 75, excluded: EXCLUDED_FOR_STARTER },
  pro: { name: "Pro Paket", maxUsers: 4, maxCustomers: 500, excluded: ADDITIONALLY_EXCLUDED_FOR_PRO },
  enterprise: { name: "Kurumsal Paket", maxUsers: null, maxCustomers: null, excluded: [] },
};

/** Hiç Plan satırı yoksa (ilk kurulum) 3 varsayılan paketi oluşturur — idempotent, her
 * çağrıda güvenle tekrar denenebilir. Superadmin daha sonra "Paket Modülleri" ekranından
 * bu varsayılanları serbestçe değiştirebilir. */
export async function ensurePlansSeeded(): Promise<Plan[]> {
  const existing = await prisma.plan.findMany();
  if (existing.length > 0) return existing;

  const allHrefs = getClientNavHrefs().map((item) => item.href);
  const featureKeysForStarter = ["feature:customer-portal"]; // kroki + trend-analiz Başlangıç'ta yok
  const featureKeysForPro = FEATURE_KEYS; // hepsi Pro'da dahil

  const rows = await Promise.all(
    (Object.keys(PLAN_DEFAULTS) as PlanKey[]).map((key) => {
      const def = PLAN_DEFAULTS[key];
      const modules = allHrefs.filter((href) => !def.excluded.includes(href));
      const featureKeys = key === "starter" ? featureKeysForStarter : featureKeysForPro;
      return prisma.plan.create({
        data: {
          key,
          name: def.name,
          maxUsers: def.maxUsers,
          maxCustomers: def.maxCustomers,
          allowedModules: [...modules, ...featureKeys],
        },
      });
    }),
  );
  return rows;
}

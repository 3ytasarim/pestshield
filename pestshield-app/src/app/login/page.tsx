import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthSwitchShell } from "@/components/auth/auth-switch-shell";
import { prisma } from "@/lib/db";

export const metadata: Metadata = {
  title: "Giriş Yap · PestShield",
};

// Standalone dağıtımlarda firma logosunu okumak için DB'ye gidiyor — bu yüzden
// build sırasında statik olarak önceden oluşturulamaz, her istekte render edilmeli.
export const dynamic = "force-dynamic";

const SELF_REGISTRATION_ENABLED = process.env.NEXT_PUBLIC_ENABLE_SELF_REGISTRATION !== "false";

export default async function LoginPage() {
  // Tek firmalı (standalone) dağıtımlarda giriş ekranında PestShield yerine
  // o firmanın kendi logosu gösterilir — çok kiracılı ana SaaS'ta (self
  // registration açık) her zaman PestShield marka logosu kalır.
  let tenantLogoUrl: string | null = null;
  let tenantName: string | null = null;
  if (!SELF_REGISTRATION_ENABLED) {
    // Aynı paylaşımlı DB'de eski demo/seed CLIENT kayıtları da olabilir —
    // "ilk" değil, gerçekten logo yüklenmiş, en güncel firmayı hedef al.
    const owner = await prisma.user.findFirst({
      where: { role: "CLIENT", logoUrl: { not: null } },
      orderBy: { createdAt: "desc" },
      select: { logoUrl: true, companyName: true },
    });
    tenantLogoUrl = owner?.logoUrl ?? null;
    tenantName = owner?.companyName ?? null;
  }

  return (
    <Suspense>
      <AuthSwitchShell tenantLogoUrl={tenantLogoUrl} tenantName={tenantName} />
    </Suspense>
  );
}

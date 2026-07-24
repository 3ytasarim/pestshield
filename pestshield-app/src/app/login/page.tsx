import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthSwitchShell } from "@/components/auth/auth-switch-shell";
import { prisma } from "@/lib/db";

export const metadata: Metadata = {
  title: "Giriş Yap · PestShield",
};

const SELF_REGISTRATION_ENABLED = process.env.NEXT_PUBLIC_ENABLE_SELF_REGISTRATION !== "false";

export default async function LoginPage() {
  // Tek firmalı (standalone) dağıtımlarda giriş ekranında PestShield yerine
  // o firmanın kendi logosu gösterilir — çok kiracılı ana SaaS'ta (self
  // registration açık) her zaman PestShield marka logosu kalır.
  let tenantLogoUrl: string | null = null;
  let tenantName: string | null = null;
  if (!SELF_REGISTRATION_ENABLED) {
    const owner = await prisma.user.findFirst({
      where: { role: "CLIENT" },
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

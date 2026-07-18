import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isSecretsEncryptionConfigured } from "@/lib/crypto";
import { syncParasutCustomers } from "@/lib/integrations/parasut/sync";

/**
 * Vercel Cron tarafından periyodik olarak çağrılır (bkz. vercel.json).
 * `Authorization: Bearer $CRON_SECRET` ile korunur — Vercel Cron'un standart
 * kalıbı. Vercel dışı ortamlarda bu route hiç tetiklenmez; Entegrasyonlar
 * sayfasındaki "Şimdi Senkronize Et" butonu her zaman bağımsız çalışır.
 */
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ message: "CRON_SECRET yapılandırılmadı." }, { status: 500 });
  }
  if (request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ message: "Yetkiniz yok." }, { status: 401 });
  }
  if (!isSecretsEncryptionConfigured()) {
    return NextResponse.json({ message: "SECRETS_ENCRYPTION_KEY yapılandırılmadı." }, { status: 500 });
  }

  const integrations = await prisma.parasutIntegration.findMany({
    where: { parasutCompanyId: { not: null } },
    select: { ownerId: true },
  });

  const results = await Promise.allSettled(
    integrations.map((integration) => syncParasutCustomers(integration.ownerId)),
  );

  const summary = results.map((result, i) => ({
    ownerId: integrations[i].ownerId,
    ...(result.status === "fulfilled" ? result.value : { created: 0, updated: 0, error: String(result.reason) }),
  }));

  return NextResponse.json({ synced: summary.length, results: summary });
}

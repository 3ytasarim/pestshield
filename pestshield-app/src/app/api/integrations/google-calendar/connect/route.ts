import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireClientOwner } from "@/lib/api-auth";
import { googleCalendarConnectSchema } from "@/lib/validations/integrations";
import { encryptSecret, isSecretsEncryptionConfigured } from "@/lib/crypto";

/** Kiracının kendi Google Cloud OAuth Client ID/Secret'ını kaydeder — henüz erişim token'ı almaz, sadece "Google ile Bağlan" adımı için kimlik bilgisini hazırlar. */
export async function POST(request: Request) {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;

  if (!isSecretsEncryptionConfigured()) {
    return NextResponse.json(
      { message: "Sır şifreleme yapılandırılmadı (SECRETS_ENCRYPTION_KEY eksik) — Google Calendar entegrasyonu kullanılamaz." },
      { status: 500 },
    );
  }

  const parsed = googleCalendarConnectSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Geçersiz istek" }, { status: 400 });
  }
  const { clientId, clientSecret } = parsed.data;

  await prisma.googleCalendarIntegration.upsert({
    where: { ownerId },
    create: { ownerId, clientId, clientSecretEnc: encryptSecret(clientSecret) },
    update: { clientId, clientSecretEnc: encryptSecret(clientSecret) },
    select: { id: true },
  });

  return NextResponse.json({ ok: true });
}

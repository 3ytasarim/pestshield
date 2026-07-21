import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireClientOwner } from "@/lib/api-auth";
import { whatsAppConnectSchema } from "@/lib/validations/integrations";
import { encryptSecret, isSecretsEncryptionConfigured } from "@/lib/crypto";

/** Meta'nın `GET /{phone-number-id}` uç noktasına gerçek bir doğrulama çağrısı yapıp geçerliliği kontrol eder, sonra şifreli olarak DB'ye kaydeder. */
export async function POST(request: Request) {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;

  if (!isSecretsEncryptionConfigured()) {
    return NextResponse.json(
      { message: "Sır şifreleme yapılandırılmadı (SECRETS_ENCRYPTION_KEY eksik) — WhatsApp entegrasyonu kullanılamaz." },
      { status: 500 },
    );
  }

  const parsed = whatsAppConnectSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Geçersiz istek" }, { status: 400 });
  }
  const { accessToken, phoneNumberId, businessAccountId, apiVersion } = parsed.data;
  const version = apiVersion || "v21.0";

  try {
    const res = await fetch(`https://graph.facebook.com/${version}/${phoneNumberId}?fields=verified_name,display_phone_number`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
    if (!res.ok || data.error) {
      return NextResponse.json({ message: data.error?.message ?? "Meta WhatsApp API'ye bağlanılamadı — bilgileri kontrol edin." }, { status: 502 });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Meta WhatsApp API'ye bağlanılamadı";
    return NextResponse.json({ message }, { status: 502 });
  }

  await prisma.whatsAppIntegration.upsert({
    where: { ownerId },
    create: {
      ownerId,
      accessTokenEnc: encryptSecret(accessToken),
      phoneNumberId,
      businessAccountId: businessAccountId || null,
      apiVersion: version,
      connectedAt: new Date(),
    },
    update: {
      accessTokenEnc: encryptSecret(accessToken),
      phoneNumberId,
      businessAccountId: businessAccountId || null,
      apiVersion: version,
      connectedAt: new Date(),
    },
    select: { id: true },
  });

  return NextResponse.json({ connected: true });
}

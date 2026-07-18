import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireClientOwner } from "@/lib/api-auth";
import { parasutConnectSchema } from "@/lib/validations/integrations";
import { parasutClient, ParasutApiError } from "@/lib/integrations/parasut/client";
import { encryptSecret, isSecretsEncryptionConfigured } from "@/lib/crypto";

export async function POST(request: Request) {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;

  if (!isSecretsEncryptionConfigured()) {
    return NextResponse.json(
      { message: "Sır şifreleme yapılandırılmadı (SECRETS_ENCRYPTION_KEY eksik) — Paraşüt entegrasyonu kullanılamaz." },
      { status: 500 },
    );
  }

  const parsed = parasutConnectSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Geçersiz istek" }, { status: 400 });
  }
  const { clientId, clientSecret, authCode } = parsed.data;

  try {
    const tokens = await parasutClient.exchangeCode(clientId, clientSecret, authCode);
    const companies = await parasutClient.getMe(tokens.accessToken);

    const singleCompany = companies.length === 1 ? companies[0] : null;

    const integration = await prisma.parasutIntegration.upsert({
      where: { ownerId },
      create: {
        ownerId,
        clientId,
        clientSecretEnc: encryptSecret(clientSecret),
        accessTokenEnc: encryptSecret(tokens.accessToken),
        refreshTokenEnc: encryptSecret(tokens.refreshToken),
        tokenExpiresAt: new Date(Date.now() + tokens.expiresIn * 1000),
        parasutCompanyId: singleCompany?.id ?? null,
        parasutCompanyName: singleCompany?.name ?? null,
        connectedAt: singleCompany ? new Date() : null,
      },
      update: {
        clientId,
        clientSecretEnc: encryptSecret(clientSecret),
        accessTokenEnc: encryptSecret(tokens.accessToken),
        refreshTokenEnc: encryptSecret(tokens.refreshToken),
        tokenExpiresAt: new Date(Date.now() + tokens.expiresIn * 1000),
        parasutCompanyId: singleCompany?.id ?? null,
        parasutCompanyName: singleCompany?.name ?? null,
        connectedAt: singleCompany ? new Date() : null,
      },
    });

    return NextResponse.json({
      connected: !!integration.parasutCompanyId,
      companies,
    });
  } catch (err) {
    const message = err instanceof ParasutApiError ? err.message : "Paraşüt'e bağlanılamadı.";
    return NextResponse.json({ message }, { status: err instanceof ParasutApiError ? 400 : 500 });
  }
}

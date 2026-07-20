import "server-only";
import { prisma } from "@/lib/db";
import { decryptSecret, encryptSecret } from "@/lib/crypto";
import { parasutClient, type ParasutContact } from "./client";
import type { ParasutIntegration } from "@/generated/prisma";

export interface ParasutSyncResult {
  created: number;
  updated: number;
  error?: string;
}

/** Access token süresi dolmuşsa (veya hiç yoksa) refresh_token ile yeniler ve DB'yi günceller. */
async function ensureFreshAccessToken(integration: ParasutIntegration): Promise<string> {
  const expiresAt = integration.tokenExpiresAt?.getTime() ?? 0;
  if (integration.accessTokenEnc && expiresAt > Date.now() + 60_000) {
    return decryptSecret(integration.accessTokenEnc);
  }
  if (!integration.refreshTokenEnc) {
    throw new Error("Paraşüt bağlantısının yenileme token'ı yok — yeniden bağlanmanız gerekiyor.");
  }
  const clientSecret = decryptSecret(integration.clientSecretEnc);
  const refreshToken = decryptSecret(integration.refreshTokenEnc);
  const tokens = await parasutClient.refreshAccessToken(integration.clientId, clientSecret, refreshToken);

  await prisma.parasutIntegration.update({
    where: { id: integration.id },
    data: {
      accessTokenEnc: encryptSecret(tokens.accessToken),
      refreshTokenEnc: encryptSecret(tokens.refreshToken),
      tokenExpiresAt: new Date(Date.now() + tokens.expiresIn * 1000),
    },
  });
  return tokens.accessToken;
}

function mapContactToCustomerFields(contact: ParasutContact) {
  return {
    companyName: contact.name || "İsimsiz Müşteri",
    addressLine: contact.address,
    taxNumber: contact.taxNumber,
    taxOffice: contact.taxOffice,
    contactEmail: contact.email,
    city: contact.city,
    district: contact.district,
    contactPhone: contact.phone,
    fax: contact.fax,
  };
}

/**
 * Bir firmanın Paraşüt'teki tüm müşteri kontaklarını çekip Postgres `Customer`
 * tablosuna işler. Eşleştirme anahtarı `parasutContactId` — elle eklenmiş
 * müşterilerle ASLA otomatik birleştirme yapılmaz, yalnızca daha önce bu
 * senkronizasyonla oluşturulmuş kayıtlar güncellenir.
 */
export async function syncParasutCustomers(ownerId: string): Promise<ParasutSyncResult> {
  const integration = await prisma.parasutIntegration.findUnique({ where: { ownerId } });
  if (!integration || !integration.parasutCompanyId) {
    return { created: 0, updated: 0, error: "Paraşüt bağlantısı kurulmamış." };
  }

  try {
    const accessToken = await ensureFreshAccessToken(integration);
    const contacts = await parasutClient.listAllContacts(accessToken, integration.parasutCompanyId);

    let created = 0;
    let updated = 0;

    for (const contact of contacts) {
      const existing = await prisma.customer.findUnique({ where: { parasutContactId: contact.id } });
      const fields = mapContactToCustomerFields(contact);

      if (existing) {
        if (existing.ownerId !== ownerId) continue;
        await prisma.customer.update({ where: { id: existing.id }, data: fields });
        updated += 1;
      } else {
        const today = new Date().toISOString().slice(0, 10);
        await prisma.customer.create({
          data: {
            ownerId,
            parasutContactId: contact.id,
            accountCode: `PRS-${contact.id}`,
            lastServiceDate: today,
            nextServiceDate: today,
            ...fields,
          },
        });
        created += 1;
      }
    }

    await prisma.parasutIntegration.update({
      where: { id: integration.id },
      data: { lastSyncAt: new Date(), lastSyncStatus: "ok", lastSyncCount: contacts.length },
    });

    return { created, updated };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Bilinmeyen hata";
    await prisma.parasutIntegration.update({
      where: { id: integration.id },
      data: { lastSyncAt: new Date(), lastSyncStatus: `error: ${message}` },
    });
    return { created: 0, updated: 0, error: message };
  }
}

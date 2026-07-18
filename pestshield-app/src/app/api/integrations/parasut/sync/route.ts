import { NextResponse } from "next/server";
import { requireClientOwner } from "@/lib/api-auth";
import { isSecretsEncryptionConfigured } from "@/lib/crypto";
import { syncParasutCustomers } from "@/lib/integrations/parasut/sync";

export async function POST() {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;

  if (!isSecretsEncryptionConfigured()) {
    return NextResponse.json(
      { message: "Sır şifreleme yapılandırılmadı (SECRETS_ENCRYPTION_KEY eksik) — Paraşüt entegrasyonu kullanılamaz." },
      { status: 500 },
    );
  }

  const result = await syncParasutCustomers(ownerId);
  if (result.error) {
    return NextResponse.json({ message: result.error }, { status: 400 });
  }
  return NextResponse.json(result);
}

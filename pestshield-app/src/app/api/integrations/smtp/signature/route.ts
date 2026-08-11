import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireClientOwner } from "@/lib/api-auth";
import { smtpSignatureSchema } from "@/lib/validations/integrations";

/** Sadece otomatik imza ayarlarını günceller — SMTP bağlantısını yeniden doğrulamaz. */
export async function PATCH(request: Request) {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;

  const parsed = smtpSignatureSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Geçersiz istek" }, { status: 400 });
  }

  const existing = await prisma.smtpIntegration.findUnique({ where: { ownerId } });
  if (!existing) {
    return NextResponse.json({ message: "Önce SMTP bağlantısı kurmalısınız." }, { status: 400 });
  }

  await prisma.smtpIntegration.update({
    where: { ownerId },
    data: {
      signatureEnabled: parsed.data.signatureEnabled,
      signatureTitle: parsed.data.signatureTitle || null,
    },
  });

  return NextResponse.json({ ok: true });
}

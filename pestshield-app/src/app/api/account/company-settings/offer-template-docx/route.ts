import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireClientOwner } from "@/lib/api-auth";

/** Teklif için yüklenen ham .docx şablonunu döner — ağır olduğu için genel Şirket
 * Ayarları GET'inden ayrı, sadece "Word Şablonundan İndir" tıklandığında çağrılır. */
export async function GET() {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;

  const user = await prisma.user.findUnique({
    where: { id: ownerId },
    select: { offerTemplateDocx: true, offerTemplateDocxName: true },
  });

  return NextResponse.json({
    dataUrl: user?.offerTemplateDocx ?? null,
    fileName: user?.offerTemplateDocxName ?? null,
  });
}

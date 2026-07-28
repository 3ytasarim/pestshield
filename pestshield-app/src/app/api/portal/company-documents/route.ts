import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireCustomerOwner } from "@/lib/api-auth";

/** Müşteri portalı — ilaçlama firmasının Belgeler sayfasında eklediği, firma
 * genelindeki (ruhsat, sigorta poliçesi vb.) belgeler. */
export async function GET() {
  const { ownerId, error } = await requireCustomerOwner();
  if (error) return error;

  const documents = await prisma.document.findMany({
    where: { ownerId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ documents });
}

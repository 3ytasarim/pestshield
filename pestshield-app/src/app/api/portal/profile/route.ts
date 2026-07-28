import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireCustomerOwner } from "@/lib/api-auth";

/** Müşteri portalı — Uygulama QR Kodu belgeleri için gereken asgari müşteri +
 * firma marka bilgisi (localStorage'daki Şirket Ayarları'na erişimi olmayan
 * bu oturumda sunucudan okunur). */
export async function GET() {
  const { customerId, ownerId, error } = await requireCustomerOwner();
  if (error) return error;

  const [customer, owner] = await Promise.all([
    prisma.customer.findUnique({ where: { id: customerId }, select: { id: true, companyName: true, accountCode: true } }),
    prisma.user.findUnique({ where: { id: ownerId }, select: { companyName: true, logoUrl: true } }),
  ]);
  if (!customer) {
    return NextResponse.json({ message: "Müşteri bulunamadı." }, { status: 404 });
  }

  return NextResponse.json({
    customer,
    branding: {
      companyName: owner?.companyName ?? "",
      logo: owner?.logoUrl ?? null,
      authorizedName: "",
    },
  });
}

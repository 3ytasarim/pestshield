import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireClientOwner, getSessionPermissions } from "@/lib/api-auth";
import { quickCustomerSchema } from "@/lib/validations/crm";
import { serializeCustomer } from "@/lib/crm/serialize";

// Google Calendar içe aktarımı gibi akışlarda tek seferlik/günlük bir müşteriyi
// (ör. "Yakamoz Restaurant") tam CustomerForm'u doldurmadan hızlıca oluşturur.
// Sadece firma adı zorunludur — geri kalan alanlar Prisma şemasındaki
// varsayılanlarla dolar, ihtiyaç halinde müşteri detayından tamamlanabilir.
export async function POST(request: Request) {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;

  const permissions = await getSessionPermissions();
  if (!permissions?.can("/dashboard/client/customers", "create")) {
    return NextResponse.json({ message: "Yetkiniz yok." }, { status: 403 });
  }

  const parsed = quickCustomerSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Geçersiz istek" }, { status: 400 });
  }
  const { companyName, contactPhone, contactEmail } = parsed.data;

  const customer = await prisma.customer.create({
    data: {
      ownerId,
      companyName,
      contactPhone: contactPhone ?? "",
      contactEmail: contactEmail ?? "",
      shortName: companyName,
    },
  });

  return NextResponse.json({ customer: serializeCustomer(customer) }, { status: 201 });
}

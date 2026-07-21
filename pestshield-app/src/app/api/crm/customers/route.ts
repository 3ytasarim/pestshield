import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireClientOwner, getSessionPermissions } from "@/lib/api-auth";
import { customerFormSchema } from "@/lib/validations/crm";
import { serializeCustomer } from "@/lib/crm/serialize";

export async function GET() {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;

  const customers = await prisma.customer.findMany({
    where: { ownerId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ customers: customers.map(serializeCustomer) });
}

export async function POST(request: Request) {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;

  const permissions = await getSessionPermissions();
  if (!permissions?.can("/dashboard/client/customers", "create")) {
    return NextResponse.json({ message: "Yetkiniz yok." }, { status: 403 });
  }

  const body = await request.json();
  const parsed = customerFormSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Geçersiz istek" },
      { status: 400 },
    );
  }

  const values = parsed.data;
  const today = new Date().toISOString().slice(0, 10);

  const customer = await prisma.customer.create({
    data: {
      ownerId,
      companyName: values.companyName,
      taxNumber: values.taxNumber ?? "",
      taxOffice: values.taxOffice ?? "",
      sector: values.sector,
      customerType: values.customerType,
      isPotential: values.isPotential,
      status: values.status,
      shortName: values.shortName,
      logo: values.logo ?? null,
      contactName: values.contactName,
      contactTitle: values.contactTitle,
      contactPhone: values.contactPhone,
      contactEmail: values.contactEmail,
      fax: values.fax ?? "",
      country: values.country,
      city: values.city,
      district: values.district,
      addressLine: values.addressLine,
      postalCode: values.postalCode,
      iban: values.iban ?? "",
      portalEmail: values.portalEmail,
      portalPassword: values.portalPassword ?? "",
      sendServiceReportEmail: values.sendServiceReportEmail,
      sendTrendAnalysisEmail: values.sendTrendAnalysisEmail,
      sendCorrectiveActionEmail: values.sendCorrectiveActionEmail,
      accountCode: values.accountCode,
      paymentTermDays: values.paymentTermDays,
      invoiceEmail: values.invoiceEmail,
      currency: values.currency,
      // Servis türü, periyot ve sorumlu ekip ataması ilk müşteri kaydında değil,
      // ilk iş emri/sözleşme oluşturulurken belirlenir.
      serviceType: "",
      servicePeriod: "",
      operationsManager: "",
      salesRep: "",
      riskLevel: "low",
      riskScore: 15,
      auditReadinessScore: 70,
      lastServiceDate: today,
      nextServiceDate: today,
      pendingCollection: 0,
      contractEndDate: null,
    },
  });

  return NextResponse.json({ customer: serializeCustomer(customer) });
}

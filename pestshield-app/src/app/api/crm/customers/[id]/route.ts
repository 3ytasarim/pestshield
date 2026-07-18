import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireClientOwner } from "@/lib/api-auth";
import { customerFormSchema } from "@/lib/validations/crm";
import { serializeCustomer } from "@/lib/crm/serialize";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;
  const { id } = await params;

  const customer = await prisma.customer.findFirst({ where: { id, ownerId } });
  if (!customer) {
    return NextResponse.json({ message: "Müşteri bulunamadı." }, { status: 404 });
  }
  return NextResponse.json({ customer: serializeCustomer(customer) });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;
  const { id } = await params;

  const existing = await prisma.customer.findFirst({ where: { id, ownerId } });
  if (!existing) {
    return NextResponse.json({ message: "Müşteri bulunamadı." }, { status: 404 });
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
  const customer = await prisma.customer.update({
    where: { id },
    data: {
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
    },
  });

  return NextResponse.json({ customer: serializeCustomer(customer) });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;
  const { id } = await params;

  const existing = await prisma.customer.findFirst({ where: { id, ownerId } });
  if (!existing) {
    return NextResponse.json({ message: "Müşteri bulunamadı." }, { status: 404 });
  }

  await prisma.customer.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

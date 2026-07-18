import { NextResponse } from "next/server";
import { requireClientOrTechOwner } from "@/lib/api-auth";
import { PrismaAiDataProvider } from "@/lib/ai/providers/prisma-data-provider";

export async function GET(request: Request, { params }: { params: Promise<{ method: string }> }) {
  const { ownerId, error } = await requireClientOrTechOwner();
  if (error) return error;

  const { method } = await params;
  const provider = new PrismaAiDataProvider(ownerId);
  const searchParams = new URL(request.url).searchParams;

  switch (method) {
    case "service-occurrences":
      return NextResponse.json(await provider.getServiceOccurrences());
    case "invoices":
      return NextResponse.json(await provider.getInvoices());
    case "customers":
      return NextResponse.json(await provider.getCustomers());
    case "customer-balance": {
      const customerId = searchParams.get("customerId");
      if (!customerId) return NextResponse.json({ message: "customerId zorunludur." }, { status: 400 });
      return NextResponse.json(await provider.getCustomerBalance(customerId));
    }
    case "open-risks":
      return NextResponse.json(await provider.getOpenRisks());
    case "open-corrective-actions":
      return NextResponse.json(await provider.getOpenCorrectiveActions());
    case "technicians":
      return NextResponse.json(await provider.getTechnicians());
    case "all-risks":
      return NextResponse.json(await provider.getAllRisks());
    case "all-corrective-actions":
      return NextResponse.json(await provider.getAllCorrectiveActions());
    case "checklist-items":
      return NextResponse.json(await provider.getChecklistItems());
    default:
      return NextResponse.json({ message: "Bilinmeyen veri metodu." }, { status: 404 });
  }
}

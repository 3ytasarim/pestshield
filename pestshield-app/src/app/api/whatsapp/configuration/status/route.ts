import { NextResponse } from "next/server";
import { requireClientOwner } from "@/lib/api-auth";
import { getWhatsAppProvider } from "@/lib/whatsapp/get-whatsapp-provider";

export async function GET() {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;

  const provider = await getWhatsAppProvider(ownerId);
  return NextResponse.json({ configured: provider.isConfigured, providerName: provider.name });
}

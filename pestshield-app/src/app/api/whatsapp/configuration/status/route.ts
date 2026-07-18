import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getWhatsAppProvider } from "@/lib/whatsapp/get-whatsapp-provider";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ message: "Oturum bulunamadı." }, { status: 401 });

  const provider = getWhatsAppProvider();
  return NextResponse.json({ configured: provider.isConfigured, providerName: provider.name });
}

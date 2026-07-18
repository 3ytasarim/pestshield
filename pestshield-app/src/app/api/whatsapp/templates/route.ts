import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { WHATSAPP_TEMPLATES } from "@/lib/whatsapp/templates";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ message: "Oturum bulunamadı." }, { status: 401 });

  return NextResponse.json({ templates: Object.values(WHATSAPP_TEMPLATES) });
}

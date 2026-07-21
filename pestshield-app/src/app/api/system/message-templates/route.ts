import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireClientOwner } from "@/lib/api-auth";
import { messageTemplateFormSchema } from "@/lib/validations/system";

/** Tüm şablonları ve son 10 gönderim denemesini döner (Şablonlar sayfasının tek yükleme isteği). */
export async function GET() {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;

  const [templates, recentLogs] = await Promise.all([
    prisma.messageTemplate.findMany({ where: { ownerId }, orderBy: [{ trigger: "asc" }, { channel: "asc" }] }),
    prisma.messageSendLog.findMany({ where: { ownerId }, orderBy: { createdAt: "desc" }, take: 10 }),
  ]);

  return NextResponse.json({ templates, recentLogs });
}

/** `@@unique([ownerId, channel, trigger])` sayesinde bir kanal/tetikleyici için tek satır garanti — upsert. */
export async function PUT(request: Request) {
  const { ownerId, error } = await requireClientOwner();
  if (error) return error;

  const parsed = messageTemplateFormSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Geçersiz istek" }, { status: 400 });
  }
  const { channel, trigger, isActive, subject, body, metaTemplateName, metaLanguageCode } = parsed.data;

  const template = await prisma.messageTemplate.upsert({
    where: { ownerId_channel_trigger: { ownerId, channel, trigger } },
    create: {
      ownerId,
      channel,
      trigger,
      isActive,
      subject: channel === "email" ? subject || null : null,
      body,
      metaTemplateName: channel === "whatsapp" ? metaTemplateName || null : null,
      metaLanguageCode: channel === "whatsapp" ? metaLanguageCode || "tr" : null,
    },
    update: {
      isActive,
      subject: channel === "email" ? subject || null : null,
      body,
      metaTemplateName: channel === "whatsapp" ? metaTemplateName || null : null,
      metaLanguageCode: channel === "whatsapp" ? metaLanguageCode || "tr" : null,
    },
  });

  return NextResponse.json({ template });
}

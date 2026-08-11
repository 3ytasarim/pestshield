import "server-only";
import { prisma } from "@/lib/db";
import { getSmtpTransport } from "@/lib/mail/get-smtp-transport";
import { buildEmailSignatureHtml } from "@/lib/mail/build-signature";
import { getWhatsAppProvider } from "@/lib/whatsapp/get-whatsapp-provider";
import { toE164, isValidE164 } from "@/lib/whatsapp/phone-normalizer";
import { formatDate } from "@/components/crm/crm-format";
import type { MessageTemplateChannel, MessageTemplateTrigger } from "@/generated/prisma";

type TemplateVariables = Record<string, string>;

interface OwnerBrandingInfo {
  name: string | null;
  companyName: string | null;
  logoUrl: string | null;
  phone: string | null;
  address: string | null;
}

function fillTemplate(text: string, vars: TemplateVariables): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_match, key: string) => vars[key] ?? "");
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);
}

/** Meta template'leri pozisyonel ({{1}}, {{2}}, ...) olduğundan, değişkenleri şablon metnindeki GÖRÜNME SIRASIYLE çıkarır. */
function extractOrderedVariableValues(text: string, vars: TemplateVariables): string[] {
  return [...text.matchAll(/\{\{(\w+)\}\}/g)].map((m) => vars[m[1]] ?? "");
}

async function logSend(
  ownerId: string,
  channel: MessageTemplateChannel,
  trigger: MessageTemplateTrigger,
  workOrderId: string,
  recipient: string,
  status: "sent" | "failed" | "skipped_no_recipient" | "skipped_not_configured",
  errorMessage?: string,
) {
  try {
    await prisma.messageSendLog.create({
      data: { ownerId, channel, trigger, workOrderId, recipient, status, errorMessage: errorMessage ?? null },
      select: { id: true },
    });
  } catch {
    // Log yazımı kendi başarısızlığıyla iş emri akışını asla etkilemez.
  }
}

/**
 * İş emri oluşunca (veya ileride başka tetikleyicilerde) ilgili müşteriye
 * aktif e-posta/WhatsApp şablonlarını gönderir. `syncWorkOrderToCalendar` ile
 * birebir aynı "fire and forget" deseni: kendi verisini id'den yeniden çeker,
 * entegrasyon/şablon/alıcı eksikse sessizce `skipped_*` log yazıp geçer, ASLA
 * throw etmez — çağıran taraf (work-orders POST) bu yüzden try/catch bile
 * gerektirmeden güvenle çağırabilir.
 */
export async function sendWorkOrderTemplates(
  ownerId: string,
  workOrderId: string,
  trigger: MessageTemplateTrigger = "work_order_created",
): Promise<void> {
  try {
    const order = await prisma.workOrder.findUnique({
      where: { id: workOrderId },
      include: { customer: true, technician: true },
    });
    if (!order || order.ownerId !== ownerId) return;

    const owner = await prisma.user.findUnique({ where: { id: ownerId } });
    if (!owner) return;

    const vars: TemplateVariables = {
      musteriAdi: order.customer.companyName,
      isEmriNo: order.orderNo,
      servisTuru: order.serviceType,
      planlananTarih: formatDate(order.plannedDate),
      teknisyenAdi: order.technician?.name ?? "—",
      firmaAdi: owner.companyName ?? "PestShield",
      firmaTelefon: owner.phone ?? "",
    };

    const ownerBranding: OwnerBrandingInfo = {
      name: owner.name,
      companyName: owner.companyName,
      logoUrl: owner.logoUrl,
      phone: owner.phone,
      address: [owner.address, owner.district, owner.city].filter(Boolean).join(", ") || null,
    };

    await Promise.all([
      sendEmailTemplate(ownerId, order.id, order.customer.contactEmail, trigger, vars, ownerBranding),
      sendWhatsAppTemplate(ownerId, order.id, order.customer.contactPhone, trigger, vars),
    ]);
  } catch {
    // Hiçbir koşulda iş emri oluşturma/güncelleme akışını engellemez.
  }
}

async function sendEmailTemplate(
  ownerId: string,
  workOrderId: string,
  contactEmail: string,
  trigger: MessageTemplateTrigger,
  vars: TemplateVariables,
  ownerBranding: OwnerBrandingInfo,
) {
  const template = await prisma.messageTemplate.findUnique({
    where: { ownerId_channel_trigger: { ownerId, channel: "email", trigger } },
  });
  if (!template || !template.isActive) return;

  if (!contactEmail) {
    await logSend(ownerId, "email", trigger, workOrderId, "", "skipped_no_recipient");
    return;
  }

  const resolved = await getSmtpTransport(ownerId);
  if (!resolved) {
    await logSend(ownerId, "email", trigger, workOrderId, contactEmail, "skipped_not_configured");
    return;
  }

  const subject = fillTemplate(template.subject || "Servis Bildirimi", vars);
  const body = fillTemplate(template.body, vars);

  const signatureHtml = resolved.signatureEnabled
    ? buildEmailSignatureHtml({
        name: ownerBranding.name,
        title: resolved.signatureTitle,
        companyName: ownerBranding.companyName,
        logoUrl: ownerBranding.logoUrl,
        phone: ownerBranding.phone,
        address: ownerBranding.address,
      })
    : "";
  const bodyHtml = `<div style="font-family:Arial,sans-serif;font-size:14px;color:#1e293b;white-space:pre-wrap;">${escapeHtml(body)}</div>${signatureHtml}`;

  try {
    await resolved.transporter.sendMail({
      from: resolved.fromName ? `"${resolved.fromName}" <${resolved.fromEmail}>` : resolved.fromEmail,
      to: contactEmail,
      subject,
      text: body,
      html: bodyHtml,
    });
    await logSend(ownerId, "email", trigger, workOrderId, contactEmail, "sent");
  } catch (err) {
    await logSend(ownerId, "email", trigger, workOrderId, contactEmail, "failed", err instanceof Error ? err.message : "Bilinmeyen hata");
  }
}

async function sendWhatsAppTemplate(
  ownerId: string,
  workOrderId: string,
  contactPhone: string,
  trigger: MessageTemplateTrigger,
  vars: TemplateVariables,
) {
  const template = await prisma.messageTemplate.findUnique({
    where: { ownerId_channel_trigger: { ownerId, channel: "whatsapp", trigger } },
  });
  if (!template || !template.isActive) return;

  const recipient = contactPhone ? toE164(contactPhone) : "";
  if (!recipient || !isValidE164(recipient)) {
    await logSend(ownerId, "whatsapp", trigger, workOrderId, contactPhone || "", "skipped_no_recipient");
    return;
  }

  if (!template.metaTemplateName) {
    await logSend(ownerId, "whatsapp", trigger, workOrderId, recipient, "skipped_not_configured", "Meta Template Adı girilmemiş.");
    return;
  }

  const provider = await getWhatsAppProvider(ownerId);
  if (!provider.isConfigured) {
    await logSend(ownerId, "whatsapp", trigger, workOrderId, recipient, "skipped_not_configured");
    return;
  }

  const result = await provider.sendTemplateMessage({
    to: recipient,
    templateName: template.metaTemplateName,
    languageCode: template.metaLanguageCode || "tr",
    bodyVariables: extractOrderedVariableValues(template.body, vars),
  });

  if (result.success) {
    await logSend(ownerId, "whatsapp", trigger, workOrderId, recipient, "sent");
  } else {
    await logSend(ownerId, "whatsapp", trigger, workOrderId, recipient, "failed", result.errorMessage);
  }
}

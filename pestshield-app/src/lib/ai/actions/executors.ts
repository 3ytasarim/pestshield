// PestShield AI Command Center — Faz 3 GERÇEK yazma işlemleri.
//
// Bu dosya bilinçli olarak tek giriş noktasıdır: `executeConfirmedAction`
// SADECE kullanıcının panelde "Onayla" butonuna gerçekten tıklamasından
// sonra çağrılır (bkz. ai-command-center.tsx). LLM bu fonksiyonu asla
// çağıramaz — LLM sadece bir tool seçer, tool bir öneri üretir (bkz.
// proposal-builder.ts), öneri kullanıcı onayı bekler.
//
// İdempotency: tryConsumeProposal() önerinin durumunu atomik olarak
// "pending_confirmation" → "executing" çevirir ve zaten tüketilmiş/süresi
// dolmuş önerilerde null döner — bu, çift tıklamada iki kez yazmayı
// engelleyen TEK gerçek kontrol noktasıdır (bkz. proposal-store.ts).

import { AI_ROUTES } from "@/lib/ai/routes";
import type { PeriyotOccurrence } from "@/lib/mock/crm";
import { addFollowupTask } from "@/lib/ai/actions/followup-task-store";
import { tryConsumeProposal, saveProposal, getProposal } from "@/lib/ai/actions/proposal-store";
import { logAiAction } from "@/lib/ai/actions/audit";
import { saveWhatsAppMessage } from "@/lib/whatsapp/message-store";
import { WHATSAPP_TEMPLATES } from "@/lib/whatsapp/templates";
import type {
  AiActionExecutionResult,
  AiActionProposal,
  AssignTechnicianParams,
  CreateFollowupTaskParams,
  CreateServiceParams,
  PrepareEmailParams,
  RescheduleServiceParams,
  SendWhatsAppMessageParams,
} from "@/lib/ai/actions/types";

async function ensureAiBatch(serviceOrderId: string): Promise<{ id: string; name: string } | null> {
  const res = await fetch("/api/crm/periyot/batches/ensure-ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ serviceOrderId }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.batch ?? null;
}

async function addOccurrence(input: {
  batchId: string;
  serviceOrderId: string;
  customerId: string;
  personnelName: string;
  periodDate: string;
  startTime: string;
  endTime: string;
}): Promise<PeriyotOccurrence | null> {
  const res = await fetch("/api/crm/periyot/occurrences", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.occurrence ?? null;
}

async function getOccurrenceById(id: string): Promise<PeriyotOccurrence | null> {
  const res = await fetch(`/api/crm/periyot/occurrences/${id}`);
  if (!res.ok) return null;
  const data = await res.json();
  return data.occurrence ?? null;
}

async function updateOccurrence(id: string, patch: Partial<PeriyotOccurrence>): Promise<PeriyotOccurrence | null> {
  const res = await fetch(`/api/crm/periyot/occurrences/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.occurrence ?? null;
}

function fail(proposal: AiActionProposal, message: string): AiActionProposal {
  return { ...proposal, status: "failed", errorMessage: message, executedAt: new Date().toISOString() };
}

function complete(proposal: AiActionProposal, result: AiActionExecutionResult): AiActionProposal {
  return {
    ...proposal,
    status: "completed",
    resultSummary: result.resultSummary,
    resultNavigation: result.navigation,
    executedAt: new Date().toISOString(),
  };
}

async function runCreateService(proposal: AiActionProposal<CreateServiceParams>): Promise<AiActionExecutionResult> {
  const p = proposal.parameters;
  const target = proposal.target;
  if (!target || target.entityType !== "service_order") return { success: false, resultSummary: "", errorMessage: "Hedef hizmet sözleşmesi bulunamadı." };

  const batch = await ensureAiBatch(target.entityId);
  if (!batch) return { success: false, resultSummary: "", errorMessage: "Periyot grubu oluşturulamadı." };

  const endTime = addMinutes(p.startTime, p.durationMinutes);
  const created = await addOccurrence({
    batchId: batch.id,
    serviceOrderId: target.entityId,
    customerId: p.customerId,
    personnelName: p.technicianName ?? "",
    periodDate: p.date,
    startTime: p.startTime,
    endTime,
  });
  if (!created) return { success: false, resultSummary: "", errorMessage: "Servis kaydı oluşturulamadı." };

  const verify = await getOccurrenceById(created.id);
  if (!verify) return { success: false, resultSummary: "", errorMessage: "Servis kaydı oluşturuldu ancak doğrulanamadı." };

  return {
    success: true,
    resultSummary: `${p.customerName} için ${p.date} tarihinde saat ${p.startTime} servis oluşturuldu.`,
    navigation: { label: "Servisleri Aç", href: AI_ROUTES.services() },
  };
}

async function runRescheduleService(proposal: AiActionProposal<RescheduleServiceParams>): Promise<AiActionExecutionResult> {
  const p = proposal.parameters;
  const existing = await getOccurrenceById(p.occurrenceId);
  if (!existing) return { success: false, resultSummary: "", errorMessage: "Ertelenecek servis kaydı artık bulunamıyor (silinmiş olabilir)." };

  const durationMinutes = timeDiffMinutes(existing.startTime, existing.endTime);
  const newEndTime = addMinutes(p.newStartTime, durationMinutes);
  await updateOccurrence(p.occurrenceId, { periodDate: p.newDate, startTime: p.newStartTime, endTime: newEndTime });

  const verify = await getOccurrenceById(p.occurrenceId);
  if (!verify || verify.periodDate !== p.newDate || verify.startTime !== p.newStartTime) {
    return { success: false, resultSummary: "", errorMessage: "Erteleme kaydedildi ancak doğrulanamadı." };
  }

  return {
    success: true,
    resultSummary: `Servis ${p.newDate} tarihine, saat ${p.newStartTime}'a ertelendi.`,
    navigation: { label: "Servisleri Aç", href: AI_ROUTES.services() },
  };
}

async function runAssignTechnician(proposal: AiActionProposal<AssignTechnicianParams>): Promise<AiActionExecutionResult> {
  const p = proposal.parameters;
  const existing = await getOccurrenceById(p.occurrenceId);
  if (!existing) return { success: false, resultSummary: "", errorMessage: "İlgili servis kaydı artık bulunamıyor (silinmiş olabilir)." };

  await updateOccurrence(p.occurrenceId, { personnelName: p.technicianName });

  const verify = await getOccurrenceById(p.occurrenceId);
  if (!verify || verify.personnelName !== p.technicianName) {
    return { success: false, resultSummary: "", errorMessage: "Atama kaydedildi ancak doğrulanamadı." };
  }

  return {
    success: true,
    resultSummary: `${p.technicianName} servise atandı.`,
    navigation: { label: "Servisleri Aç", href: AI_ROUTES.services() },
  };
}

async function runCreateFollowupTask(proposal: AiActionProposal<CreateFollowupTaskParams>): Promise<AiActionExecutionResult> {
  const p = proposal.parameters;
  const id = `followup-task-${Date.now()}`;
  addFollowupTask({
    id,
    title: p.title,
    description: p.description,
    relatedEntityType: p.relatedEntityType,
    relatedEntityId: p.relatedEntityId,
    relatedEntityName: p.relatedEntityName,
    dueDate: p.dueDate,
    responsible: p.responsible,
    priority: p.priority,
    status: "open",
    createdByUserId: proposal.requestedBy.userId,
    createdAt: new Date().toISOString(),
  });

  return {
    success: true,
    resultSummary: `"${p.title}" görevi ${p.responsible} için oluşturuldu.`,
  };
}

async function runSendEmail(proposal: AiActionProposal<PrepareEmailParams>): Promise<AiActionExecutionResult> {
  const p = proposal.parameters;

  if (proposal.actionType === "prepare_email") {
    // SMTP yapılandırılmadığı için gerçek gönderim yapılamaz — spesifikasyonun
    // zorunlu kıldığı açık bilgilendirme metni aynen kullanılır.
    return {
      success: true,
      resultSummary: `WhatsApp gönderim entegrasyonu değil, e-posta gönderim entegrasyonu henüz yapılandırılmadığı için mesaj taslağı hazırlandı ancak gönderilmedi. Alıcı: ${p.recipientEmail}, Konu: ${p.subject}`,
    };
  }

  let res: Response;
  try {
    res = await fetch("/api/ai/actions/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        toEmail: p.recipientEmail,
        subject: p.subject,
        body: p.body,
      }),
    });
  } catch {
    return { success: false, resultSummary: "", errorMessage: "E-posta sunucusuna bağlanılamadı." };
  }

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({ message: "E-posta gönderilemedi." }));
    return { success: false, resultSummary: "", errorMessage: errBody.message ?? "E-posta gönderilemedi." };
  }

  return { success: true, resultSummary: `E-posta ${p.recipientEmail} adresine gönderildi.` };
}

async function runSendWhatsApp(proposal: AiActionProposal<SendWhatsAppMessageParams>): Promise<AiActionExecutionResult> {
  const p = proposal.parameters;
  const template = WHATSAPP_TEMPLATES[p.templateId as keyof typeof WHATSAPP_TEMPLATES];
  if (!template) return { success: false, resultSummary: "", errorMessage: "Geçersiz WhatsApp şablonu." };

  const messageId = `wa-msg-${Date.now()}`;
  saveWhatsAppMessage({
    id: messageId,
    proposalId: proposal.id,
    providerMessageId: null,
    recipientPhone: p.recipientPhone,
    recipientName: p.recipientName,
    templateId: p.templateId,
    relatedCustomerId: p.customerId,
    status: "submitted",
    failureCode: null,
    failureDescription: null,
    userId: proposal.requestedBy.userId,
    submittedAt: new Date().toISOString(),
    deliveredAt: null,
    readAt: null,
    createdAt: new Date().toISOString(),
  });

  let res: Response;
  try {
    res = await fetch("/api/whatsapp/messages/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to: p.recipientPhone, templateName: template.providerTemplateName, languageCode: template.language, bodyVariables: p.bodyVariables }),
    });
  } catch {
    saveWhatsAppMessage({
      id: messageId,
      proposalId: proposal.id,
      providerMessageId: null,
      recipientPhone: p.recipientPhone,
      recipientName: p.recipientName,
      templateId: p.templateId,
      relatedCustomerId: p.customerId,
      status: "failed",
      failureCode: "network_error",
      failureDescription: "WhatsApp sunucusuna bağlanılamadı.",
      userId: proposal.requestedBy.userId,
      submittedAt: new Date().toISOString(),
      deliveredAt: null,
      readAt: null,
      createdAt: new Date().toISOString(),
    });
    return { success: false, resultSummary: "", errorMessage: "WhatsApp sunucusuna bağlanılamadı." };
  }

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({ message: "WhatsApp mesajı gönderilemedi." }));
    saveWhatsAppMessage({
      id: messageId,
      proposalId: proposal.id,
      providerMessageId: null,
      recipientPhone: p.recipientPhone,
      recipientName: p.recipientName,
      templateId: p.templateId,
      relatedCustomerId: p.customerId,
      status: "failed",
      failureCode: errBody.errorCode ?? String(res.status),
      failureDescription: errBody.message ?? "WhatsApp mesajı gönderilemedi.",
      userId: proposal.requestedBy.userId,
      submittedAt: new Date().toISOString(),
      deliveredAt: null,
      readAt: null,
      createdAt: new Date().toISOString(),
    });
    return { success: false, resultSummary: "", errorMessage: errBody.message ?? "WhatsApp mesajı gönderilemedi." };
  }

  const data = (await res.json()) as { providerMessageId?: string };
  saveWhatsAppMessage({
    id: messageId,
    proposalId: proposal.id,
    providerMessageId: data.providerMessageId ?? null,
    recipientPhone: p.recipientPhone,
    recipientName: p.recipientName,
    templateId: p.templateId,
    relatedCustomerId: p.customerId,
    status: "sent",
    failureCode: null,
    failureDescription: null,
    userId: proposal.requestedBy.userId,
    submittedAt: new Date().toISOString(),
    deliveredAt: null,
    readAt: null,
    createdAt: new Date().toISOString(),
  });

  // Not: "delivered"/"read" durumu YALNIZCA gerçek webhook olayları geldiğinde
  // ayarlanır (bkz. /api/whatsapp/webhook/route.ts) — sağlayıcının isteği
  // kabul etmesi hiçbir zaman "teslim edildi" olarak işaretlenmez.
  return { success: true, resultSummary: `WhatsApp mesajı ${p.recipientPhone} numarasına gönderildi.` };
}

/** Tek gerçek yürütme giriş noktası — yalnızca açık kullanıcı onayından sonra çağrılır. */
export async function executeConfirmedAction(userId: string, userRole: string, proposalId: string): Promise<AiActionProposal | null> {
  const executing = tryConsumeProposal(userId, proposalId);
  if (!executing) return getProposal(userId, proposalId);

  if (!executing.permissions.allowed) {
    const failed = fail(executing, executing.permissions.reason ?? "Bu işlemi gerçekleştirmek için gerekli yetkiye sahip değilsiniz.");
    saveProposal(userId, failed);
    logAudit(failed, userRole);
    return failed;
  }
  if (!executing.validation.isValid) {
    const failed = fail(executing, "Bu öneri geçerli değil, onaylanamaz.");
    saveProposal(userId, failed);
    logAudit(failed, userRole);
    return failed;
  }

  let result: AiActionExecutionResult;
  try {
    switch (executing.actionType) {
      case "create_service":
        result = await runCreateService(executing as unknown as AiActionProposal<CreateServiceParams>);
        break;
      case "reschedule_service":
        result = await runRescheduleService(executing as unknown as AiActionProposal<RescheduleServiceParams>);
        break;
      case "assign_technician":
        result = await runAssignTechnician(executing as unknown as AiActionProposal<AssignTechnicianParams>);
        break;
      case "create_followup_task":
        result = await runCreateFollowupTask(executing as unknown as AiActionProposal<CreateFollowupTaskParams>);
        break;
      case "prepare_email":
      case "send_email":
        result = await runSendEmail(executing as unknown as AiActionProposal<PrepareEmailParams>);
        break;
      case "send_whatsapp_message":
        result = await runSendWhatsApp(executing as unknown as AiActionProposal<SendWhatsAppMessageParams>);
        break;
      default:
        result = { success: false, resultSummary: "", errorMessage: "Bilinmeyen aksiyon türü." };
    }
  } catch {
    result = { success: false, resultSummary: "", errorMessage: "İşlem sırasında beklenmeyen bir hata oluştu." };
  }

  const finalProposal = result.success ? complete(executing, result) : fail(executing, result.errorMessage ?? "İşlem başarısız oldu.");
  saveProposal(userId, finalProposal);
  logAudit(finalProposal, userRole);
  return finalProposal;
}

export function cancelProposal(userId: string, proposalId: string): AiActionProposal | null {
  const proposal = getProposal(userId, proposalId);
  if (!proposal || proposal.status !== "pending_confirmation") return proposal;
  const cancelled: AiActionProposal = { ...proposal, status: "cancelled" };
  saveProposal(userId, cancelled);
  return cancelled;
}

function logAudit(proposal: AiActionProposal, userRole: string) {
  logAiAction({
    userId: proposal.requestedBy.userId,
    userRole,
    proposalId: proposal.id,
    actionType: proposal.actionType,
    targetEntityType: proposal.target?.entityType ?? null,
    targetEntityId: proposal.target?.entityId ?? null,
    targetEntityName: proposal.target?.entityName ?? null,
    parametersSummary: JSON.stringify(proposal.parameters).slice(0, 300),
    validationPassed: proposal.validation.isValid,
    permissionAllowed: proposal.permissions.allowed,
    resultStatus: proposal.status,
    errorMessage: proposal.errorMessage,
  });
}

function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + minutes;
  const hh = Math.floor((total % (24 * 60)) / 60);
  const mm = total % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

function timeDiffMinutes(start: string, end: string): number {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return eh * 60 + em - (sh * 60 + sm);
}

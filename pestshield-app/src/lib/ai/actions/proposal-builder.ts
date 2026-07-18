// PestShield AI Command Center — Faz 3 öneri (proposal) üretimi.
//
// Bu dosya, propose_* tool'larının GERÇEK çalışma mantığıdır: varlık
// çözümleme (resolvers.ts), iş kuralı doğrulama ve izin kontrolü burada
// birleştirilir ve kullanıcıya Türkçe, okunabilir bir önizleme (before/after)
// üretilir. HİÇBİR YAZMA İŞLEMİ YOKTUR — sadece bir AiActionProposal nesnesi
// oluşturulup proposal-store'a "pending_confirmation" durumunda kaydedilir.
// Gerçek yazma yalnızca kullanıcı onayından sonra executors.ts'de olur.
//
// Varlık çözümleme birden fazla eşleşme bulursa ("ABC" birden fazla müşteriyle
// eşleşiyorsa vb.) proposal HİÇ oluşturulmaz — bunun yerine mevcut Faz 1/2
// "clarification" akışı yeniden kullanılır (kullanıcı sohbette netleştirir,
// sonra tool tekrar çağrılır). Bu, ayrı bir "action_entity_selection" UI'ı
// gerektirmeden aynı güvenli sonucu verir.

import type { Customer, ServiceOrder } from "@/lib/mock/crm";
import { getCompanySettings } from "@/lib/company-settings";
import { getSmtpMailConnection } from "@/lib/integrations/smtp-mail";
import {
  resolveCustomerForAction,
  resolveTechnicianForAction,
  resolveOccurrenceForAction,
  resolveServiceOrderForAction,
  findTechnicianConflict,
  type ResolvedOccurrence,
} from "@/lib/ai/actions/resolvers";
import { checkActionPermission } from "@/lib/ai/actions/permissions";
import { newExpiresAt, saveProposal } from "@/lib/ai/actions/proposal-store";
import { EMAIL_TEMPLATE_LABELS, resolveEmailTemplate, type EmailTemplateId } from "@/lib/ai/actions/email-templates";
import { toE164, isValidE164 } from "@/lib/whatsapp/phone-normalizer";
import { WHATSAPP_TEMPLATES, resolveWhatsAppTemplate, type WhatsAppTemplateId } from "@/lib/whatsapp/templates";
import type {
  AiActionFieldChange,
  AiActionProposal,
  AiActionValidationIssue,
  AiActionValidationResult,
  AssignTechnicianParams,
  CreateFollowupTaskParams,
  CreateServiceParams,
  PrepareEmailParams,
  RescheduleServiceParams,
  SendWhatsAppMessageParams,
} from "@/lib/ai/actions/types";
import type { AiToolResult } from "@/lib/ai/types";

const MONTHS_TR = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];

function formatDateTr(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return `${d} ${MONTHS_TR[m - 1]} ${y}`;
}

function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + minutes;
  const hh = Math.floor((total % (24 * 60)) / 60);
  const mm = total % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

function newId(): string {
  return `ai-action-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function withIssues(errors: AiActionValidationIssue[], warnings: AiActionValidationIssue[]): AiActionValidationResult {
  return { isValid: errors.length === 0, errors, warnings };
}

function clarification(message: string, candidates: Customer[]): AiToolResult {
  return {
    responseType: "clarification",
    message,
    candidates: candidates.map((c) => ({ customerId: c.id, companyName: c.companyName, city: c.city })),
    source: { recordCount: candidates.length },
  };
}

function emptyState(message: string): AiToolResult {
  return { responseType: "empty_state", message, source: { recordCount: 0 } };
}

function actionResult<TParams>(proposal: AiActionProposal<TParams>): AiToolResult {
  // TParams (CreateServiceParams vb.) her aksiyon için ayrı tiplenir, ama
  // AiToolResult.proposal ve proposal-store dışa doğru tek bir genel
  // AiActionProposal şekli kullanır — sınır burada, tek yerde geçilir.
  const generic = proposal as unknown as AiActionProposal;
  saveProposal(generic.requestedBy.userId, generic);
  return { responseType: "action_proposal", message: generic.description, proposal: generic, source: { recordCount: 1 } };
}

interface RequestedBy {
  userId: string;
  role: string;
}

// ---------------------------------------------------------------------------
// create_service — mevcut bir hizmet sözleşmesi altına yeni, tarihli bir
// servis ziyareti (PeriyotOccurrence) eklenmesini önerir. Bu uygulamada
// "servis" kaydı, fiyatlandırma bilgisi içeren ServiceOrder (sözleşme) değil,
// PeriyotOccurrence'tır (bkz. periyot-store.ts) — bu yüzden burada YENİ bir
// ücretli sözleşme UYDURULMAZ; sözleşme yoksa açıkça reddedilir.
// ---------------------------------------------------------------------------
export async function buildCreateServiceProposal(params: Record<string, unknown>, requestedBy: RequestedBy, todayIso: string): Promise<AiToolResult> {
  const customerName = String(params.customerName ?? "");
  const { customer, candidates } = await resolveCustomerForAction(customerName);
  if (candidates.length > 1) return clarification(`Bu isimle birden fazla müşteri buldum (${candidates.length}). Hangisini kastettiniz?`, candidates);
  if (!customer) return emptyState(`"${customerName}" adında bir müşteri bulamadım.`);

  const { serviceOrder, candidates: orderCandidates } = await resolveServiceOrderForAction(customer.id, String(params.serviceType ?? ""));
  if (!serviceOrder && orderCandidates.length === 0) {
    return emptyState(`${customer.companyName} için sistemde kayıtlı bir hizmet sözleşmesi bulunamadı. Yeni servis oluşturmadan önce Hizmetler modülünden bir hizmet sözleşmesi eklenmelidir (fiyatlandırma bilgisi gerektirdiği için bu adım AI üzerinden yapılamaz).`);
  }
  if (!serviceOrder) {
    const list = orderCandidates.map((o) => `${o.serviceNo} — ${o.description || "Açıklama yok"}`).join("; ");
    return { responseType: "clarification", message: `${customer.companyName} için birden fazla hizmet sözleşmesi var, hangisi için servis oluşturayım? ${list}`, source: { recordCount: orderCandidates.length } };
  }

  const date = String(params.date ?? "");
  const startTime = String(params.startTime ?? "");
  const durationMinutes = Math.max(15, Math.min(Number(params.durationMinutes ?? 60), 480));
  const endTime = addMinutes(startTime, durationMinutes);
  const technicianNameParam = params.technicianName ? String(params.technicianName) : "";

  const errors: AiActionValidationIssue[] = [];
  const warnings: AiActionValidationIssue[] = [];

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) errors.push({ field: "date", message: "Geçerli bir tarih belirtilmedi." });
  else if (date < todayIso) errors.push({ field: "date", message: "Geçmiş bir tarihe servis oluşturulamaz." });
  if (!/^\d{2}:\d{2}$/.test(startTime)) errors.push({ field: "startTime", message: "Geçerli bir başlangıç saati belirtilmedi." });
  if (customer.status !== "active") warnings.push({ message: `${customer.companyName} pasif durumda görünüyor.` });

  let technicianName = "";
  if (technicianNameParam) {
    const { technician, candidates: techCandidates } = await resolveTechnicianForAction(technicianNameParam);
    if (techCandidates.length > 1) errors.push({ field: "technicianName", message: `"${technicianNameParam}" ile birden fazla teknisyen eşleşti, lütfen tam adı belirtin.` });
    else if (!technician) errors.push({ field: "technicianName", message: `"${technicianNameParam}" adında bir teknisyen bulunamadı.` });
    else {
      technicianName = technician.name;
      if (technician.status !== "active") warnings.push({ message: `${technician.name} şu anda aktif durumda değil (${technician.status}).` });
      if (errors.length === 0 && date && startTime) {
        const conflict = await findTechnicianConflict(technicianName, date, startTime, endTime);
        if (conflict) warnings.push({ message: `${technicianName} bu saat aralığında başka bir servise atanmış görünüyor (${conflict.periodDate} ${conflict.startTime}–${conflict.endTime}).` });
      }
    }
  }

  const notes = params.notes ? String(params.notes) : "";
  const validation = withIssues(errors, warnings);
  const permission = checkActionPermission("create_service", requestedBy.role);

  const after: AiActionFieldChange[] = [
    { label: "Müşteri", before: null, after: customer.companyName },
    { label: "Hizmet Sözleşmesi", before: null, after: `${serviceOrder.serviceNo} — ${serviceOrder.description || "Açıklama yok"}` },
    { label: "Tarih", before: null, after: date ? formatDateTr(date) : "—" },
    { label: "Saat", before: null, after: startTime ? `${startTime} – ${endTime}` : "—" },
    { label: "Teknisyen", before: null, after: technicianName || "Atanmadı" },
  ];
  if (notes) after.push({ label: "Not", before: null, after: notes });

  const params_: CreateServiceParams = {
    customerId: customer.id,
    customerName: customer.companyName,
    serviceType: serviceOrder.description,
    date,
    startTime,
    durationMinutes,
    technicianName: technicianName || undefined,
    notes: notes || undefined,
  };

  const id = newId();
  const proposal: AiActionProposal<CreateServiceParams> = {
    id,
    actionType: "create_service",
    status: "pending_confirmation",
    title: "Yeni Servis Oluşturma",
    description: `${customer.companyName} için ${date ? formatDateTr(date) : "belirtilmeyen tarihte"}${startTime ? ` saat ${startTime}'da` : ""} ${serviceOrder.description || "servis"} oluşturulacak.`,
    requestedBy,
    target: { entityType: "service_order", entityId: serviceOrder.id, entityName: serviceOrder.description || serviceOrder.serviceNo },
    parameters: params_,
    before: null,
    after,
    warnings: warnings.map((w) => w.message),
    validation,
    permissions: permission,
    idempotencyKey: id,
    createdAt: new Date().toISOString(),
    expiresAt: newExpiresAt(),
  };
  return actionResult(proposal);
}

// ---------------------------------------------------------------------------
// reschedule_service — var olan bir PeriyotOccurrence'ın tarih/saatini
// değiştirmeyi önerir. Faz 3.1 kapsamında yalnızca tekil kayıt ("yalnızca bu
// servis") desteklenir — tekrarlayan seri kapsamı (this_and_following/
// all_series) için güvenli, doğrulanmış bir toplu değişiklik mantığı henüz
// yok; bu Faz 3.2'ye bırakıldı (bkz. final rapor).
// ---------------------------------------------------------------------------
export async function buildRescheduleServiceProposal(params: Record<string, unknown>, requestedBy: RequestedBy, todayIso: string): Promise<AiToolResult> {
  const customerName = String(params.customerName ?? "");
  const { customer, candidates } = await resolveCustomerForAction(customerName);
  if (candidates.length > 1) return clarification(`Bu isimle birden fazla müşteri buldum (${candidates.length}). Hangisini kastettiniz?`, candidates);
  if (!customer) return emptyState(`"${customerName}" adında bir müşteri bulamadım.`);

  const currentDate = String(params.currentDate ?? "");
  const currentStartTime = params.currentStartTime ? String(params.currentStartTime) : undefined;
  const { occurrence: resolved, candidates: occCandidates } = await resolveOccurrenceForAction(customer.id, currentDate, currentStartTime);
  if (occCandidates.length > 1) {
    const list = occCandidates.map((c) => `${c.occurrence.startTime}–${c.occurrence.endTime}`).join(", ");
    return { responseType: "clarification", message: `${customer.companyName} için ${currentDate} tarihinde birden fazla servis var (${list}). Hangisini erteleyeyim? Lütfen saat belirtin.`, source: { recordCount: occCandidates.length } };
  }
  if (!resolved) return emptyState(`${customer.companyName} için ${currentDate} tarihinde bir servis kaydı bulamadım.`);

  const newDate = String(params.newDate ?? "");
  const newStartTime = String(params.newStartTime ?? "");
  const durationMinutes = timeDiffMinutes(resolved.occurrence.startTime, resolved.occurrence.endTime);
  const newEndTime = addMinutes(newStartTime, durationMinutes);

  const errors: AiActionValidationIssue[] = [];
  const warnings: AiActionValidationIssue[] = [];
  if (!/^\d{4}-\d{2}-\d{2}$/.test(newDate)) errors.push({ field: "newDate", message: "Geçerli bir yeni tarih belirtilmedi." });
  else if (newDate < todayIso) errors.push({ field: "newDate", message: "Geçmiş bir tarihe erteleme yapılamaz." });
  if (!/^\d{2}:\d{2}$/.test(newStartTime)) errors.push({ field: "newStartTime", message: "Geçerli bir yeni saat belirtilmedi." });

  if (errors.length === 0 && resolved.occurrence.personnelName?.trim()) {
    const conflict = await findTechnicianConflict(resolved.occurrence.personnelName, newDate, newStartTime, newEndTime, resolved.occurrence.id);
    if (conflict) warnings.push({ message: `${resolved.occurrence.personnelName} bu yeni saat aralığında başka bir servise atanmış görünüyor.` });
  }

  const validation = withIssues(errors, warnings);
  const permission = checkActionPermission("reschedule_service", requestedBy.role);

  const before: AiActionFieldChange[] = [
    { label: "Tarih", before: null, after: formatDateTr(resolved.occurrence.periodDate) },
    { label: "Saat", before: null, after: `${resolved.occurrence.startTime} – ${resolved.occurrence.endTime}` },
  ];
  const after: AiActionFieldChange[] = [
    { label: "Tarih", before: formatDateTr(resolved.occurrence.periodDate), after: newDate ? formatDateTr(newDate) : "—" },
    { label: "Saat", before: `${resolved.occurrence.startTime} – ${resolved.occurrence.endTime}`, after: newStartTime ? `${newStartTime} – ${newEndTime}` : "—" },
  ];

  const actionParams: RescheduleServiceParams = { occurrenceId: resolved.occurrence.id, newDate, newStartTime, scope: "only_this" };
  const id = newId();
  const proposal: AiActionProposal<RescheduleServiceParams> = {
    id,
    actionType: "reschedule_service",
    status: "pending_confirmation",
    title: "Servis Erteleme",
    description: `${customer.companyName} için ${formatDateTr(resolved.occurrence.periodDate)} tarihli servis, ${newDate ? formatDateTr(newDate) : "belirtilmeyen tarihe"}${newStartTime ? ` saat ${newStartTime}'a` : ""} ertelenecek.`,
    requestedBy,
    target: { entityType: "occurrence", entityId: resolved.occurrence.id, entityName: `${customer.companyName} — ${resolved.occurrence.periodDate}` },
    parameters: actionParams,
    before,
    after,
    warnings: warnings.map((w) => w.message),
    validation,
    permissions: permission,
    idempotencyKey: id,
    createdAt: new Date().toISOString(),
    expiresAt: newExpiresAt(),
  };
  return actionResult(proposal);
}

// ---------------------------------------------------------------------------
// assign_technician — var olan bir PeriyotOccurrence'ın personnelName alanını
// değiştirmeyi önerir.
// ---------------------------------------------------------------------------
export async function buildAssignTechnicianProposal(params: Record<string, unknown>, requestedBy: RequestedBy): Promise<AiToolResult> {
  const customerName = String(params.customerName ?? "");
  const { customer, candidates } = await resolveCustomerForAction(customerName);
  if (candidates.length > 1) return clarification(`Bu isimle birden fazla müşteri buldum (${candidates.length}). Hangisini kastettiniz?`, candidates);
  if (!customer) return emptyState(`"${customerName}" adında bir müşteri bulamadım.`);

  const date = String(params.date ?? "");
  const startTime = params.startTime ? String(params.startTime) : undefined;
  const { occurrence: resolved, candidates: occCandidates } = await resolveOccurrenceForAction(customer.id, date, startTime);
  if (occCandidates.length > 1) {
    const list = occCandidates.map((c) => `${c.occurrence.startTime}–${c.occurrence.endTime}`).join(", ");
    return { responseType: "clarification", message: `${customer.companyName} için ${date} tarihinde birden fazla servis var (${list}). Hangisine teknisyen atayayım? Lütfen saat belirtin.`, source: { recordCount: occCandidates.length } };
  }
  if (!resolved) return emptyState(`${customer.companyName} için ${date} tarihinde bir servis kaydı bulamadım.`);

  const technicianNameParam = String(params.technicianName ?? "");
  const { technician, candidates: techCandidates } = await resolveTechnicianForAction(technicianNameParam);

  const errors: AiActionValidationIssue[] = [];
  const warnings: AiActionValidationIssue[] = [];
  if (techCandidates.length > 1) errors.push({ field: "technicianName", message: `"${technicianNameParam}" ile birden fazla teknisyen eşleşti, lütfen tam adı belirtin.` });
  else if (!technician) errors.push({ field: "technicianName", message: `"${technicianNameParam}" adında bir teknisyen bulunamadı.` });
  else if (technician.status !== "active") warnings.push({ message: `${technician.name} şu anda aktif durumda değil (${technician.status}).` });

  if (technician && errors.length === 0) {
    const conflict = await findTechnicianConflict(technician.name, resolved.occurrence.periodDate, resolved.occurrence.startTime, resolved.occurrence.endTime, resolved.occurrence.id);
    if (conflict) warnings.push({ message: `${technician.name} bu saat aralığında başka bir servise atanmış görünüyor (${conflict.periodDate} ${conflict.startTime}–${conflict.endTime}).` });
  }

  const validation = withIssues(errors, warnings);
  const permission = checkActionPermission("assign_technician", requestedBy.role);

  const previousName = resolved.occurrence.personnelName?.trim() || null;
  const before: AiActionFieldChange[] = [{ label: "Teknisyen", before: null, after: previousName ?? "Atanmadı" }];
  const after: AiActionFieldChange[] = [{ label: "Teknisyen", before: previousName, after: technician?.name ?? technicianNameParam }];

  const actionParams: AssignTechnicianParams = { occurrenceId: resolved.occurrence.id, technicianName: technician?.name ?? technicianNameParam, previousTechnicianName: previousName };
  const id = newId();
  const proposal: AiActionProposal<AssignTechnicianParams> = {
    id,
    actionType: "assign_technician",
    status: "pending_confirmation",
    title: "Teknisyen Atama",
    description: `${customer.companyName} için ${formatDateTr(resolved.occurrence.periodDate)} tarihli servise ${technician?.name ?? technicianNameParam} atanacak${previousName ? ` (önceki: ${previousName})` : ""}.`,
    requestedBy,
    target: { entityType: "occurrence", entityId: resolved.occurrence.id, entityName: `${customer.companyName} — ${resolved.occurrence.periodDate}` },
    parameters: actionParams,
    before,
    after,
    warnings: warnings.map((w) => w.message),
    validation,
    permissions: permission,
    idempotencyKey: id,
    createdAt: new Date().toISOString(),
    expiresAt: newExpiresAt(),
  };
  return actionResult(proposal);
}

// ---------------------------------------------------------------------------
// create_followup_task — yeni bir takip görevi önerir (bkz. followup-task-store.ts).
// ---------------------------------------------------------------------------
export async function buildCreateFollowupTaskProposal(params: Record<string, unknown>, requestedBy: RequestedBy, todayIso: string): Promise<AiToolResult> {
  const title = String(params.title ?? "").trim();
  const dueDate = String(params.dueDate ?? "");
  const responsible = String(params.responsible ?? "").trim();
  const description = params.description ? String(params.description) : "";
  const priority = (params.priority === "low" || params.priority === "high" ? params.priority : "normal") as "low" | "normal" | "high";

  let relatedCustomer: Customer | null = null;
  if (params.relatedCustomerName) {
    const { customer, candidates } = await resolveCustomerForAction(String(params.relatedCustomerName));
    if (candidates.length > 1) return clarification(`Bu isimle birden fazla müşteri buldum (${candidates.length}). Hangisini kastettiniz?`, candidates);
    relatedCustomer = customer;
  }

  const errors: AiActionValidationIssue[] = [];
  const warnings: AiActionValidationIssue[] = [];
  if (!title) errors.push({ field: "title", message: "Görev başlığı belirtilmedi." });
  if (!responsible) errors.push({ field: "responsible", message: "Sorumlu kişi belirtilmedi." });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) errors.push({ field: "dueDate", message: "Geçerli bir bitiş tarihi belirtilmedi." });
  else if (dueDate < todayIso) warnings.push({ message: "Bitiş tarihi bugünden önce — göreve gecikmiş olarak başlanacak." });

  const validation = withIssues(errors, warnings);
  const permission = checkActionPermission("create_followup_task", requestedBy.role);

  const after: AiActionFieldChange[] = [
    { label: "Başlık", before: null, after: title || "—" },
    { label: "Sorumlu", before: null, after: responsible || "—" },
    { label: "Bitiş Tarihi", before: null, after: dueDate ? formatDateTr(dueDate) : "—" },
    { label: "Öncelik", before: null, after: priority === "high" ? "Yüksek" : priority === "low" ? "Düşük" : "Normal" },
  ];
  if (relatedCustomer) after.push({ label: "İlgili Müşteri", before: null, after: relatedCustomer.companyName });
  if (description) after.push({ label: "Açıklama", before: null, after: description });

  const actionParams: CreateFollowupTaskParams = {
    title,
    description,
    relatedEntityType: relatedCustomer ? "customer" : undefined,
    relatedEntityId: relatedCustomer?.id,
    relatedEntityName: relatedCustomer?.companyName,
    dueDate,
    responsible,
    priority,
  };
  const id = newId();
  const proposal: AiActionProposal<CreateFollowupTaskParams> = {
    id,
    actionType: "create_followup_task",
    status: "pending_confirmation",
    title: "Takip Görevi Oluşturma",
    description: `"${title || "—"}" görevi ${responsible || "belirtilmeyen sorumlu"} için ${dueDate ? formatDateTr(dueDate) : "belirtilmeyen tarihe"} kadar oluşturulacak.`,
    requestedBy,
    target: relatedCustomer ? { entityType: "customer", entityId: relatedCustomer.id, entityName: relatedCustomer.companyName } : null,
    parameters: actionParams,
    before: null,
    after,
    warnings: warnings.map((w) => w.message),
    validation,
    permissions: permission,
    idempotencyKey: id,
    createdAt: new Date().toISOString(),
    expiresAt: newExpiresAt(),
  };
  return actionResult(proposal);
}

// ---------------------------------------------------------------------------
// prepare_email / send_email — bir e-posta taslağı hazırlar. SMTP bağlıysa
// gerçek gönderim için "send_email" aksiyonu, değilse yalnızca taslak için
// "prepare_email" aksiyonu üretilir (bkz. spesifikasyon: "Email sending only
// if an existing provider is already configured").
// ---------------------------------------------------------------------------
export async function buildPrepareEmailProposal(params: Record<string, unknown>, requestedBy: RequestedBy): Promise<AiToolResult> {
  const customerName = String(params.customerName ?? "");
  const { customer, candidates } = await resolveCustomerForAction(customerName);
  if (candidates.length > 1) return clarification(`Bu isimle birden fazla müşteri buldum (${candidates.length}). Hangisini kastettiniz?`, candidates);
  if (!customer) return emptyState(`"${customerName}" adında bir müşteri bulamadım.`);

  const templateId = String(params.templateId ?? "") as EmailTemplateId;
  const validTemplates: EmailTemplateId[] = ["service_appointment_confirmation", "payment_reminder", "service_report_delivery"];
  const errors: AiActionValidationIssue[] = [];
  const warnings: AiActionValidationIssue[] = [];

  if (!validTemplates.includes(templateId)) errors.push({ field: "templateId", message: "Geçerli bir e-posta şablonu belirtilmedi." });

  const recipientEmail = params.recipientEmailOverride ? String(params.recipientEmailOverride) : customer.contactEmail;
  if (!recipientEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail)) {
    errors.push({ field: "recipientEmail", message: `${customer.companyName} için kayıtlı geçerli bir e-posta adresi bulunamadı. Lütfen alıcı e-posta adresini belirtin.` });
  }

  const company = getCompanySettings();
  const smtp = getSmtpMailConnection();
  const canSend = smtp.connected && Boolean(smtp.host) && Boolean(smtp.fromEmail);

  let subject = "";
  let body = "";
  if (validTemplates.includes(templateId)) {
    const resolved = resolveEmailTemplate(templateId, {
      customerName: customer.companyName,
      contactName: customer.contactName,
      amount: params.amount ? String(params.amount) : undefined,
      dueDate: params.dueDate ? String(params.dueDate) : undefined,
      reportLink: params.reportLink ? String(params.reportLink) : undefined,
      serviceDate: params.serviceDate ? String(params.serviceDate) : undefined,
      serviceTime: params.serviceTime ? String(params.serviceTime) : undefined,
      technicianName: params.technicianName ? String(params.technicianName) : undefined,
      companyName: company.companyName || "PestShield",
      companyPhone: company.phone || undefined,
    });
    subject = resolved.subject;
    body = resolved.body;
  }

  if (!canSend) warnings.push({ message: "SMTP e-posta entegrasyonu henüz yapılandırılmadığı için mesaj taslağı hazırlanacak ancak gönderilmeyecek." });

  const validation = withIssues(errors, warnings);
  const permission = checkActionPermission(canSend ? "send_email" : "prepare_email", requestedBy.role);

  const after: AiActionFieldChange[] = [
    { label: "Alıcı", before: null, after: `${customer.contactName || customer.companyName} <${recipientEmail || "—"}>` },
    { label: "Şablon", before: null, after: validTemplates.includes(templateId) ? EMAIL_TEMPLATE_LABELS[templateId] : "—" },
    { label: "Konu", before: null, after: subject || "—" },
    { label: "İçerik", before: null, after: body || "—" },
  ];

  const actionParams: PrepareEmailParams = { recipientEmail, recipientName: customer.contactName || customer.companyName, subject, body, templateId };
  const id = newId();
  const proposal: AiActionProposal<PrepareEmailParams> = {
    id,
    actionType: canSend ? "send_email" : "prepare_email",
    status: "pending_confirmation",
    title: canSend ? "E-posta Gönderimi" : "E-posta Taslağı",
    description: canSend
      ? `${customer.companyName} adresine (${recipientEmail || "—"}) "${subject || "—"}" konulu e-posta gönderilecek.`
      : `${customer.companyName} için "${subject || "—"}" konulu bir e-posta taslağı hazırlanacak (SMTP yapılandırılmadığı için gönderilmeyecek).`,
    requestedBy,
    target: { entityType: "customer", entityId: customer.id, entityName: customer.companyName },
    parameters: actionParams,
    before: null,
    after,
    warnings: warnings.map((w) => w.message),
    validation,
    permissions: permission,
    idempotencyKey: id,
    createdAt: new Date().toISOString(),
    expiresAt: newExpiresAt(),
  };
  return actionResult(proposal);
}

// ---------------------------------------------------------------------------
// send_whatsapp_message — Faz 4. Alıcı numarası ASLA uydurulmaz: müşterinin
// kayıtlı contactPhone alanından veya kullanıcının sohbette AÇIKÇA belirttiği
// bir numaradan gelir (recipientPhoneOverride). Gönderim SADECE resmi Meta
// WhatsApp Cloud API sağlayıcısı yapılandırılmışsa gerçekleşir (bkz.
// get-whatsapp-provider.ts) — yapılandırılmamışsa proposal yine oluşturulur
// ama executors.ts onaylandığında dürüstçe başarısız döner, asla "gönderildi"
// simüle ETMEZ.
// ---------------------------------------------------------------------------
export async function buildSendWhatsAppMessageProposal(params: Record<string, unknown>, requestedBy: RequestedBy): Promise<AiToolResult> {
  const customerName = String(params.customerName ?? "");
  const { customer, candidates } = await resolveCustomerForAction(customerName);
  if (candidates.length > 1) return clarification(`Bu isimle birden fazla müşteri buldum (${candidates.length}). Hangisini kastettiniz?`, candidates);
  if (!customer) return emptyState(`"${customerName}" adında bir müşteri bulamadım.`);

  const templateId = String(params.templateId ?? "") as WhatsAppTemplateId;
  const errors: AiActionValidationIssue[] = [];
  const warnings: AiActionValidationIssue[] = [];

  if (!WHATSAPP_TEMPLATES[templateId]) errors.push({ field: "templateId", message: "Geçerli bir WhatsApp şablonu belirtilmedi." });

  const rawPhone = params.recipientPhoneOverride ? String(params.recipientPhoneOverride) : customer.contactPhone;
  const normalizedPhone = rawPhone ? toE164(rawPhone) : "";
  if (!rawPhone || !isValidE164(normalizedPhone)) {
    errors.push({ field: "recipientPhone", message: `${customer.companyName} için kayıtlı geçerli bir telefon numarası bulunamadı. Lütfen alıcı numarasını belirtin.` });
  }

  let previewText = "";
  let bodyVariables: string[] = [];
  if (WHATSAPP_TEMPLATES[templateId]) {
    const resolved = resolveWhatsAppTemplate(templateId, {
      customerName: customer.companyName,
      serviceType: params.serviceType ? String(params.serviceType) : undefined,
      serviceDate: params.serviceDate ? String(params.serviceDate) : undefined,
      serviceTime: params.serviceTime ? String(params.serviceTime) : undefined,
      technicianName: params.technicianName ? String(params.technicianName) : undefined,
      amount: params.amount ? String(params.amount) : undefined,
      overdueDays: params.overdueDays ? String(params.overdueDays) : undefined,
    });
    previewText = resolved.previewText;
    bodyVariables = resolved.bodyVariables;
  }

  const template = WHATSAPP_TEMPLATES[templateId];
  if (template?.approvalStatus === "pending_approval") {
    warnings.push({ message: `"${template.label}" şablonu henüz Meta Business Manager'da onaylı olarak doğrulanamadı — gönderim sağlayıcı tarafından reddedilebilir.` });
  }

  const validation = withIssues(errors, warnings);
  const permission = checkActionPermission("send_whatsapp_message", requestedBy.role);

  const after: AiActionFieldChange[] = [
    { label: "Alıcı", before: null, after: `${customer.contactName || customer.companyName} <${normalizedPhone || "—"}>` },
    { label: "Şablon", before: null, after: template?.label ?? "—" },
    { label: "Önizleme", before: null, after: previewText || "—" },
  ];

  const actionParams: SendWhatsAppMessageParams = {
    customerId: customer.id,
    customerName: customer.companyName,
    recipientPhone: normalizedPhone,
    recipientName: customer.contactName || customer.companyName,
    templateId,
    bodyVariables,
    previewText,
  };
  const id = newId();
  const proposal: AiActionProposal<SendWhatsAppMessageParams> = {
    id,
    actionType: "send_whatsapp_message",
    status: "pending_confirmation",
    title: "WhatsApp Mesajı Gönderimi",
    description: `${customer.companyName} adresine (${normalizedPhone || "—"}) "${template?.label ?? "—"}" şablonuyla WhatsApp mesajı gönderilecek.`,
    requestedBy,
    target: { entityType: "customer", entityId: customer.id, entityName: customer.companyName },
    parameters: actionParams,
    before: null,
    after,
    warnings: warnings.map((w) => w.message),
    validation,
    permissions: permission,
    idempotencyKey: id,
    createdAt: new Date().toISOString(),
    expiresAt: newExpiresAt(),
  };
  return actionResult(proposal);
}

function timeDiffMinutes(start: string, end: string): number {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return eh * 60 + em - (sh * 60 + sm);
}

export type { ResolvedOccurrence, ServiceOrder };

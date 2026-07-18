import { beforeEach, describe, expect, it, vi } from "vitest";
import { toE164, isValidE164 } from "@/lib/whatsapp/phone-normalizer";
import { resolveWhatsAppTemplate, WHATSAPP_TEMPLATES } from "@/lib/whatsapp/templates";
import { TestWhatsAppProvider } from "@/lib/whatsapp/providers/test-whatsapp-provider";
import { checkPhase4Permission } from "@/lib/phase4-permissions";
import { checkActionPermission } from "@/lib/ai/actions/permissions";
import { saveWhatsAppMessage, getWhatsAppMessageByProposalId, listWhatsAppMessages } from "@/lib/whatsapp/message-store";

function fakeLocalStorage() {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value),
    removeItem: (key: string) => void store.delete(key),
    clear: () => store.clear(),
  };
}

describe("Faz 4 — Türkiye telefon numarası normalizasyonu", () => {
  it("yerel formatı E.164'e çevirir", () => {
    expect(toE164("0535 342 85 40")).toBe("+905353428540");
  });

  it("zaten 90 ile başlayan numarayı doğru işler", () => {
    expect(toE164("905353428540")).toBe("+905353428540");
  });

  it("geçerli E.164 formatını doğrular", () => {
    expect(isValidE164("+905353428540")).toBe(true);
    expect(isValidE164("905353428540")).toBe(false); // "+" eksik
    expect(isValidE164("+90")).toBe(false); // çok kısa
  });
});

describe("Faz 4 — WhatsApp şablon değişken çözümleme", () => {
  it("servis randevu hatırlatması şablonu sıralı değişkenleri doğru üretir", () => {
    const { bodyVariables, previewText } = resolveWhatsAppTemplate("service_appointment_reminder", {
      customerName: "ABC Gıda",
      serviceType: "Kemirgen Kontrol",
      serviceDate: "2026-07-15",
      serviceTime: "10:00",
      technicianName: "Mehmet Kaya",
    });
    expect(bodyVariables).toEqual(["ABC Gıda", "Kemirgen Kontrol", "2026-07-15", "10:00", "Mehmet Kaya"]);
    expect(previewText).toContain("ABC Gıda");
    expect(previewText).toContain("Mehmet Kaya");
  });

  it("her tanımlı şablonun onay durumu ve sağlayıcı adı bulunur (belirsiz bırakılmaz)", () => {
    for (const template of Object.values(WHATSAPP_TEMPLATES)) {
      expect(template.providerTemplateName).toBeTruthy();
      expect(["approved", "pending_approval"]).toContain(template.approvalStatus);
    }
  });
});

describe("Faz 4 — yetkilendirme", () => {
  it("TECH rolü WhatsApp gönderemez (whatsapp.send)", () => {
    expect(checkPhase4Permission("whatsapp.send", "TECH").allowed).toBe(false);
    expect(checkPhase4Permission("whatsapp.send", "ADMIN").allowed).toBe(true);
  });

  it("send_whatsapp_message aksiyonu Faz 3 izin çerçevesinde de TECH'i reddeder", () => {
    const result = checkActionPermission("send_whatsapp_message", "TECH");
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("Bu işlemi gerçekleştirmek için gerekli yetkiye sahip değilsiniz.");
  });
});

describe("Faz 4 — test sağlayıcı (yalnızca testlerde kullanılır)", () => {
  it("gönderilen mesajları kaydeder ve sağlayıcı mesaj ID'si döner", async () => {
    const provider = new TestWhatsAppProvider();
    const result = await provider.sendTemplateMessage({ to: "+905353428540", templateName: "pestshield_service_appointment_reminder", languageCode: "tr", bodyVariables: ["ABC Gıda"] });
    expect(result.success).toBe(true);
    expect(result.providerMessageId).toBeTruthy();
    expect(provider.sentMessages).toHaveLength(1);
  });
});

describe("Faz 4 — mesaj deposu (delivery tracking)", () => {
  beforeEach(() => {
    vi.stubGlobal("window", { localStorage: fakeLocalStorage() });
  });

  it("gönderim kaydı proposalId ile bulunabilir, sağlayıcı mesaj ID'si saklanır", () => {
    saveWhatsAppMessage({
      id: "wa-1",
      proposalId: "proposal-1",
      providerMessageId: "meta-msg-123",
      recipientPhone: "+905353428540",
      recipientName: "ABC Gıda",
      templateId: "service_appointment_reminder",
      relatedCustomerId: "cust-1",
      status: "sent",
      failureCode: null,
      failureDescription: null,
      userId: "user-1",
      submittedAt: new Date().toISOString(),
      deliveredAt: null,
      readAt: null,
      createdAt: new Date().toISOString(),
    });
    const found = getWhatsAppMessageByProposalId("proposal-1");
    expect(found?.providerMessageId).toBe("meta-msg-123");
    expect(found?.status).toBe("sent");
    // "sent" gönderimi asla otomatik olarak "delivered" değildir — yalnızca gerçek webhook olayı bunu değiştirebilir.
    expect(found?.deliveredAt).toBeNull();
  });

  it("listWhatsAppMessages en yeni kayıtları önce döner", () => {
    saveWhatsAppMessage({
      id: "wa-old",
      proposalId: "p-old",
      providerMessageId: null,
      recipientPhone: "+905353428540",
      recipientName: "X",
      templateId: "payment_reminder",
      relatedCustomerId: null,
      status: "failed",
      failureCode: "not_configured",
      failureDescription: "WhatsApp entegrasyonu henüz yapılandırılmadı.",
      userId: "user-1",
      submittedAt: null,
      deliveredAt: null,
      readAt: null,
      createdAt: "2026-01-01T00:00:00.000Z",
    });
    saveWhatsAppMessage({
      id: "wa-new",
      proposalId: "p-new",
      providerMessageId: null,
      recipientPhone: "+905353428540",
      recipientName: "Y",
      templateId: "payment_reminder",
      relatedCustomerId: null,
      status: "failed",
      failureCode: "not_configured",
      failureDescription: "WhatsApp entegrasyonu henüz yapılandırılmadı.",
      userId: "user-1",
      submittedAt: null,
      deliveredAt: null,
      readAt: null,
      createdAt: "2026-06-01T00:00:00.000Z",
    });
    const all = listWhatsAppMessages();
    expect(all[0].id).toBe("wa-new");
    // Yapılandırılmamış sağlayıcı asla "gönderildi" iddia etmez — dürüst "failed" durumu.
    expect(all[0].status).toBe("failed");
    expect(all[0].failureDescription).toContain("yapılandırılmadı");
  });
});

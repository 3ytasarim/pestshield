// PestShield AI Command Center — Claude'a sunulan tool şemaları.
//
// Bu dosya SADECE şema tanımlarını içerir (isim, açıklama, JSON Schema
// parametreleri). Gerçek veri okuma mantığı tools/executor.ts'de,
// AiDataProvider üzerinden çalışır. LLM burada tanımlı olmayan hiçbir
// fonksiyonu çağıramaz ve hiçbir zaman ham storage/DB erişimi görmez.
//
// Faz 1 KESİNLİKLE salt okunurdur — bu listede hiçbir yazma/güncelleme/
// silme/atama/gönderme tool'u yoktur ve olmayacaktır.

import type { AiToolName } from "@/lib/ai/types";

export interface ToolInputSchema {
  type: "object";
  properties: Record<string, { type: string; description?: string }>;
  required?: string[];
  [key: string]: unknown;
}

export interface ToolDef {
  name: AiToolName;
  description: string;
  input_schema: ToolInputSchema;
  /** Bu tool'u çağırabilecek roller. Boşsa herkes çağırabilir. */
  allowedRoles?: Array<"ADMIN" | "TECH" | "CLIENT">;
}

const dateParam = {
  type: "string",
  description: "ISO 8601 tarih (YYYY-MM-DD). Göreli ifadeleri ('yarın', 'bu hafta' vb.) sistem promptundaki çözümlenmiş tarih ipucunu kullanarak kesin tarihe çevir.",
};

export const AI_TOOLS: ToolDef[] = [
  {
    name: "get_today_summary",
    description: "Bugün için toplam servis, gecikmiş servis, atanmamış servis ve bugün beklenen tahsilat sayısını içeren kısa operasyon özeti döndürür.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "get_dashboard_summary",
    description: "Bugün, yarın ve bu hafta için genişletilmiş operasyon özetini (servisler, periyotlar, tahsilatlar, kritik riskler) döndürür.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "get_services_by_date",
    description: "Belirli bir takvim gününde planlanmış/gerçekleşmiş servis ziyaretlerini listeler.",
    input_schema: { type: "object", properties: { date: dateParam }, required: ["date"] },
  },
  {
    name: "get_services_by_date_range",
    description: "Bir tarih aralığındaki servis ziyaretlerini listeler (ör. 'bu hafta').",
    input_schema: { type: "object", properties: { startDate: dateParam, endDate: dateParam }, required: ["startDate", "endDate"] },
  },
  {
    name: "get_overdue_services",
    description: "Planlanan tarihi geçmiş ama henüz tamamlanmamış (EK-1 formu eksik) servisleri listeler.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "get_incomplete_services",
    description: "Tarihine bakılmaksızın henüz tamamlanmamış (EK-1 formu eksik) tüm servisleri listeler.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "get_unassigned_services",
    description: "Henüz bir personele atanmamış servisleri listeler.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "get_periodic_services_by_date",
    description: "Belirli bir takvim gününde planlanmış periyodik uygulamaları listeler.",
    input_schema: { type: "object", properties: { date: dateParam }, required: ["date"] },
  },
  {
    name: "get_upcoming_periodic_services",
    description: "Bugünden itibaren belirtilen gün sayısı içinde planlanmış periyodik uygulamaları listeler.",
    input_schema: { type: "object", properties: { days: { type: "number", description: "Bugünden kaç gün ileriye bakılacağı (varsayılan 7)." } } },
  },
  {
    name: "get_overdue_periodic_services",
    description: "Planlanan tarihi geçmiş, henüz tamamlanmamış periyodik uygulamaları listeler.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "get_expected_payments",
    description: "Belirli bir tarih aralığında vadesi gelecek (henüz ödenmemiş) faturaları/tahsilatları listeler.",
    input_schema: { type: "object", properties: { startDate: dateParam, endDate: dateParam }, required: ["startDate", "endDate"] },
    allowedRoles: ["ADMIN", "CLIENT"],
  },
  {
    name: "get_overdue_payments",
    description: "Vadesi geçmiş, ödenmemiş faturaları ve borçlu müşterileri listeler.",
    input_schema: { type: "object", properties: {} },
    allowedRoles: ["ADMIN", "CLIENT"],
  },
  {
    name: "get_customer_balance",
    description: "Belirli bir müşterinin güncel cari bakiyesini (borç durumunu) döndürür.",
    input_schema: { type: "object", properties: { customerName: { type: "string", description: "Müşteri/firma adı (tam veya kısmi)." } }, required: ["customerName"] },
    allowedRoles: ["ADMIN", "CLIENT"],
  },
  {
    name: "search_customers",
    description: "Ada, şehre veya sektöre göre müşteri arar; birden fazla eşleşme olabileceğinde kısa bir liste döndürür.",
    input_schema: { type: "object", properties: { query: { type: "string", description: "Arama terimi." } }, required: ["query"] },
  },
  {
    name: "get_customer_details",
    description: "Belirli bir müşterinin genel bilgilerini (sektör, şehir, risk seviyesi, sözleşme, şube sayısı) döndürür.",
    input_schema: { type: "object", properties: { customerName: { type: "string", description: "Müşteri/firma adı (tam veya kısmi)." } }, required: ["customerName"] },
  },
  {
    name: "get_customer_branches",
    description: "Belirli bir müşterinin şube sayısını ve listesini döndürür.",
    input_schema: { type: "object", properties: { customerName: { type: "string", description: "Müşteri/firma adı (tam veya kısmi)." } }, required: ["customerName"] },
  },
  {
    name: "get_customer_upcoming_services",
    description: "Belirli bir müşterinin yaklaşan (bugünden itibaren) planlanmış servislerini listeler.",
    input_schema: { type: "object", properties: { customerName: { type: "string", description: "Müşteri/firma adı (tam veya kısmi)." } }, required: ["customerName"] },
  },
  {
    name: "get_expiring_contracts",
    description: "Belirtilen gün sayısı içinde sözleşmesi sona erecek müşterileri listeler.",
    input_schema: { type: "object", properties: { days: { type: "number", description: "Bugünden itibaren kaç gün içinde bitecek sözleşmeler (varsayılan 60)." } } },
  },
  {
    name: "get_technician_schedule",
    description: "Belirli bir teknisyenin belirli bir tarihteki servis programını listeler.",
    input_schema: {
      type: "object",
      properties: {
        technicianName: { type: "string", description: "Teknisyen adı. TECH rolündeki kullanıcılar sadece kendi adlarını sorgulayabilir." },
        date: dateParam,
      },
      required: ["technicianName", "date"],
    },
  },
  {
    name: "get_technician_workload",
    description: "Bir tarih aralığında teknisyen başına servis sayısını (iş yükü dağılımını) döndürür.",
    input_schema: { type: "object", properties: { startDate: dateParam, endDate: dateParam }, required: ["startDate", "endDate"] },
    allowedRoles: ["ADMIN", "CLIENT"],
  },
  {
    name: "get_critical_risks",
    description: "Açık (kapanmamış) kritik ve yüksek seviyeli risk kayıtlarını listeler.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "get_open_corrective_actions",
    description: "Kapanmamış düzeltici/önleyici faaliyetleri (CAPA) listeler.",
    input_schema: { type: "object", properties: {} },
  },

  // ------------------------------------------------------------------
  // Faz 2 — operasyonel zeka katmanı (deterministik hesaplama, LLM'e
  // aritmetik yaptırılmaz; bu tool'lar sadece hesaplanmış, kaynağı
  // belirtilmiş sonuçlar döndürür).
  // ------------------------------------------------------------------
  {
    name: "get_operational_intelligence_summary",
    description:
      "Bugünkü/bu haftaki operasyonu (servisler, tahsilatlar, riskler) önceki döneme göre karşılaştırmalı olarak yorumlar; öncelikli uyarılar ve öneriler döndürür. 'Dashboard verilerini yorumla', 'Yönetici özeti oluştur' gibi isteklerde kullanılır.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "get_service_trend",
    description: "Son N ay için aylık servis sayısı, tamamlanma oranı ve gecikme oranı trendini döndürür (grafik verisiyle birlikte).",
    input_schema: { type: "object", properties: { months: { type: "number", description: "Kaç aylık trend (varsayılan 6, maksimum 24)." } } },
  },
  {
    name: "compare_periods",
    description: "İki eşit uzunlukta dönemi (mevcut dönem ve hemen öncesi) belirli bir metrik için (servis sayısı, tahsilat tutarı veya risk kaydı sayısı) karşılaştırır; fark, yüzde değişim ve yön döndürür.",
    input_schema: {
      type: "object",
      properties: {
        metric: { type: "string", description: "'services', 'payments' veya 'risks'." },
        startDate: dateParam,
        endDate: dateParam,
      },
      required: ["metric", "startDate", "endDate"],
    },
  },
  {
    name: "get_risk_intelligence_summary",
    description: "Açık kritik/yüksek riskleri, kategoriye göre dağılımı ve önceki 60 güne göre risk kaydı sayısındaki değişimi döndürür.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "get_technician_performance_summary",
    description: "Bir tarih aralığında teknisyen başına atanan/tamamlanan/gecikmiş servis sayısı ve tamamlanma oranını döndürür.",
    input_schema: { type: "object", properties: { startDate: dateParam, endDate: dateParam }, required: ["startDate", "endDate"] },
    allowedRoles: ["ADMIN", "CLIENT"],
  },
  {
    name: "get_audit_readiness_summary",
    description: "Checklist maddelerinden (HACCP/BRCGS/ISO/FSSC) hesaplanan, standart bazlı denetim hazırlık göstergesini ve eksik belgeleri döndürür. Bu resmi bir sertifikasyon sonucu DEĞİLDİR, iç operasyonel göstergedir.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "generate_operational_report",
    description:
      "Şirket geneli veya belirli bir müşteri için, son N aylık servis/tahsilat/risk verilerinden PDF/Excel indirilebilir bir 'Operasyon Özet Raporu' oluşturur. Rapor sadece mevcut gerçek verilerden üretilir; hiçbir kayıt değiştirilmez.",
    input_schema: {
      type: "object",
      properties: {
        scope: { type: "string", description: "'company' (şirket geneli) veya 'customer' (tek müşteri)." },
        customerName: { type: "string", description: "scope='customer' ise müşteri adı." },
        months: { type: "number", description: "Kaç aylık veri kapsanacak (varsayılan 6)." },
      },
      required: ["scope"],
    },
    allowedRoles: ["ADMIN", "CLIENT"],
  },

  // ------------------------------------------------------------------
  // Faz 3 — kontrollü yazma aksiyonları. Bu tool'lar HİÇBİR ZAMAN veri
  // yazmaz — yalnızca bir AiActionProposal (öneri) üretir; gerçek yazma
  // kullanıcının panelde AÇIKÇA "Onayla" butonuna tıklamasından sonra,
  // src/lib/ai/actions/executors.ts'deki güvenilir kodda gerçekleşir.
  // TECH rolü (saha teknisyeni) bu idari yazma aksiyonlarından hariç
  // tutulur (bkz. src/lib/ai/actions/permissions.ts).
  // ------------------------------------------------------------------
  {
    name: "propose_create_service",
    description:
      "Var olan bir hizmet sözleşmesi altına, belirli bir tarih/saatte YENİ bir servis ziyareti oluşturmayı ÖNERİR. Bu bir yazma işlemi DEĞİLDİR — kullanıcının onayını bekleyen bir öneri kartı üretir. Müşterinin sistemde kayıtlı hizmet sözleşmesi yoksa bu aksiyon kullanılamaz.",
    input_schema: {
      type: "object",
      properties: {
        customerName: { type: "string", description: "Müşteri/firma adı." },
        serviceType: { type: "string", description: "Birden fazla hizmet sözleşmesi varsa hangisi kastedildiğini ayırt etmek için açıklama ipucu (opsiyonel)." },
        date: dateParam,
        startTime: { type: "string", description: "Başlangıç saati (HH:mm)." },
        durationMinutes: { type: "number", description: "Servis süresi dakika (varsayılan 60)." },
        technicianName: { type: "string", description: "Atanacak teknisyen adı (opsiyonel)." },
        notes: { type: "string", description: "Serbest not (opsiyonel)." },
      },
      required: ["customerName", "date", "startTime"],
    },
    allowedRoles: ["ADMIN", "CLIENT"],
  },
  {
    name: "propose_reschedule_service",
    description: "Var olan bir servis kaydının tarih/saatini değiştirmeyi ÖNERİR (yalnızca tekil kayıt — tekrarlayan serinin tamamı desteklenmez). Onay bekleyen bir öneri kartı üretir, doğrudan yazmaz.",
    input_schema: {
      type: "object",
      properties: {
        customerName: { type: "string", description: "Müşteri/firma adı." },
        currentDate: { ...dateParam, description: "Ertelenecek servisin MEVCUT tarihi." },
        currentStartTime: { type: "string", description: "Aynı günde birden fazla servis varsa ayırt etmek için mevcut saat (opsiyonel)." },
        newDate: { ...dateParam, description: "Servisin taşınacağı YENİ tarih." },
        newStartTime: { type: "string", description: "Yeni başlangıç saati (HH:mm)." },
      },
      required: ["customerName", "currentDate", "newDate", "newStartTime"],
    },
    allowedRoles: ["ADMIN", "CLIENT"],
  },
  {
    name: "propose_assign_technician",
    description: "Var olan bir servis kaydına bir teknisyen atamayı/değiştirmeyi ÖNERİR. Aynı gün çakışan başka bir atama varsa uyarı olarak gösterilir ama engellenmez. Onay bekleyen bir öneri kartı üretir, doğrudan yazmaz.",
    input_schema: {
      type: "object",
      properties: {
        customerName: { type: "string", description: "Müşteri/firma adı." },
        date: { ...dateParam, description: "Servisin tarihi." },
        startTime: { type: "string", description: "Aynı günde birden fazla servis varsa ayırt etmek için saat (opsiyonel)." },
        technicianName: { type: "string", description: "Atanacak teknisyen adı." },
      },
      required: ["customerName", "date", "technicianName"],
    },
    allowedRoles: ["ADMIN", "CLIENT"],
  },
  {
    name: "propose_create_followup_task",
    description: "Yeni bir takip görevi/hatırlatma oluşturmayı ÖNERİR. Onay bekleyen bir öneri kartı üretir, doğrudan yazmaz.",
    input_schema: {
      type: "object",
      properties: {
        title: { type: "string", description: "Görev başlığı." },
        description: { type: "string", description: "Görev açıklaması (opsiyonel)." },
        dueDate: { ...dateParam, description: "Görevin bitiş tarihi." },
        responsible: { type: "string", description: "Görevden sorumlu kişi." },
        priority: { type: "string", description: "'low', 'normal' veya 'high' (varsayılan 'normal')." },
        relatedCustomerName: { type: "string", description: "Görev bir müşteriyle ilişkiliyse müşteri adı (opsiyonel)." },
      },
      required: ["title", "dueDate", "responsible"],
    },
    allowedRoles: ["ADMIN", "CLIENT"],
  },
  {
    name: "propose_prepare_email",
    description:
      "Bir müşteriye önceden tanımlı bir şablondan (servis randevu onayı, ödeme hatırlatması, servis raporu teslimi) e-posta hazırlamayı/göndermeyi ÖNERİR. SMTP entegrasyonu yapılandırılmışsa onay sonrası gerçekten gönderilir; değilse yalnızca taslak hazırlanır ve gönderilmediği açıkça belirtilir. Onay bekleyen bir öneri kartı üretir, LLM asla doğrudan e-posta göndermez.",
    input_schema: {
      type: "object",
      properties: {
        customerName: { type: "string", description: "Müşteri/firma adı." },
        templateId: { type: "string", description: "'service_appointment_confirmation', 'payment_reminder' veya 'service_report_delivery'." },
        recipientEmailOverride: { type: "string", description: "Kullanıcının sohbette açıkça belirttiği alternatif alıcı e-posta adresi (opsiyonel — müşterinin kayıtlı e-postası yoksa veya kullanıcı farklı bir adres istediyse kullanılır)." },
        serviceDate: dateParam,
        serviceTime: { type: "string", description: "Servis saati (şablon service_appointment_confirmation için, opsiyonel)." },
        technicianName: { type: "string", description: "Teknisyen adı (opsiyonel)." },
        amount: { type: "string", description: "Ödeme tutarı (şablon payment_reminder için, opsiyonel)." },
        dueDate: dateParam,
        reportLink: { type: "string", description: "Rapor bağlantısı (şablon service_report_delivery için, opsiyonel)." },
      },
      required: ["customerName", "templateId"],
    },
    allowedRoles: ["ADMIN", "CLIENT"],
  },

  // ------------------------------------------------------------------
  // Faz 4 — WhatsApp gönderimi de AYNI onay çerçevesini kullanır. Sadece
  // resmi Meta WhatsApp Cloud API yapılandırılmışsa gerçekten gönderilir;
  // yapılandırılmamışsa öneri kartı bunu açıkça belirtir.
  // ------------------------------------------------------------------
  {
    name: "propose_send_whatsapp_message",
    description:
      "Bir müşteriye önceden tanımlı, onaylı bir WhatsApp şablonundan (servis randevu hatırlatması, ödeme hatırlatması, servis tamamlama özeti) mesaj göndermeyi ÖNERİR. Alıcı numarası HER ZAMAN müşterinin kayıtlı telefonundan gelir, asla uydurulmaz. Onay bekleyen bir öneri kartı üretir, LLM asla doğrudan WhatsApp mesajı göndermez.",
    input_schema: {
      type: "object",
      properties: {
        customerName: { type: "string", description: "Müşteri/firma adı." },
        templateId: { type: "string", description: "'service_appointment_reminder', 'payment_reminder' veya 'service_completion_summary'." },
        recipientPhoneOverride: { type: "string", description: "Kullanıcının sohbette açıkça belirttiği alternatif alıcı telefon numarası (opsiyonel)." },
        serviceType: { type: "string", description: "Servis türü (opsiyonel)." },
        serviceDate: dateParam,
        serviceTime: { type: "string", description: "Servis saati (opsiyonel)." },
        technicianName: { type: "string", description: "Teknisyen adı (opsiyonel)." },
        amount: { type: "string", description: "Ödeme tutarı (opsiyonel)." },
        overdueDays: { type: "string", description: "Gecikme gün sayısı (opsiyonel)." },
      },
      required: ["customerName", "templateId"],
    },
    allowedRoles: ["ADMIN", "CLIENT"],
  },
];

export function toolsForRole(role: "ADMIN" | "TECH" | "CLIENT"): ToolDef[] {
  return AI_TOOLS.filter((t) => !t.allowedRoles || t.allowedRoles.includes(role));
}

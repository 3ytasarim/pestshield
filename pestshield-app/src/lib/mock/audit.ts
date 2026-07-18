// PestShield Denetim/Uyumluluk mock veri katmanı. Gerçek backend henüz bağlanmadı;
// tüm veriler deterministik olarak üretilir (Math.random KULLANILMAZ -
// aksi halde server/client hydration mismatch oluşur).

import { customers } from "@/lib/mock/crm";

export type ComplianceStandard = "haccp" | "brcgs" | "iso22000" | "fssc";
export type ChecklistStatus = "compliant" | "non_compliant" | "pending" | "not_applicable";
export type CapaSeverity = "low" | "medium" | "high" | "critical";
export type CapaStatus = "open" | "in_progress" | "resolved" | "verified";
export type CapaSource = "internal_audit" | "external_audit" | "customer_complaint" | "routine_inspection";
export type RiskCategory = "biological" | "chemical" | "physical" | "operational" | "regulatory";
export type RiskStatus = "open" | "mitigating" | "closed";
export type AuditType = "internal" | "external" | "certification";
export type AuditResult = "passed" | "passed_with_findings" | "failed" | "scheduled";

export interface ChecklistItem {
  id: string;
  standard: ComplianceStandard;
  sectionCode: string;
  sectionTitle: string;
  itemCode: string;
  title: string;
  description: string;
  status: ChecklistStatus;
  evidenceNote: string;
  reviewedBy: string;
  reviewDate: string;
}

export interface AuditRecord {
  id: string;
  standard: ComplianceStandard;
  customerId: string;
  type: AuditType;
  auditor: string;
  scheduledDate: string;
  completedDate: string | null;
  result: AuditResult;
  score: number | null;
}

export interface CorrectiveAction {
  id: string;
  title: string;
  standard: ComplianceStandard | null;
  customerId: string | null;
  source: CapaSource;
  severity: CapaSeverity;
  rootCause: string;
  actionPlan: string;
  responsible: string;
  createdDate: string;
  dueDate: string;
  resolvedDate: string | null;
  status: CapaStatus;
}

export interface Risk {
  id: string;
  title: string;
  category: RiskCategory;
  description: string;
  likelihood: number;
  impact: number;
  mitigation: string;
  owner: string;
  status: RiskStatus;
  reviewDate: string;
  customerId: string | null;
}

function daysFromNow(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

const REVIEWERS = ["Ahmet Yılmaz", "Elif Demir", "Mehmet Kaya"];

// ---------------------------------------------------------------------------
// Checklist içerikleri (bölüm bazlı, gerçekçi standart maddeleri)
// ---------------------------------------------------------------------------

interface SectionSeed {
  code: string;
  title: string;
  items: { code: string; title: string; description: string }[];
}

const HACCP_SECTIONS: SectionSeed[] = [
  {
    code: "P1",
    title: "Tehlike Analizi",
    items: [
      { code: "1.1", title: "Zararlı türü risk haritası güncel", description: "Tesis genelinde tespit edilen zararlı türlerinin risk haritası son 12 ay içinde güncellenmiş olmalı." },
      { code: "1.2", title: "Biyolojik tehlike değerlendirmesi", description: "Kemirgen ve haşere kaynaklı biyolojik kontaminasyon riskleri dokümante edilmiş." },
      { code: "1.3", title: "Kimyasal tehlike değerlendirmesi", description: "Kullanılan biyosidal ürünlerin kalıntı riski değerlendirilmiş ve MSDS dosyaları güncel." },
    ],
  },
  {
    code: "P2",
    title: "Kritik Kontrol Noktaları",
    items: [
      { code: "2.1", title: "İstasyon yerleşim planı onaylı", description: "Yem istasyonu ve tuzak yerleşim planı tesis krokisi üzerinde işaretli ve onaylı." },
      { code: "2.2", title: "Giriş noktaları kontrol altında", description: "Tüm dış kapı, rampa ve yükleme alanları CCP olarak tanımlanmış ve izleniyor." },
      { code: "2.3", title: "Depolama alanları CCP tanımı", description: "Hammadde ve mamul depolama alanlarında kritik kontrol noktaları belirlenmiş." },
    ],
  },
  {
    code: "P3",
    title: "İzleme Prosedürleri",
    items: [
      { code: "3.1", title: "Periyodik servis takvimi uygulanıyor", description: "Sözleşmede belirlenen servis periyoduna uyum son 3 ayda kesintisiz sağlanmış." },
      { code: "3.2", title: "İstasyon aktivite kayıtları eksiksiz", description: "Her ziyarette tüm istasyonların aktivite durumu dijital olarak kayıt altına alınıyor." },
      { code: "3.3", title: "Trend analizi raporlanıyor", description: "Aylık aktivite trend analizi müşteriye raporlanıyor ve sapmalar işaretleniyor." },
    ],
  },
  {
    code: "P4",
    title: "Kayıt Tutma ve Doğrulama",
    items: [
      { code: "4.1", title: "Servis raporları imzalı arşivleniyor", description: "Her servis sonrası rapor müşteri yetkilisi tarafından imzalanıp sisteme yükleniyor." },
      { code: "4.2", title: "Teknisyen sertifikaları güncel", description: "Saha teknisyenlerinin biyosidal uygulama sertifikaları geçerlilik süresi içinde." },
      { code: "4.3", title: "İç doğrulama denetimi yapıldı", description: "Yılda en az bir kez iç doğrulama denetimi gerçekleştirilmiş ve kayıt altında." },
    ],
  },
];

const BRCGS_SECTIONS: SectionSeed[] = [
  {
    code: "S1",
    title: "Üst Yönetim Taahhüdü",
    items: [
      { code: "1.1", title: "Haşere kontrol politikası onaylı", description: "Tesis yönetimi tarafından imzalanmış güncel bir entegre haşere yönetimi politikası mevcut." },
      { code: "1.2", title: "Kaynak yeterliliği sağlanmış", description: "Haşere kontrol programı için yeterli bütçe ve personel kaynağı ayrılmış." },
    ],
  },
  {
    code: "S4",
    title: "Saha Standartları",
    items: [
      { code: "4.1", title: "Bina dış cephe proofing durumu", description: "Bina dışından giriş noktaları (kablo geçişleri, boru delikleri) kapatılmış." },
      { code: "4.2", title: "Yeşil alan ve çevre düzeni uygun", description: "Bina çevresindeki bitki örtüsü ve atık alanları haşere üremesine izin vermiyor." },
      { code: "4.3", title: "Aydınlatma ve UV tuzak konumları", description: "Dış kapılarda uçan haşere kontrolü için UV tuzaklar doğru konumda." },
      { code: "4.4", title: "Atık yönetim alanı ayrık", description: "Atık toplama alanı üretim/depolama alanlarından yeterli mesafede ve kapalı." },
    ],
  },
  {
    code: "S5",
    title: "Ürün Kontrolü",
    items: [
      { code: "5.1", title: "Yabancı madde kontrol prosedürü", description: "Haşere kaynaklı yabancı madde şikayetleri için kök neden analiz prosedürü mevcut." },
      { code: "5.2", title: "Kimyasal saklama alanı ayrık", description: "Biyosidal ürünler gıda/ambalaj alanlarından fiziksel olarak ayrılmış kilitli dolapta." },
    ],
  },
  {
    code: "S7",
    title: "Personel",
    items: [
      { code: "7.1", title: "Personel farkındalık eğitimi", description: "Tesis personeli haşere belirtilerini raporlama konusunda eğitilmiş." },
      { code: "7.2", title: "Ziyaretçi ve taşeron bilgilendirmesi", description: "Dışarıdan gelen ziyaretçi ve taşeronlar haşere kontrol kurallarına dair bilgilendiriliyor." },
    ],
  },
];

const ISO22000_SECTIONS: SectionSeed[] = [
  {
    code: "C4",
    title: "Kuruluşun Bağlamı",
    items: [
      { code: "4.1", title: "İç ve dış hususlar belirlenmiş", description: "Gıda güvenliğini etkileyen haşere baskısı gibi dış faktörler dokümante edilmiş." },
      { code: "4.2", title: "İlgili tarafların ihtiyaçları", description: "Müşteri ve denetim otoritesi beklentileri haşere yönetim planına yansıtılmış." },
    ],
  },
  {
    code: "C6",
    title: "Planlama",
    items: [
      { code: "6.1", title: "Risk ve fırsatlara yönelik faaliyetler", description: "Haşere kaynaklı riskler için önleyici faaliyet planı mevcut ve güncel." },
      { code: "6.2", title: "Gıda güvenliği hedefleri ölçülebilir", description: "Haşere aktivite hedefleri (ör. sıfır kritik bulgu) ölçülebilir şekilde tanımlanmış." },
    ],
  },
  {
    code: "C8",
    title: "Operasyon (PRP / HACCP)",
    items: [
      { code: "8.1", title: "PRP programı belgelenmiş", description: "Ön gereksinim programı (PRP) kapsamında haşere kontrolü ayrı bir prosedürle tanımlı." },
      { code: "8.2", title: "İzlenebilirlik sağlanmış", description: "Kullanılan biyosidal ürün parti numaraları servis kayıtlarında izlenebilir." },
      { code: "8.3", title: "Acil durum prosedürü mevcut", description: "Ani haşere istilası durumunda acil müdahale prosedürü tanımlı ve test edilmiş." },
    ],
  },
  {
    code: "C9",
    title: "Performans Değerlendirme",
    items: [
      { code: "9.1", title: "İç denetim programı uygulanıyor", description: "Yıllık iç denetim planında haşere yönetim sistemi ayrı bir madde olarak yer alıyor." },
      { code: "9.2", title: "Yönetimin gözden geçirmesi kaydı", description: "Haşere trend verileri yönetimin gözden geçirmesi toplantılarında ele alınıyor." },
    ],
  },
];

const FSSC_SECTIONS: SectionSeed[] = [
  {
    code: "A1",
    title: "Ek PRP Gereklilikleri",
    items: [
      { code: "1.1", title: "Haşere kontrol servis sağlayıcı yeterliliği", description: "PestShield'ın FSSC ek gereklilikleri kapsamında yeterlilik belgeleri güncel." },
      { code: "1.2", title: "Kimyasal kullanım onay listesi", description: "Kullanılan tüm biyosidal ürünler tesisin onaylı kimyasal listesinde yer alıyor." },
    ],
  },
  {
    code: "A2",
    title: "Gıda Savunması (Food Defense)",
    items: [
      { code: "2.1", title: "Kasıtlı kontaminasyon değerlendirmesi", description: "Haşere kontrol istasyonlarının kötüye kullanım riski değerlendirilmiş." },
      { code: "2.2", title: "İstasyon erişim kontrolü", description: "Yem istasyonları yetkisiz erişime karşı kilitli/sabitlenmiş durumda." },
    ],
  },
  {
    code: "A3",
    title: "Gıda Sahtekarlığı (Food Fraud)",
    items: [
      { code: "3.1", title: "Kimyasal tedarik zinciri doğrulaması", description: "Kullanılan biyosidal ürünlerin orijinal ve ruhsatlı tedarikçiden geldiği doğrulanmış." },
    ],
  },
  {
    code: "A6",
    title: "Alerjen ve Çevresel İzleme",
    items: [
      { code: "6.1", title: "Çevresel izleme programına entegrasyon", description: "Haşere aktivite verileri tesisin çevresel izleme programına dahil ediliyor." },
      { code: "6.2", title: "Numune alma noktaları ile çakışma yok", description: "İstasyon konumları mikrobiyolojik numune alma noktalarını etkilemiyor." },
    ],
  },
];

export const STANDARD_SECTIONS: Record<ComplianceStandard, SectionSeed[]> = {
  haccp: HACCP_SECTIONS,
  brcgs: BRCGS_SECTIONS,
  iso22000: ISO22000_SECTIONS,
  fssc: FSSC_SECTIONS,
};

/** Deterministik durum ataması: çoğunluk uygun, birkaçı inceleniyor/uygunsuz — gerçekçi ama sahte-mükemmel olmayan bir görünüm. */
function statusFor(standardIndex: number, flatIndex: number): ChecklistStatus {
  const seed = (standardIndex * 7 + flatIndex * 3) % 10;
  if (seed === 9) return "non_compliant";
  if (seed === 7 || seed === 8) return "pending";
  if (seed === 5) return "not_applicable";
  return "compliant";
}

function buildChecklist(): ChecklistItem[] {
  const standards: ComplianceStandard[] = ["haccp", "brcgs", "iso22000", "fssc"];
  const items: ChecklistItem[] = [];
  standards.forEach((standard, sIndex) => {
    let flatIndex = 0;
    STANDARD_SECTIONS[standard].forEach((section) => {
      section.items.forEach((item) => {
        const status = statusFor(sIndex, flatIndex);
        items.push({
          id: `${standard}-${section.code}-${item.code}`,
          standard,
          sectionCode: section.code,
          sectionTitle: section.title,
          itemCode: item.code,
          title: item.title,
          description: item.description,
          status,
          evidenceNote:
            status === "compliant"
              ? "Son servis raporunda doğrulandı."
              : status === "non_compliant"
                ? "Sahada uygunsuzluk tespit edildi, düzeltici faaliyet açıldı."
                : status === "pending"
                  ? "Bir sonraki denetimde yeniden değerlendirilecek."
                  : "Bu tesis için uygulanabilir değil.",
          reviewedBy: REVIEWERS[flatIndex % REVIEWERS.length],
          reviewDate: daysFromNow(-(flatIndex * 6 + sIndex * 4 + 3)),
        });
        flatIndex += 1;
      });
    });
  });
  return items;
}

export const checklistItems: ChecklistItem[] = buildChecklist();

export const STANDARD_LABELS: Record<ComplianceStandard, string> = {
  haccp: "HACCP",
  brcgs: "BRCGS Gıda Güvenliği",
  iso22000: "ISO 22000",
  fssc: "FSSC 22000",
};

export const STANDARD_DESCRIPTIONS: Record<ComplianceStandard, string> = {
  haccp: "Tehlike Analizi ve Kritik Kontrol Noktaları sisteminin haşere yönetimi açısından uyumluluğu.",
  brcgs: "BRCGS Global Standard for Food Safety (Issue 9) saha denetim uyumluluğu.",
  iso22000: "ISO 22000:2018 Gıda Güvenliği Yönetim Sistemi uyumluluğu.",
  fssc: "FSSC 22000 sertifikasyon şeması ek gereklilikleri.",
};

export function getChecklistForStandard(standard: ComplianceStandard): ChecklistItem[] {
  return checklistItems.filter((i) => i.standard === standard);
}

export function getSectionsForStandard(standard: ComplianceStandard): SectionSeed[] {
  return STANDARD_SECTIONS[standard];
}

export function getStandardReadiness(standard: ComplianceStandard, items: ChecklistItem[] = checklistItems): number {
  const relevant = items.filter((i) => i.standard === standard && i.status !== "not_applicable");
  if (relevant.length === 0) return 100;
  const compliant = relevant.filter((i) => i.status === "compliant").length;
  return Math.round((compliant / relevant.length) * 100);
}

export function getOpenFindingsCount(standard: ComplianceStandard, items: ChecklistItem[] = checklistItems): number {
  return items.filter((i) => i.standard === standard && (i.status === "non_compliant" || i.status === "pending")).length;
}

// ---------------------------------------------------------------------------
// Denetimler (planlı/tamamlanmış)
// ---------------------------------------------------------------------------

export const auditRecords: AuditRecord[] = [
  { id: "aud-001", standard: "brcgs", customerId: "cust-002", type: "certification", auditor: "SGS Türkiye", scheduledDate: daysFromNow(-40), completedDate: daysFromNow(-40), result: "passed_with_findings", score: 86 },
  { id: "aud-002", standard: "haccp", customerId: "cust-002", type: "internal", auditor: "Elif Demir", scheduledDate: daysFromNow(-15), completedDate: daysFromNow(-15), result: "passed", score: 94 },
  { id: "aud-003", standard: "iso22000", customerId: "cust-004", type: "external", auditor: "TÜV Nord", scheduledDate: daysFromNow(-70), completedDate: daysFromNow(-70), result: "failed", score: 58 },
  { id: "aud-004", standard: "fssc", customerId: "cust-006", type: "certification", auditor: "Bureau Veritas", scheduledDate: daysFromNow(12), completedDate: null, result: "scheduled", score: null },
  { id: "aud-005", standard: "brcgs", customerId: "cust-006", type: "internal", auditor: "Ahmet Yılmaz", scheduledDate: daysFromNow(5), completedDate: null, result: "scheduled", score: null },
  { id: "aud-006", standard: "haccp", customerId: "cust-001", type: "internal", auditor: "Mehmet Kaya", scheduledDate: daysFromNow(20), completedDate: null, result: "scheduled", score: null },
  { id: "aud-007", standard: "iso22000", customerId: "cust-002", type: "external", auditor: "TÜV Nord", scheduledDate: daysFromNow(-100), completedDate: daysFromNow(-100), result: "passed", score: 91 },
];

export function getUpcomingAudits(): AuditRecord[] {
  return auditRecords
    .filter((a) => a.result === "scheduled")
    .sort((a, b) => (a.scheduledDate < b.scheduledDate ? -1 : 1));
}

export function getCompletedAudits(): AuditRecord[] {
  return auditRecords.filter((a) => a.completedDate !== null).sort((a, b) => (a.completedDate! < b.completedDate! ? 1 : -1));
}

// ---------------------------------------------------------------------------
// Düzeltici Faaliyetler (CAPA)
// ---------------------------------------------------------------------------

const CAPA_SEED: Array<Omit<CorrectiveAction, "id" | "createdDate" | "dueDate" | "resolvedDate">> = [
  {
    title: "Yükleme rampasında kemirgen giriş izi",
    standard: "brcgs",
    customerId: "cust-002",
    source: "external_audit",
    severity: "high",
    rootCause: "Rampa altındaki kablo geçiş boşluğu yeterince kapatılmamış.",
    actionPlan: "Boşluk çelik yünü ve sızdırmazlık köpüğü ile kapatılacak, 30 gün sonra doğrulama yapılacak.",
    responsible: "Ahmet Yılmaz",
    status: "in_progress",
  },
  {
    title: "İstasyon aktivite kaydında 5 günlük boşluk",
    standard: "haccp",
    customerId: "cust-004",
    source: "internal_audit",
    severity: "medium",
    rootCause: "Saha teknisyeni izinli olduğu dönemde yedek personel atanmamış.",
    actionPlan: "Yedek teknisyen rotasyon planı oluşturulacak ve servis takvimine eklenecek.",
    responsible: "Mehmet Kaya",
    status: "resolved",
  },
  {
    title: "UV tuzak lambası çalışmıyor",
    standard: "brcgs",
    customerId: "cust-006",
    source: "routine_inspection",
    severity: "low",
    rootCause: "Lamba ömrünü doldurmuş, periyodik değişim takibi yapılmamış.",
    actionPlan: "Lamba değiştirildi, UV tuzak lambaları için 6 aylık değişim takvimi oluşturuldu.",
    responsible: "Elif Demir",
    status: "verified",
  },
  {
    title: "Biyosidal ürün MSDS dosyası eksik",
    standard: "iso22000",
    customerId: "cust-004",
    source: "external_audit",
    severity: "critical",
    rootCause: "Yeni eklenen ürün için MSDS dosyası saha dosyasına eklenmemiş.",
    actionPlan: "Tüm aktif ürünlerin MSDS dosyaları dijital arşive yüklenecek ve saha klasörüyle çapraz kontrol edilecek.",
    responsible: "Ahmet Yılmaz",
    status: "open",
  },
  {
    title: "Atık alanı ile üretim alanı arasında yetersiz mesafe",
    standard: "fssc",
    customerId: "cust-006",
    source: "internal_audit",
    severity: "medium",
    rootCause: "Geçici depolama nedeniyle atık konteynerleri üretim kapısına yakın konumlandırılmış.",
    actionPlan: "Atık alanı yeniden planlanacak, minimum 15 metre mesafe kuralına uyum sağlanacak.",
    responsible: "Mehmet Kaya",
    status: "in_progress",
  },
  {
    title: "Müşteri şikayeti — sinek yoğunluğu",
    standard: null,
    customerId: "cust-001",
    source: "customer_complaint",
    severity: "medium",
    rootCause: "Yaz aylarında dış aydınlatma haşereyi bina girişine çekiyor.",
    actionPlan: "Sarı ışıklı LED aydınlatmaya geçiş önerisi sunuldu, ek UV tuzak konuşlandırıldı.",
    responsible: "Elif Demir",
    status: "resolved",
  },
];

function buildCorrectiveActions(): CorrectiveAction[] {
  return CAPA_SEED.map((seed, i) => {
    const createdOffset = -[35, 20, 60, 8, 25, 45][i];
    const dueOffset = createdOffset + [30, 14, 20, 10, 21, 15][i];
    const isResolved = seed.status === "resolved" || seed.status === "verified";
    return {
      ...seed,
      id: `capa-${String(i + 1).padStart(3, "0")}`,
      createdDate: daysFromNow(createdOffset),
      dueDate: daysFromNow(dueOffset),
      resolvedDate: isResolved ? daysFromNow(dueOffset - 3) : null,
    };
  });
}

export const correctiveActions: CorrectiveAction[] = buildCorrectiveActions();

export function isCapaOverdue(capa: CorrectiveAction): boolean {
  if (capa.status === "resolved" || capa.status === "verified") return false;
  return new Date(capa.dueDate).getTime() < Date.now();
}

export function getOpenCorrectiveActions(): CorrectiveAction[] {
  return correctiveActions.filter((c) => c.status === "open" || c.status === "in_progress");
}

// ---------------------------------------------------------------------------
// Risk Yönetimi
// ---------------------------------------------------------------------------

const RISK_SEED: Array<Omit<Risk, "id" | "reviewDate">> = [
  {
    title: "Depo çevresinde kemirgen üreme riski",
    category: "biological",
    description: "Depo arka cephesindeki yoğun bitki örtüsü kemirgen barınağı oluşturuyor.",
    likelihood: 4,
    impact: 4,
    mitigation: "Çevre düzenlemesi ve dış istasyon sıklığının artırılması planlandı.",
    owner: "Mehmet Kaya",
    status: "mitigating",
    customerId: "cust-004",
  },
  {
    title: "Biyosidal ürün depolama sıcaklık sapması",
    category: "chemical",
    description: "Kimyasal deposunda sıcaklık kontrolü periyodik olarak izlenmiyor.",
    likelihood: 2,
    impact: 3,
    mitigation: "Sıcaklık veri kaydedici cihaz kuruldu, aylık rapor otomatikleştirildi.",
    owner: "Ahmet Yılmaz",
    status: "closed",
    customerId: "cust-001",
  },
  {
    title: "Yükleme rampası proofing eksikliği",
    category: "physical",
    description: "Kapı altı boşlukları haşere girişine izin veriyor.",
    likelihood: 4,
    impact: 5,
    mitigation: "Rampa kapıları için fırça bariyer sistemi kurulumu planlandı.",
    owner: "Elif Demir",
    status: "open",
    customerId: "cust-002",
  },
  {
    title: "Sözleşme yenileme gecikmesi",
    category: "operational",
    description: "Sözleşme süresi dolan müşterilerde hizmet sürekliliği riski.",
    likelihood: 3,
    impact: 3,
    mitigation: "Sözleşme bitişine 60 gün kala otomatik hatırlatma süreci devreye alındı.",
    owner: "Aylin Aydın",
    status: "mitigating",
    customerId: "cust-004",
  },
  {
    title: "Ruhsat yenileme takibi",
    category: "regulatory",
    description: "Kullanılan bazı biyosidal ürünlerin ruhsat yenileme tarihleri yakın.",
    likelihood: 2,
    impact: 4,
    mitigation: "Ruhsat takvimi Envanter modülüne entegre edildi, 90 gün önceden uyarı kuruldu.",
    owner: "Ahmet Yılmaz",
    status: "open",
    customerId: null,
  },
  {
    title: "Personel ehliyet geçerlilik riski",
    category: "regulatory",
    description: "İki saha teknisyeninin ehliyeti 45 gün içinde doluyor.",
    likelihood: 3,
    impact: 3,
    mitigation: "Teknisyenler ehliyet yenileme için bilgilendirildi.",
    owner: "Elif Demir",
    status: "mitigating",
    customerId: null,
  },
  {
    title: "Yüksek trafik alanında görsel kirlilik şikayeti",
    category: "operational",
    description: "Otel lobisine yakın istasyon konumu misafir şikayetine neden oluyor.",
    likelihood: 2,
    impact: 2,
    mitigation: "Gizlenmiş/dekoratif istasyon kutularına geçiş yapıldı.",
    owner: "Mehmet Kaya",
    status: "closed",
    customerId: "cust-006",
  },
  {
    title: "Atık alanı - üretim alanı çapraz kontaminasyon",
    category: "biological",
    description: "Atık toplama alanı ile hammadde giriş noktası arasındaki mesafe yetersiz.",
    likelihood: 3,
    impact: 5,
    mitigation: "Alan yeniden planlanıyor, geçici önlem olarak ek dezenfeksiyon uygulanıyor.",
    owner: "Mehmet Kaya",
    status: "mitigating",
    customerId: "cust-006",
  },
];

export const risks: Risk[] = RISK_SEED.map((seed, i) => ({
  ...seed,
  id: `risk-${String(i + 1).padStart(3, "0")}`,
  reviewDate: daysFromNow(-(i * 5 + 4)),
}));

export function riskScore(risk: Pick<Risk, "likelihood" | "impact">): number {
  return risk.likelihood * risk.impact;
}

export type RiskLevel = "low" | "medium" | "high" | "critical";

export function riskLevel(score: number): RiskLevel {
  if (score >= 15) return "critical";
  if (score >= 9) return "high";
  if (score >= 4) return "medium";
  return "low";
}

export function getOpenRisks(): Risk[] {
  return risks.filter((r) => r.status !== "closed");
}

export function getHighRisks(): Risk[] {
  return risks.filter((r) => r.status !== "closed" && riskScore(r) >= 9);
}

// customers importu, ileride müşteri bazlı filtreleme genişletmeleri için kullanılabilir.
export const AUDIT_CUSTOMERS = customers;

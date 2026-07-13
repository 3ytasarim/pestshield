import { z } from "zod";

export const customerFormSchema = z
  .object({
    // Firma Bilgileri
    companyName: z.string().min(2, "Firma adı en az 2 karakter olmalıdır"),
    taxNumber: z.string().optional(),
    taxOffice: z.string().optional(),
    sector: z.string().min(1, "Sektör seçiniz"),
    customerType: z.enum(["Bireysel", "Kurumsal"], { message: "Müşteri tipi seçiniz" }),
    isPotential: z.boolean(),
    status: z.enum(["active", "passive"]),
    shortName: z.string().min(2, "Müşteri kısa adı en az 2 karakter olmalıdır"),
    logo: z.string().nullable().optional(),

    // Yetkili Bilgileri
    contactName: z.string().min(2, "Ad soyad en az 2 karakter olmalıdır"),
    contactPhone: z.string().min(7, "Geçerli bir telefon numarası girin"),
    contactEmail: z.string().email("Geçerli bir e-posta adresi girin"),
    contactTitle: z.string().min(1, "Görev/ünvan zorunludur"),

    // Adres Bilgileri
    country: z.string().min(1, "Ülke zorunludur"),
    city: z.string().min(1, "Şehir seçiniz"),
    district: z.string().min(1, "İlçe zorunludur"),
    addressLine: z.string().min(5, "Açık adres en az 5 karakter olmalıdır"),
    postalCode: z.string().min(4, "Posta kodu zorunludur"),

    // Finans Bilgileri
    accountCode: z.string().min(2, "Cari kodu zorunludur"),
    paymentTermDays: z.number().min(0, "Ödeme vadesi 0 veya üzeri olmalıdır"),
    invoiceEmail: z.string().email("Geçerli bir e-posta adresi girin"),
    currency: z.string().min(1, "Para birimi seçiniz"),
    iban: z.string().optional(),

    // Üyelik Bilgileri
    portalEmail: z.string().email("Geçerli bir e-posta adresi girin"),
    portalPassword: z.string().optional(),
    sendServiceReportEmail: z.boolean(),
    sendTrendAnalysisEmail: z.boolean(),
    sendCorrectiveActionEmail: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (data.customerType === "Kurumsal") {
      if (!data.taxNumber || data.taxNumber.trim().length < 4) {
        ctx.addIssue({ code: "custom", message: "Geçerli bir vergi numarası girin", path: ["taxNumber"] });
      }
      if (!data.taxOffice || data.taxOffice.trim().length < 2) {
        ctx.addIssue({ code: "custom", message: "Vergi dairesi zorunludur", path: ["taxOffice"] });
      }
    }
  });

export type CustomerFormValues = z.infer<typeof customerFormSchema>;

export const branchFormSchema = z.object({
  name: z.string().min(2, "Şube adı zorunludur"),
  code: z.string().min(1, "Şube kodu zorunludur"),
  contactName: z.string().min(2, "Yetkili kişi zorunludur"),
  phone: z.string().min(7, "Geçerli bir telefon numarası girin"),
  email: z.string().email("Geçerli bir e-posta adresi girin"),
  city: z.string().min(1, "Şehir zorunludur"),
  district: z.string().min(1, "İlçe zorunludur"),
  addressLine: z.string().min(5, "Açık adres zorunludur"),
  serviceStatus: z.enum(["active", "passive"]),
  riskLevel: z.enum(["low", "medium", "high", "critical"]),
});

export type BranchFormValues = z.infer<typeof branchFormSchema>;

export const contactFormSchema = z.object({
  name: z.string().min(2, "Ad soyad zorunludur"),
  title: z.string().min(1, "Ünvan zorunludur"),
  department: z.string().min(1, "Departman zorunludur"),
  phone: z.string().min(7, "Geçerli bir telefon numarası girin"),
  email: z.string().email("Geçerli bir e-posta adresi girin"),
  note: z.string(),
  isPrimary: z.boolean(),
});

export type ContactFormValues = z.infer<typeof contactFormSchema>;

export const addressFormSchema = z.object({
  type: z.enum(["billing", "service", "shipping", "branch"]),
  country: z.string().min(1, "Ülke zorunludur"),
  city: z.string().min(1, "Şehir zorunludur"),
  district: z.string().min(1, "İlçe zorunludur"),
  neighborhood: z.string().min(1, "Mahalle zorunludur"),
  addressLine: z.string().min(5, "Açık adres zorunludur"),
  postalCode: z.string().min(4, "Posta kodu zorunludur"),
  isDefault: z.boolean(),
});

export type AddressFormValues = z.infer<typeof addressFormSchema>;

export const locationFormSchema = z.object({
  name: z.string().min(2, "Lokasyon adı zorunludur"),
  type: z.enum([
    "production_area",
    "warehouse",
    "cafeteria",
    "office",
    "garden",
    "waste_area",
    "loading_area",
    "raw_material_warehouse",
    "finished_goods_warehouse",
  ]),
  branchName: z.string().min(1, "Bağlı şube seçiniz"),
  description: z.string(),
  riskLevel: z.enum(["low", "medium", "high", "critical"]),
  isIndoor: z.boolean(),
});

export type LocationFormValues = z.infer<typeof locationFormSchema>;

export const contractFormSchema = z
  .object({
    contractNo: z.string().min(2, "Sözleşme no zorunludur"),
    serviceType: z.string().min(1, "Hizmet türü seçiniz"),
    startDate: z.string().min(1, "Başlangıç tarihi zorunludur"),
    endDate: z.string().min(1, "Bitiş tarihi zorunludur"),
    servicePeriod: z.string().min(1, "Periyot seçiniz"),
    monthlyAmount: z.number().min(1, "Tutar 0'dan büyük olmalıdır"),
    currency: z.string().min(1, "Para birimi seçiniz"),
    description: z.string().optional(),
  })
  .refine((data) => new Date(data.endDate) > new Date(data.startDate), {
    message: "Bitiş tarihi başlangıç tarihinden sonra olmalıdır",
    path: ["endDate"],
  });

export type ContractFormValues = z.infer<typeof contractFormSchema>;

export const offerItemSchema = z.object({
  description: z.string().min(1, "Kalem açıklaması zorunludur"),
  unitPrice: z.number().min(0, "Birim fiyat 0 veya üzeri olmalıdır"),
  quantity: z.number().min(1, "Adet en az 1 olmalıdır"),
});

export const offerFormSchema = z.object({
  title: z.string().min(2, "Teklif başlığı zorunludur"),
  serviceType: z.string().min(1, "Hizmet türü seçiniz"),
  description: z.string().optional(),
  items: z.array(offerItemSchema).min(1, "En az 1 kalem eklenmelidir"),
  vatRate: z.number().min(0).max(100),
  validUntil: z.string().min(1, "Geçerlilik tarihi zorunludur"),
  notes: z.string().optional(),
});

export type OfferFormValues = z.infer<typeof offerFormSchema>;

export const hizmetItemSchema = z.object({
  description: z.string().min(1, "Hizmet/Ürün adı zorunludur"),
  quantity: z.number().min(0.01, "Miktar 0'dan büyük olmalıdır"),
  unitPrice: z.number().min(0, "Birim fiyat 0 veya üzeri olmalıdır"),
  vatRate: z.number().min(0).max(100),
});

export const hizmetFormSchema = z.object({
  description: z.string().optional(),
  contractStartDate: z.string().optional(),
  contractEndDate: z.string().optional(),
  assignedPersonnel: z.string().optional(),
  periodDays: z.number().min(1, "Periyot en az 1 gün olmalıdır"),
  withholdingTax: z.string(),
  items: z.array(hizmetItemSchema).min(1, "En az 1 kalem eklenmelidir"),
});

export type HizmetFormValues = z.infer<typeof hizmetFormSchema>;

export const noteFormSchema = z.object({
  title: z.string().min(2, "Başlık zorunludur"),
  content: z.string().min(2, "Not içeriği zorunludur"),
  priority: z.enum(["low", "normal", "high", "critical"]),
  tags: z.string().optional(),
  reminderDate: z.string().optional(),
});

export type NoteFormValues = z.infer<typeof noteFormSchema>;

export const workOrderFormSchema = z.object({
  serviceType: z.string().min(1, "Hizmet türü seçiniz"),
  technician: z.string().min(1, "Teknisyen seçiniz"),
  plannedDate: z.string().min(1, "Planlanan tarih zorunludur"),
});

export type WorkOrderFormValues = z.infer<typeof workOrderFormSchema>;

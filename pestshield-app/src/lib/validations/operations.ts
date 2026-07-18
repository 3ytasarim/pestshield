import { z } from "zod";

export const stationFormSchema = z.object({
  customerId: z.string().min(1, "Müşteri seçiniz"),
  locationId: z.string().min(1, "Lokasyon seçiniz"),
  label: z.string().min(2, "İstasyon adı en az 2 karakter olmalıdır"),
  type: z.enum(["rodent_bait", "insect_trap", "glue_trap", "uv_trap", "pheromone_trap"]),
});

export type StationFormValues = z.infer<typeof stationFormSchema>;

export const stationCheckSubmitSchema = z.object({
  stationId: z.string().min(1, "İstasyon seçiniz"),
  activityFound: z.boolean(),
  activityLevel: z.enum(["none", "low", "medium", "high"]),
  actionTaken: z.string().min(2, "Yapılan işlem zorunludur"),
  note: z.string(),
});

export type StationCheckSubmitValues = z.infer<typeof stationCheckSubmitSchema>;

export const technicianFormSchema = z.object({
  name: z.string().min(2, "Ad soyad en az 2 karakter olmalıdır"),
  phone: z.string().min(7, "Geçerli bir telefon numarası girin"),
  email: z.string().email("Geçerli bir e-posta girin"),
  password: z.string().min(8, "Şifre en az 8 karakter olmalıdır"),
  licenseNumber: z.string().min(3, "Ehliyet numarası zorunludur"),
  licenseExpiry: z.string().min(1, "Geçerlilik tarihi zorunludur"),
  status: z.enum(["active", "on_leave", "inactive"]),
});

export type TechnicianFormValues = z.infer<typeof technicianFormSchema>;

export const vehicleFormSchema = z.object({
  plate: z.string().min(5, "Geçerli bir plaka girin"),
  brand: z.string().min(2, "Marka zorunludur"),
  model: z.string().min(1, "Model zorunludur"),
  assignedTechnicianId: z.string(),
  registrationNumber: z.string().min(3, "Ruhsat numarası zorunludur"),
  registrationExpiry: z.string().min(1, "Ruhsat geçerlilik tarihi zorunludur"),
  inspectionDue: z.string().min(1, "Muayene tarihi zorunludur"),
  insuranceDue: z.string().min(1, "Sigorta tarihi zorunludur"),
  status: z.enum(["active", "maintenance", "inactive"]),
});

export type VehicleFormValues = z.infer<typeof vehicleFormSchema>;

export const checklistTemplateFormSchema = z.object({
  title: z.string().min(2, "Başlık en az 2 karakter olmalıdır"),
  category: z.string().min(1, "Kategori zorunludur"),
  description: z.string().optional(),
  frequency: z.string().min(1, "Periyot zorunludur"),
});

export type ChecklistTemplateFormValues = z.infer<typeof checklistTemplateFormSchema>;

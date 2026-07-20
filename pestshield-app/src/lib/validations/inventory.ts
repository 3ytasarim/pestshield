import { z } from "zod";

export const addStockFormSchema = z.object({
  productId: z.string().min(1, "Ürün seçiniz"),
  quantity: z.number().min(0.01, "Miktar 0'dan büyük olmalıdır"),
  description: z.string(),
});

export type AddStockFormValues = z.infer<typeof addStockFormSchema>;

export const newProductFormSchema = z.object({
  name: z.string().min(2, "Ürün adı en az 2 karakter olmalıdır"),
  category: z.enum(["ilac", "malzeme", "ekipman"]),
  unit: z.enum(["adet", "litre", "ml", "kg", "gr"]),
  warehouseId: z.string().min(1, "Depo seçiniz"),
  manufacturer: z.string(),
  startingStock: z.number().min(0, "Başlangıç miktarı 0 veya üzeri olmalıdır"),
  criticalLevel: z.number().min(0, "Kritik seviye 0 veya üzeri olmalıdır"),
  isBiosidal: z.boolean(),
  licenseNumber: z.string(),
  activeIngredient: z.string(),
  defaultDose: z.string(),
  targetOrganisms: z.string(),
  packageAmount: z.string(),
  antidote: z.string(),
  usageAreas: z.array(z.string()),
  licenseFileDataUrl: z.string().nullable(),
  licenseFileName: z.string().nullable(),
  msdsFileDataUrl: z.string().nullable(),
  msdsFileName: z.string().nullable(),
});

export type NewProductFormValues = z.infer<typeof newProductFormSchema>;

export const warehouseFormSchema = z.object({
  name: z.string().min(2, "Depo adı en az 2 karakter olmalıdır"),
  type: z.enum(["main", "vehicle", "branch"]),
  address: z.string().min(2, "Adres zorunludur"),
  manager: z.string().min(2, "Sorumlu kişi zorunludur"),
  phone: z.string().min(7, "Geçerli bir telefon numarası girin"),
  capacityNote: z.string(),
});

export type WarehouseFormValues = z.infer<typeof warehouseFormSchema>;

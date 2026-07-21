import { z } from "zod";

export const companyUserFormSchema = z.object({
  name: z.string().min(2, "Ad soyad en az 2 karakter olmalıdır"),
  email: z.string().email("Geçerli bir e-posta girin"),
  password: z.string().min(8, "Şifre en az 8 karakter olmalıdır"),
  roleId: z.string().min(1, "Rol seçiniz"),
});

export type CompanyUserFormValues = z.infer<typeof companyUserFormSchema>;

export const companyUserUpdateSchema = z.object({
  name: z.string().min(2, "Ad soyad en az 2 karakter olmalıdır"),
  email: z.string().email("Geçerli bir e-posta girin"),
  roleId: z.string().min(1, "Rol seçiniz"),
  password: z.string().min(8, "Şifre en az 8 karakter olmalıdır").optional().or(z.literal("")),
  isActive: z.boolean(),
});

export type CompanyUserUpdateValues = z.infer<typeof companyUserUpdateSchema>;

const permissionActionsSchema = z.object({
  view: z.boolean().optional(),
  create: z.boolean().optional(),
  edit: z.boolean().optional(),
  delete: z.boolean().optional(),
});

export const companyRoleFormSchema = z.object({
  name: z.string().min(2, "Rol adı en az 2 karakter olmalıdır"),
  visibleNavHrefs: z.array(z.string()).default([]),
  permissions: z.record(z.string(), permissionActionsSchema).default({}),
});

export type CompanyRoleFormValues = z.infer<typeof companyRoleFormSchema>;

/**
 * PATCH için ayrı, `.default()` İÇERMEYEN şema — `companyRoleFormSchema.partial()`
 * kullanılırsa Zod'un `.default()`'u eksik alanlarda bile devreye girer (undefined'ı
 * `[]`/`{}`'ya çevirir), bu da Roller'den kaydedince permissions'ı, Yetkiler'den
 * kaydedince visibleNavHrefs'i sessizce sıfırlardı. Burada alan hiç gönderilmediyse
 * `parsed.data.X === undefined` kontrolü gerçekten "dokunulmadı" anlamına gelir.
 */
export const companyRoleUpdateSchema = z.object({
  name: z.string().min(2, "Rol adı en az 2 karakter olmalıdır").optional(),
  visibleNavHrefs: z.array(z.string()).optional(),
  permissions: z.record(z.string(), permissionActionsSchema).optional(),
});

export type CompanyRoleUpdateValues = z.infer<typeof companyRoleUpdateSchema>;

export const messageTemplateFormSchema = z.object({
  channel: z.enum(["email", "whatsapp"]),
  trigger: z.enum(["work_order_created"]),
  isActive: z.boolean().default(true),
  subject: z.string().max(200).optional(),
  body: z.string().min(1, "Mesaj içeriği zorunludur").max(4000),
  metaTemplateName: z.string().max(200).optional(),
  metaLanguageCode: z.string().max(10).optional(),
});

export type MessageTemplateFormValues = z.infer<typeof messageTemplateFormSchema>;

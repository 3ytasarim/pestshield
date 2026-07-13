import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().min(1, "E-posta zorunludur").email("Geçerli bir e-posta adresi girin"),
  password: z.string().min(8, "Şifre en az 8 karakter olmalıdır"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

/**
 * Sign Up = yeni bir müşteri Firması kaydı (bkz. POST /companies/register).
 * Pak İş personeli (admin/tech) hesapları public sign-up'tan asla
 * oluşturulmaz - ya admin tarafından ya da (çalışan için) firma sahibi
 * tarafından uygulama içinden açılır.
 */
export const signupSchema = z
  .object({
    companyName: z.string().min(2, "Firma adı en az 2 karakter olmalıdır"),
    contactEmail: z
      .string()
      .min(1, "İletişim e-postası zorunludur")
      .email("Geçerli bir e-posta adresi girin"),
    fullName: z.string().min(2, "Ad soyad en az 2 karakter olmalıdır"),
    email: z.string().min(1, "E-posta zorunludur").email("Geçerli bir e-posta adresi girin"),
    password: z.string().min(8, "Şifre en az 8 karakter olmalıdır"),
    confirmPassword: z.string().min(8, "Şifre en az 8 karakter olmalıdır"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Şifreler eşleşmiyor",
    path: ["confirmPassword"],
  });

export type SignupFormValues = z.infer<typeof signupSchema>;

export const activateLicenseSchema = z.object({
  key: z.string().min(8, "Geçerli bir lisans anahtarı girin"),
});

export type ActivateLicenseFormValues = z.infer<typeof activateLicenseSchema>;

export const inviteEmployeeSchema = z.object({
  fullName: z.string().min(2, "Ad soyad en az 2 karakter olmalıdır"),
  email: z.string().min(1, "E-posta zorunludur").email("Geçerli bir e-posta adresi girin"),
  password: z.string().min(8, "Şifre en az 8 karakter olmalıdır"),
});

export type InviteEmployeeFormValues = z.infer<typeof inviteEmployeeSchema>;

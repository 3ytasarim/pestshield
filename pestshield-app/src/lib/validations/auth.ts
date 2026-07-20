import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().min(1, "E-posta zorunludur").email("Geçerli bir e-posta adresi girin"),
  password: z.string().min(8, "Şifre en az 8 karakter olmalıdır"),
  /** 2FA aktifse ikinci adımda gönderilir; NextAuth authorize() içinde doğrulanır. */
  otp: z.string().optional(),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const companyRegisterSchema = z
  .object({
    companyName: z.string().min(2, "Firma adı en az 2 karakter olmalıdır"),
    fullName: z.string().min(2, "Ad soyad en az 2 karakter olmalıdır"),
    email: z.string().min(1, "E-posta zorunludur").email("Geçerli bir e-posta adresi girin"),
    password: z.string().min(8, "Şifre en az 8 karakter olmalıdır"),
    confirmPassword: z.string().min(8, "Şifre en az 8 karakter olmalıdır"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Şifreler eşleşmiyor",
    path: ["confirmPassword"],
  });

export type CompanyRegisterFormValues = z.infer<typeof companyRegisterSchema>;

/** Süper admin tarafından yeni bir Pest Control firma hesabı oluşturulurken kullanılır. */
export const adminCreateCompanySchema = z.object({
  companyName: z.string().min(2, "Firma adı en az 2 karakter olmalıdır"),
  email: z.string().min(1, "E-posta zorunludur").email("Geçerli bir e-posta adresi girin"),
  password: z.string().min(8, "Şifre en az 8 karakter olmalıdır"),
  address: z.string().optional(),
  phone: z.string().optional(),
  logoUrl: z.string().optional(),
});

export type AdminCreateCompanyFormValues = z.infer<typeof adminCreateCompanySchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().min(1, "E-posta zorunludur").email("Geçerli bir e-posta adresi girin"),
});

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Şifre en az 8 karakter olmalıdır"),
    confirmPassword: z.string().min(8, "Şifre en az 8 karakter olmalıdır"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Şifreler eşleşmiyor",
    path: ["confirmPassword"],
  });

export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export const otpSchema = z.object({
  otp: z.string().length(6, "Kod 6 haneli olmalıdır"),
});

export type OtpFormValues = z.infer<typeof otpSchema>;

export const companySettingsSchema = z.object({
  companyName: z.string().min(1, "Firma adı zorunludur"),
  authorizedName: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  logo: z.string().nullable().optional(),
});

export type CompanySettingsFormValues = z.infer<typeof companySettingsSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Mevcut şifrenizi girin"),
    newPassword: z.string().min(8, "Yeni şifre en az 8 karakter olmalıdır"),
    confirmNewPassword: z.string().min(8, "Yeni şifre en az 8 karakter olmalıdır"),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Yeni şifreler eşleşmiyor",
    path: ["confirmNewPassword"],
  });

export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

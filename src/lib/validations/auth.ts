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

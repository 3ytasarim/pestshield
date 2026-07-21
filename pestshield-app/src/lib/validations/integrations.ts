import { z } from "zod";

export const parasutConnectSchema = z.object({
  clientId: z.string().min(1, "Client ID zorunludur"),
  clientSecret: z.string().min(1, "Client Secret zorunludur"),
  authCode: z.string().min(1, "Yetkilendirme kodu zorunludur"),
});

export type ParasutConnectValues = z.infer<typeof parasutConnectSchema>;

export const parasutSelectCompanySchema = z.object({
  companyId: z.string().min(1, "Firma seçimi zorunludur"),
  companyName: z.string().min(1),
});

export type ParasutSelectCompanyValues = z.infer<typeof parasutSelectCompanySchema>;

export const googleCalendarSelectCalendarSchema = z.object({
  calendarId: z.string().min(1, "Takvim seçimi zorunludur"),
  calendarName: z.string().min(1),
});

export type GoogleCalendarSelectCalendarValues = z.infer<typeof googleCalendarSelectCalendarSchema>;

export type SmtpEncryption = "none" | "ssl" | "tls";

export const smtpConnectSchema = z.object({
  host: z.string().min(1, "Sunucu adresi zorunludur"),
  port: z.coerce.number().int().min(1).max(65535),
  encryption: z.enum(["none", "ssl", "tls"] satisfies SmtpEncryption[]),
  username: z.string().optional(),
  password: z.string().optional(),
  fromName: z.string().optional(),
  fromEmail: z.string().email("Geçerli bir e-posta adresi girin"),
});

export type SmtpConnectValues = z.infer<typeof smtpConnectSchema>;

export const whatsAppConnectSchema = z.object({
  accessToken: z.string().min(1, "Erişim jetonu (access token) zorunludur"),
  phoneNumberId: z.string().min(1, "Telefon Numarası ID'si zorunludur"),
  businessAccountId: z.string().optional(),
  apiVersion: z.string().optional(),
});

export type WhatsAppConnectValues = z.infer<typeof whatsAppConnectSchema>;

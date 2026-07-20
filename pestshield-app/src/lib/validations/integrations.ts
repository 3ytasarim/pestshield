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

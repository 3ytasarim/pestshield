import { z } from "zod";

export const dailyReportSchema = z.object({
  reportDate: z.string().min(1, "Rapor tarihi zorunludur"),
  description: z.string().min(1, "Açıklama zorunludur"),
});

export type DailyReportValues = z.infer<typeof dailyReportSchema>;

export const technicalReportSchema = z.object({
  customerId: z.string().min(1, "Müşteri zorunludur"),
  reportDate: z.string().min(1, "Rapor tarihi zorunludur"),
  description: z.string().min(1, "Açıklama zorunludur"),
  documentName: z.string().min(1, "Belge adı zorunludur"),
  fileDataUrl: z.string().min(1, "Belge zorunludur"),
  fileName: z.string().min(1),
  fileType: z.string().default(""),
});

export type TechnicalReportValues = z.infer<typeof technicalReportSchema>;

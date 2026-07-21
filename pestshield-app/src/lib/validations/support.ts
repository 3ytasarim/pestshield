import { z } from "zod";

export const supportTicketFormSchema = z.object({
  subject: z.string().min(3, "Konu en az 3 karakter olmalı").max(200),
  body: z.string().min(3, "Mesaj en az 3 karakter olmalı").max(4000),
});
export type SupportTicketFormValues = z.infer<typeof supportTicketFormSchema>;

export const supportTicketMessageFormSchema = z.object({
  body: z.string().min(1, "Mesaj boş olamaz").max(4000),
});
export type SupportTicketMessageFormValues = z.infer<typeof supportTicketMessageFormSchema>;

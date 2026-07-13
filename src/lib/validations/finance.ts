import { z } from "zod";

export const collectPaymentFormSchema = z.object({
  customerId: z.string().min(1, "Müşteri seçiniz"),
  amount: z.number().min(0.01, "Tutar 0'dan büyük olmalıdır"),
  date: z.string().min(1, "Tarih zorunludur"),
  method: z.enum(["nakit", "kart", "havale"]),
  description: z.string(),
});

export type CollectPaymentFormValues = z.infer<typeof collectPaymentFormSchema>;

export const invoiceFormSchema = z.object({
  customerId: z.string().min(1, "Müşteri seçiniz"),
  description: z.string().min(2, "Açıklama zorunludur"),
  amount: z.number().min(0.01, "Tutar 0'dan büyük olmalıdır"),
  issueDate: z.string().min(1, "Düzenleme tarihi zorunludur"),
  dueDate: z.string().min(1, "Vade tarihi zorunludur"),
});

export type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;

export const bankAccountFormSchema = z.object({
  bankName: z.string().min(2, "Banka adı zorunludur"),
  accountName: z.string().min(2, "Hesap adı zorunludur"),
  iban: z.string().min(10, "Geçerli bir IBAN girin"),
  currency: z.enum(["TRY", "USD", "EUR"]),
  balance: z.number().min(0, "Bakiye 0 veya üzeri olmalıdır"),
});

export type BankAccountFormValues = z.infer<typeof bankAccountFormSchema>;

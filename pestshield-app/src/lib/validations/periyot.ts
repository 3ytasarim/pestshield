import { z } from "zod";

export const generateBatchSchema = z.object({
  serviceOrderId: z.string().min(1),
  namePrefix: z.string().min(1, "İsim zorunludur"),
  personnelName: z.string().default(""),
  startDate: z.string().min(1, "Başlangıç tarihi zorunludur"),
  endDate: z.string().min(1, "Bitiş tarihi zorunludur"),
  startTime: z.string().default(""),
  endTime: z.string().default(""),
  dayOfMonth: z.number().int().min(1).max(31).default(1),
  donem: z.enum(["daily", "weekly", "monthly"]),
});

export type GenerateBatchValues = z.infer<typeof generateBatchSchema>;

export const addOccurrenceSchema = z.object({
  batchId: z.string().min(1),
  serviceOrderId: z.string().min(1),
  customerId: z.string().min(1),
  personnelName: z.string().default(""),
  periodDate: z.string().min(1, "Tarih zorunludur"),
  startTime: z.string().default(""),
  endTime: z.string().default(""),
});

export type AddOccurrenceValues = z.infer<typeof addOccurrenceSchema>;

const biocidalUsageSchema = z.object({
  id: z.string().optional(),
  productId: z.string().optional(),
  productName: z.string().default(""),
  amount: z.string().default(""),
  unit: z.string().default(""),
});

export const updateOccurrenceSchema = z.object({
  personnelName: z.string().optional(),
  periodDate: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  documentCount: z.number().int().min(0).optional(),
  biocidalProducts: z.string().optional(),
  biocidalProductUsages: z.array(biocidalUsageSchema).optional(),
});

export type UpdateOccurrenceValues = z.infer<typeof updateOccurrenceSchema>;

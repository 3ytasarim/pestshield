import { z } from "zod";

export const createDocumentSchema = z.object({
  name: z.string().min(1, "Belge adı zorunludur"),
  fileDataUrl: z.string().min(1, "Belge zorunludur"),
  fileName: z.string().min(1),
  fileSizeKb: z.number().int().nonnegative().default(0),
});

export type CreateDocumentValues = z.infer<typeof createDocumentSchema>;

export const renameDocumentSchema = z.object({
  name: z.string().min(1, "Belge adı zorunludur"),
});

export type RenameDocumentValues = z.infer<typeof renameDocumentSchema>;

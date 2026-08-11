import { z } from "zod";

export const pestCategorySchema = z.enum(["kemirgen", "surunen_hasere", "ucan_hasere", "depo_zararlisi"]);
export const pestIconKeySchema = z.enum(["rodent", "roach", "ant", "fly", "mosquito", "spider", "wasp", "beetle"]);
export const equipmentCategorySchema = z.enum(["trap", "bait", "uv", "pheromone"]);

export const pestSpeciesFormSchema = z.object({
  name: z.string().min(1, "Tür adı zorunlu"),
  scientificName: z.string(),
  category: pestCategorySchema,
  riskLevel: z.enum(["low", "medium", "high", "critical"]),
  activeSeason: z.string(),
  icon: pestIconKeySchema,
  contentHtml: z.string(),
});
export type PestSpeciesFormValues = z.infer<typeof pestSpeciesFormSchema>;

export const equipmentGuideFormSchema = z.object({
  category: equipmentCategorySchema,
  title: z.string().min(1, "Başlık zorunlu"),
  contentHtml: z.string(),
  targetSpeciesIds: z.array(z.string()),
  relatedProductKeywords: z.array(z.string()),
});
export type EquipmentGuideFormValues = z.infer<typeof equipmentGuideFormSchema>;

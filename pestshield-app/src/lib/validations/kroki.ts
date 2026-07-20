import { z } from "zod";

const krokiStationTypeEnum = z.enum(["zehirli", "zehirsiz", "ic_uckun", "dis_uckun"]);

const krokiStationSchema = z.object({
  id: z.string().optional(),
  type: krokiStationTypeEnum,
  x: z.number(),
  y: z.number(),
  stationId: z.string().default(""),
});

export const createKrokiSketchSchema = z.object({
  name: z.string().min(1, "İsim zorunludur"),
  createdDate: z.string().min(1),
  imageDataUrl: z.string().min(1, "Görsel zorunludur"),
  fileSizeKb: z.number().default(0),
  stationSize: z.number().default(24),
  heatMapEnabled: z.boolean().default(false),
});

export type CreateKrokiSketchValues = z.infer<typeof createKrokiSketchSchema>;

export const updateKrokiSketchSchema = z.object({
  name: z.string().optional(),
  createdDate: z.string().optional(),
  stationSize: z.number().optional(),
  heatMapEnabled: z.boolean().optional(),
  layerVisibility: z
    .object({
      zehirli: z.boolean(),
      zehirsiz: z.boolean(),
      ic_uckun: z.boolean(),
      dis_uckun: z.boolean(),
    })
    .partial()
    .optional(),
  stations: z.array(krokiStationSchema).optional(),
});

export type UpdateKrokiSketchValues = z.infer<typeof updateKrokiSketchSchema>;

const stationInspectionFieldsSchema = z.object({
  tuketim: z.string().optional(),
  hareket: z.string().optional(),
  tur1: z.string().optional(),
  tur2: z.string().optional(),
  degisim: z.string().optional(),
  tur: z.string().optional(),
  sayim: z.string().optional(),
  olcum: z.string().optional(),
  florasanDurumu: z.string().optional(),
});

export const saveStationInspectionsSchema = z.object({
  inspections: z.array(
    stationInspectionFieldsSchema.extend({
      krokiSketchId: z.string().min(1),
      krokiStationId: z.string().min(1),
      stationType: krokiStationTypeEnum,
    }),
  ),
});

export type SaveStationInspectionsValues = z.infer<typeof saveStationInspectionsSchema>;
